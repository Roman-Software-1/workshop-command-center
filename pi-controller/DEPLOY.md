# Deployment & Commissioning Checklist (clockstation)

## Deploy steps
1. In the workshop screen, open **Bar LEDs → Setup → Generate key** and copy the token.
2. Copy this folder to `rgablowski@clockstation:~/led-controller` and run `bash install.sh`.

## Commissioning checklist
- [Software] `python3 -m unittest test_controller.py` passes on the Pi.
- [Software] `systemctl status led-controller.service` shows `active (running)`.
- [Software] Workshop screen Setup tab switches from **Offline** to **Applied by controller**.
- [Hardware visual] Tap **Off** — strip turns dark immediately.
- [Hardware visual] Reboot Pi (`sudo reboot`) while Off — strip stays dark after reboot.
- [Hardware visual] Open **Setup → Group Calibration**, probe indices to locate the last lit group, and save the real count.
