# LED Controller Data Contract (v1)

## GET `/api/public/led/device/poll?since=<rev>&wait=20000`
Header: `Authorization: Bearer <device-token>`
```json
{
  "deviceId": "bar-counter",
  "schemaVersion": 1,
  "revision": 4,
  "state": {
    "on": true, "hue": 0, "sat": 95, "brightness": 85, "effect": "rainbow",
    "speed": 45, "direction": 1, "spacing": 48, "chaseWidth": 8,
    "breathing": true, "breathPeriodSec": 8, "breathMin": 55, "breathMax": 100,
    "transitionMs": 400, "paused": false, "preset": "rainbow"
  },
  "hardware": { "groupCount": 1000, "groupCountProvisional": true, "direction": 1 }
}
```

## POST `/api/public/led/device/report`
Header: `Authorization: Bearer <device-token>`
```json
{
  "appliedRevision": 4,
  "bootId": "8f2e9c0a-...",
  "controllerVersion": "1.0.0",
  "status": "running",
  "lastError": null
}
```
