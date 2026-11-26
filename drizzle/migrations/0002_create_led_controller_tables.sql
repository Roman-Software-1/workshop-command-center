CREATE TABLE public.led_devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT,
  token_prefix TEXT,
  group_count INTEGER NOT NULL DEFAULT 1000 CHECK (group_count >= 1 AND group_count <= 2000),
  group_count_provisional BOOLEAN NOT NULL DEFAULT true,
  direction SMALLINT NOT NULL DEFAULT 1 CHECK (direction IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.led_desired (
  device_id TEXT PRIMARY KEY REFERENCES public.led_devices(id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL DEFAULT 1,
  revision BIGINT NOT NULL DEFAULT 1,
  state JSONB NOT NULL,
  request_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.led_reported (
  device_id TEXT PRIMARY KEY REFERENCES public.led_devices(id) ON DELETE CASCADE,
  applied_revision BIGINT NOT NULL DEFAULT 0,
  applied_state JSONB,
  boot_id TEXT,
  controller_version TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  capabilities JSONB,
  last_error TEXT,
  heartbeat_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.led_presets (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  state JSONB NOT NULL,
  swatch TEXT,
  custom BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.led_devices TO service_role;
GRANT ALL ON public.led_desired TO service_role;
GRANT ALL ON public.led_reported TO service_role;
GRANT ALL ON public.led_presets TO service_role;

ALTER TABLE public.led_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.led_desired ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.led_reported ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.led_presets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.apply_led_desired(
  p_device_id TEXT,
  p_base_revision BIGINT,
  p_request_id TEXT,
  p_state JSONB,
  p_force BOOLEAN DEFAULT false
)
RETURNS TABLE(outcome TEXT, revision BIGINT, state JSONB, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cur public.led_desired%ROWTYPE;
BEGIN
  SELECT * INTO cur FROM public.led_desired WHERE device_id = p_device_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown LED device: %', p_device_id;
  END IF;

  IF p_request_id IS NOT NULL AND cur.request_id = p_request_id THEN
    RETURN QUERY SELECT 'dedup'::TEXT, cur.revision, cur.state, cur.updated_at;
    RETURN;
  END IF;

  IF NOT p_force AND p_base_revision IS NOT NULL AND p_base_revision < cur.revision THEN
    RETURN QUERY SELECT 'stale'::TEXT, cur.revision, cur.state, cur.updated_at;
    RETURN;
  END IF;

  UPDATE public.led_desired
  SET revision = cur.revision + 1,
      state = p_state,
      request_id = p_request_id,
      updated_at = now()
  WHERE device_id = p_device_id
  RETURNING led_desired.revision, led_desired.state, led_desired.updated_at
  INTO cur.revision, cur.state, cur.updated_at;

  RETURN QUERY SELECT 'ok'::TEXT, cur.revision, cur.state, cur.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_led_desired(TEXT, BIGINT, TEXT, JSONB, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_led_desired(TEXT, BIGINT, TEXT, JSONB, BOOLEAN) TO service_role;

INSERT INTO public.led_devices (id, name, group_count, group_count_provisional, direction)
VALUES ('bar-counter', 'Bar counter (clockstation)', 1000, true, 1);

INSERT INTO public.led_desired (device_id, schema_version, revision, state)
VALUES (
  'bar-counter',
  1,
  1,
  '{
    "on": true,
    "hue": 0,
    "sat": 95,
    "brightness": 85,
    "effect": "rainbow",
    "speed": 45,
    "direction": 1,
    "spacing": 48,
    "chaseWidth": 8,
    "breathing": true,
    "breathPeriodSec": 8,
    "breathMin": 55,
    "breathMax": 100,
    "transitionMs": 400,
    "paused": false,
    "preset": "rainbow"
  }'::jsonb
);

INSERT INTO public.led_reported (device_id, applied_revision, status)
VALUES ('bar-counter', 0, 'offline');

INSERT INTO public.led_presets (id, label, state, swatch, custom, sort_order) VALUES
  ('workshop', 'Workshop', '{"hue":38,"sat":40,"brightness":85,"effect":"solid","speed":50,"direction":1,"spacing":48,"chaseWidth":8,"breathing":false,"breathPeriodSec":8,"breathMin":55,"breathMax":100,"transitionMs":400}'::jsonb, NULL, false, 1),
  ('rainbow', 'Rainbow', '{"hue":0,"sat":95,"brightness":85,"effect":"rainbow","speed":45,"direction":1,"spacing":48,"chaseWidth":8,"breathing":true,"breathPeriodSec":8,"breathMin":55,"breathMax":100,"transitionMs":400}'::jsonb, 'conic-gradient(hsl(0 95% 55%), hsl(90 95% 55%), hsl(180 95% 55%), hsl(270 95% 55%), hsl(360 95% 55%))', false, 2),
  ('sunset', 'Sunset', '{"hue":24,"sat":95,"brightness":75,"effect":"amber","speed":35,"direction":1,"spacing":48,"chaseWidth":8,"breathing":true,"breathPeriodSec":8,"breathMin":45,"breathMax":100,"transitionMs":400}'::jsonb, 'linear-gradient(135deg, hsl(14 95% 55%), hsl(42 95% 55%))', false, 3),
  ('fireplace', 'Fireplace', '{"hue":18,"sat":95,"brightness":70,"effect":"fire","speed":60,"direction":1,"spacing":48,"chaseWidth":8,"breathing":false,"breathPeriodSec":8,"breathMin":55,"breathMax":100,"transitionMs":400}'::jsonb, 'linear-gradient(135deg, hsl(4 92% 48%), hsl(38 98% 55%))', false, 4),
  ('ocean', 'Ocean', '{"hue":200,"sat":88,"brightness":75,"effect":"ocean","speed":30,"direction":1,"spacing":48,"chaseWidth":8,"breathing":true,"breathPeriodSec":8,"breathMin":55,"breathMax":100,"transitionMs":400}'::jsonb, 'linear-gradient(135deg, hsl(185 90% 50%), hsl(225 90% 55%))', false, 5),
  ('cyberpunk', 'Cyberpunk', '{"hue":295,"sat":90,"brightness":90,"effect":"chase","speed":65,"direction":1,"spacing":48,"chaseWidth":8,"breathing":false,"breathPeriodSec":8,"breathMin":55,"breathMax":100,"transitionMs":400}'::jsonb, 'linear-gradient(135deg, hsl(310 95% 58%), hsl(185 95% 52%))', false, 6),
  ('comet', 'Comet', '{"hue":210,"sat":92,"brightness":85,"effect":"comet","speed":60,"direction":1,"spacing":48,"chaseWidth":10,"breathing":false,"breathPeriodSec":8,"breathMin":55,"breathMax":100,"transitionMs":400}'::jsonb, 'linear-gradient(135deg, hsl(210 95% 65%), hsl(210 95% 20%))', false, 7),
  ('scanner', 'Scanner', '{"hue":4,"sat":95,"brightness":85,"effect":"scanner","speed":55,"direction":1,"spacing":48,"chaseWidth":6,"breathing":false,"breathPeriodSec":8,"breathMin":55,"breathMax":100,"transitionMs":400}'::jsonb, 'linear-gradient(90deg, hsl(4 95% 20%), hsl(4 95% 58%), hsl(4 95% 20%))', false, 8);
