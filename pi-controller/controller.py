#!/usr/bin/env python3
"""Workshop Bar Counter LED Controller for Raspberry Pi 3 (GPIO21, rpi_ws281x).

Exclusively owns GPIO21 via flock. Network polling runs in a background thread;
animation rendering runs on monotonic time and applies updates at frame boundaries.
"""
from __future__ import annotations

import argparse
import colorsys
import fcntl
import json
import math
import os
import queue
import signal
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from typing import Any

CONTROLLER_VERSION = "1.0.0"
VALID_EFFECTS = {
    "solid", "rgb_white", "rainbow", "chase", "ocean", "amber", "comet", "scanner", "fire"
}
DEFAULT_CACHE_PATH = Path("/var/lib/led-controller/state.json")
DEFAULT_LOCK_PATH = Path("/run/led-controller.lock")


def validate_state(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("state must be an object")
    effect = raw.get("effect", "rainbow")
    if effect not in VALID_EFFECTS:
        raise ValueError(f"unsupported effect: {effect}")
    on = bool(raw.get("on", False))
    hue = float(raw.get("hue", 0))
    sat = float(raw.get("sat", 95))
    brightness = int(raw.get("brightness", 85))
    speed = int(raw.get("speed", 45))
    direction = 1 if int(raw.get("direction", 1)) >= 0 else -1
    spacing = max(4, min(200, int(raw.get("spacing", 48))))
    chase_width = max(1, min(40, int(raw.get("chaseWidth", 8))))
    breathing = bool(raw.get("breathing", False))
    breath_period = max(2.0, min(20.0, float(raw.get("breathPeriodSec", 8.0))))
    breath_min = max(0, min(100, int(raw.get("breathMin", 55))))
    breath_max = max(max(1, breath_min), min(100, int(raw.get("breathMax", 100))))
    transition_ms = max(0, min(3000, int(raw.get("transitionMs", 400))))
    paused = bool(raw.get("paused", False))
    if not (0 <= hue <= 360 and 0 <= sat <= 100 and 0 <= brightness <= 100 and 1 <= speed <= 100):
        raise ValueError("numeric parameter out of range")
    probe = raw.get("calibrationProbe")
    if probe is not None:
        if not isinstance(probe, dict) or not isinstance(probe.get("indices"), list):
            raise ValueError("invalid calibrationProbe")
        indices = [int(i) for i in probe["indices"] if 0 <= int(i) < 2000][:32]
        probe = {"indices": indices, "brightness": max(5, min(40, int(probe.get("brightness", 18))))}
    return {
        "on": on,
        "hue": hue,
        "sat": sat,
        "brightness": brightness,
        "effect": effect,
        "speed": speed,
        "direction": direction,
        "spacing": spacing,
        "chaseWidth": chase_width,
        "breathing": breathing,
        "breathPeriodSec": breath_period,
        "breathMin": breath_min,
        "breathMax": breath_max,
        "transitionMs": transition_ms,
        "paused": paused,
        "calibrationProbe": probe,
    }


def save_cache_atomic(path: Path, revision: int, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps({"revision": revision, "state": state}, sort_keys=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), prefix=".state-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(payload)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def load_cache(path: Path) -> tuple[int, dict[str, Any]]:
    off_state = validate_state({"on": False, "effect": "solid", "hue": 0, "sat": 0, "brightness": 0, "speed": 50})
    if not path.exists():
        return 0, off_state
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        rev = max(0, int(data.get("revision", 0)))
        return rev, validate_state(data["state"])
    except Exception:
        return 0, off_state


def should_apply_revision(current_rev: int, incoming_rev: int) -> bool:
    return incoming_rev > current_rev


def max_frame_rate(group_count: int) -> float:
    # 24 bits/group @ 800kHz = 30us/group + 300us reset latch; keep headroom for Pi 3
    tx_sec = (group_count * 30e-6) + 0.0005
    return min(30.0, 0.7 / max(tx_sec, 0.001))


def hsv_to_rgb255(h_deg: float, s_pct: float, v_scale: float) -> tuple[int, int, int]:
    r, g, b = colorsys.hsv_to_rgb((h_deg % 360.0) / 360.0, max(0.0, min(1.0, s_pct / 100.0)), max(0.0, min(1.0, v_scale)))
    return int(r * 255), int(g * 255), int(b * 255)


def render_frame(state: dict[str, Any], count: int, phase: float, mono_t: float) -> list[tuple[int, int, int]]:
    if not state["on"] or state["brightness"] <= 0:
        return [(0, 0, 0)] * count

    probe = state.get("calibrationProbe")
    if probe:
        frame = [(0, 0, 0)] * count
        v = int(255 * (probe["brightness"] / 100.0))
        for idx in probe["indices"]:
            if 0 <= idx < count:
                frame[idx] = (v, v, v)
        return frame

    base_v = state["brightness"] / 100.0
    if state["breathing"]:
        period = state["breathPeriodSec"]
        wave = 0.5 - 0.5 * math.cos(2.0 * math.pi * (mono_t / period))
        bmin, bmax = state["breathMin"] / 100.0, state["breathMax"] / 100.0
        base_v *= bmin + (bmax - bmin) * wave

    eff = state["effect"]
    hue, sat = state["hue"], state["sat"]
    spacing = state["spacing"]
    width = state["chaseWidth"]
    out: list[tuple[int, int, int]] = [(0, 0, 0)] * count

    if eff == "solid":
        c = hsv_to_rgb255(hue, sat, base_v)
        return [c] * count
    if eff == "rgb_white":
        v = int(255 * base_v)
        return [(v, int(v * 0.96), int(v * 0.88))] * count
    if eff == "rainbow":
        for i in range(count):
            h = ((i - phase) % spacing) / spacing * 360.0
            out[i] = hsv_to_rgb255(h, sat, base_v)
        return out
    if eff == "chase":
        span = max(width * 2, spacing)
        for i in range(count):
            pos = (i - phase) % span
            if pos < width:
                out[i] = hsv_to_rgb255((hue + pos * 6) % 360, sat, base_v)
        return out
    if eff == "ocean":
        for i in range(count):
            w = 0.5 + 0.5 * math.sin((i - phase) * (2.0 * math.pi / spacing))
            out[i] = hsv_to_rgb255(180 + w * 45, sat, base_v * (0.55 + 0.45 * w))
        return out
    if eff == "amber":
        c = hsv_to_rgb255(26, min(100, max(80, sat)), base_v)
        return [c] * count
    if eff == "comet":
        head = phase % max(1, count)
        for i in range(count):
            dist = (head - i) % count
            if dist < width:
                fade = (1.0 - dist / width) ** 2
                out[i] = hsv_to_rgb255(hue, sat, base_v * fade)
        return out
    if eff == "scanner":
        cycle = max(1, (count - 1) * 2)
        p = phase % cycle
        head = p if p < count else cycle - p
        for i in range(count):
            dist = abs(i - head)
            if dist < width:
                out[i] = hsv_to_rgb255(hue, sat, base_v * (1.0 - dist / width))
        return out
    # fire
    for i in range(count):
        flicker = 0.65 + 0.35 * math.sin(i * 1.7 + phase * 0.9) * math.cos(i * 0.7 - phase * 1.3)
        out[i] = hsv_to_rgb255(12 + flicker * 20, 96, base_v * max(0.2, min(1.0, flicker)))
    return out


class StripDriver:
    def __init__(self, count: int, simulate: bool):
        self.count = count
        self.simulate = simulate
        self._strip = None
        if not simulate:
            from rpi_ws281x import PixelStrip, WS2811_STRIP_GRB  # type: ignore
            self._strip = PixelStrip(count, 21, 800000, 10, False, 255, 0, WS2811_STRIP_GRB)
            self._strip.begin()

    def show(self, frame: list[tuple[int, int, int]]) -> None:
        if self.simulate:
            return
        from rpi_ws281x import Color  # type: ignore
        assert self._strip is not None
        for i, (r, g, b) in enumerate(frame[: self.count]):
            self._strip.setPixelColor(i, Color(r, g, b))
        self._strip.show()

    def black(self) -> None:
        self.show([(0, 0, 0)] * self.count)


def main() -> int:
    parser = argparse.ArgumentParser(description="Workshop LED controller")
    parser.add_argument("--api-url", default=os.environ.get("LED_API_URL", "https://benchside-status-bloom.lovable.app"))
    parser.add_argument("--token-file", default=os.environ.get("LED_TOKEN_FILE", "/etc/led-controller/token"))
    parser.add_argument("--cache-file", default=str(DEFAULT_CACHE_PATH))
    parser.add_argument("--lock-file", default=str(DEFAULT_LOCK_PATH))
    parser.add_argument("--group-count", type=int, default=1000)
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()

    lock_f = open(args.lock_file, "w")
    try:
        fcntl.flock(lock_f.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        print("Another led-controller instance is already running.", file=sys.stderr)
        return 1

    boot_id = str(uuid.uuid4())
    cache_path = Path(args.cache_file)
    applied_rev, active_state = load_cache(cache_path)
    driver = StripDriver(args.group_count, args.simulate)
    inbox: queue.Queue[tuple[int, dict[str, Any]]] = queue.Queue()
    stop_event = threading.Event()
    last_error: str | None = None

    def on_signal(_sig: int, _frame: Any) -> None:
        stop_event.set()

    signal.signal(signal.SIGTERM, on_signal)
    signal.signal(signal.SIGINT, on_signal)

    def read_token() -> str:
        return Path(args.token_file).read_text(encoding="utf-8").strip()

    def report_state(rev: int, status: str, err: str | None = None) -> None:
        try:
            body = json.dumps({
                "appliedRevision": rev,
                "bootId": boot_id,
                "controllerVersion": CONTROLLER_VERSION,
                "status": status,
                "lastError": err,
                "capabilities": {"effects": sorted(VALID_EFFECTS), "groupCount": driver.count, "simulate": args.simulate},
            }).encode("utf-8")
            req = urllib.request.Request(
                f"{args.api_url.rstrip('/')}/api/public/led/device/report",
                data=body,
                method="POST",
                headers={"Authorization": f"Bearer {read_token()}", "Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=10):
                pass
        except Exception:
            pass

    def net_loop() -> None:
        nonlocal last_error
        seen_rev = applied_rev
        while not stop_event.is_set():
            try:
                url = f"{args.api_url.rstrip('/')}/api/public/led/device/poll?since={seen_rev}&wait=20000"
                req = urllib.request.Request(url, headers={"Authorization": f"Bearer {read_token()}"})
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                inc_rev = int(data.get("revision", 0))
                if should_apply_revision(seen_rev, inc_rev):
                    validated = validate_state(data.get("state"))
                    seen_rev = inc_rev
                    inbox.put((inc_rev, validated))
                else:
                    report_state(applied_rev, "running", last_error)
            except Exception as exc:
                last_error = str(exc)[:200]
                stop_event.wait(3.0)

    threading.Thread(target=net_loop, daemon=True).start()

    fps = max_frame_rate(driver.count)
    frame_dt = 1.0 / fps
    phase = 0.0
    last_t = time.monotonic()

    try:
        while not stop_event.is_set():
            now = time.monotonic()
            dt = now - last_t
            last_t = now

            while not inbox.empty():
                inc_rev, inc_state = inbox.get_nowait()
                if should_apply_revision(applied_rev, inc_rev):
                    active_state = inc_state
                    applied_rev = inc_rev
                    save_cache_atomic(cache_path, applied_rev, active_state)
                    last_error = None
                    threading.Thread(target=report_state, args=(applied_rev, "running", None), daemon=True).start()

            if not active_state["paused"]:
                groups_per_sec = 0.2 + (active_state["speed"] / 100.0) * 6.0
                phase += dt * groups_per_sec * active_state["direction"]

            frame = render_frame(active_state, driver.count, phase, now)
            driver.show(frame)

            elapsed = time.monotonic() - now
            sleep_for = frame_dt - elapsed
            if sleep_for > 0:
                stop_event.wait(sleep_for)
    finally:
        driver.black()
        report_state(applied_rev, "stopping", None)
        lock_f.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
