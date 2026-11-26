#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/home/rgablowski/led-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
[ -f /home/rgablowski/led_strip_test.py ] && cp /home/rgablowski/led_strip_test.py "$BACKUP_DIR/"
[ -f /etc/systemd/system/led-strip-rainbow.service ] && sudo cp /etc/systemd/system/led-strip-rainbow.service "$BACKUP_DIR/"
[ -f /etc/systemd/system/led-strip-white.service ] && sudo cp /etc/systemd/system/led-strip-white.service "$BACKUP_DIR/"

sudo systemctl stop led-strip-rainbow.service led-strip-white.service 2>/dev/null || true
sudo systemctl disable led-strip-rainbow.service led-strip-white.service 2>/dev/null || true

sudo mkdir -p /opt/led-controller /etc/led-controller /var/lib/led-controller
sudo cp controller.py simulator.py ledctl.py /opt/led-controller/
sudo chmod +x /opt/led-controller/controller.py /opt/led-controller/ledctl.py
sudo ln -sf /opt/led-controller/ledctl.py /usr/local/bin/ledctl

if [ ! -f /etc/led-controller/token ]; then
  echo "Paste your device token from the Workshop Screen -> Bar LEDs -> Setup tab:"
  read -r -s TOKEN
  printf '%s\n' "$TOKEN" | sudo tee /etc/led-controller/token >/dev/null
  sudo chmod 600 /etc/led-controller/token
fi

sudo cp led-controller.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now led-controller.service
echo "Installed! Backup saved at $BACKUP_DIR"
