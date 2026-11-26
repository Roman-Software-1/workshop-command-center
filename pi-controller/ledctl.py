#!/usr/bin/env python3
"""Local emergency stop / Off helper for clockstation."""
import subprocess
import sys

if len(sys.argv) < 2 or sys.argv[1] != "off":
    print("Usage: ledctl off")
    raise SystemExit(1)

subprocess.run(["sudo", "systemctl", "stop", "led-controller.service"], check=False)
print("Stopped led-controller.service (SIGTERM sends black to the strip).")
