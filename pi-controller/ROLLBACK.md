# Rollback to Previous Rainbow Service
```bash
sudo systemctl stop led-controller.service
sudo systemctl disable led-controller.service
sudo systemctl enable --now led-strip-rainbow.service
```
