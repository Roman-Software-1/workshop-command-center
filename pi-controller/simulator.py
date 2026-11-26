#!/usr/bin/env python3
"""Development simulator — runs controller.py without GPIO hardware.
Clearly labeled simulator: does NOT drive real LEDs.
"""
import subprocess
import sys
from pathlib import Path

cmd = [sys.executable, str(Path(__file__).parent / "controller.py"), "--simulate", *sys.argv[1:]]
raise SystemExit(subprocess.call(cmd))
