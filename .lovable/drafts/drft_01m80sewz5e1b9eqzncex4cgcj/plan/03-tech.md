## Technical details (built after Cloud is enabled in main)
- **Table:** `clock_events (id, device_id, kind in|break|out, at timestamptz)`, with RLS, and the dashboard able to read it. Derive totals with SQL views or in a server function.
- **Endpoint:** `POST /api/public/clock` with a JSON body `{ kind }`. It checks a `PI_DEVICE_KEY` secret in an `Authorization: Bearer` header and inserts the row using the admin client. Repeated presses within 2s are ignored.
- **Dashboard:** subscribe to Supabase Realtime on `clock_events`, and drive `status`, the timer, and the totals from it instead of `panel-data.ts` samples.
- **Pi script:** a Python `gpiozero` listener calls the endpoint and runs as a systemd service. It keeps a small offline queue and retries until delivered.
- **Kiosk computer:** Chromium in `--kiosk` mode pointed at the published `/a` URL.
