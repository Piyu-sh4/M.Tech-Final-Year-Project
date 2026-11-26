-- ─────────────────────────────────────────────────────────
--  migrate_route_coords.sql
--  Add lat/lng coordinates to cab_routes for map display
--  Run AFTER migrate_cab_v2.sql
-- ─────────────────────────────────────────────────────────

ALTER TABLE cab_routes
  ADD COLUMN IF NOT EXISTS pickup_lat  DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pickup_lng  DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS drop_lat    DECIMAL(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS drop_lng    DECIMAL(10,7) DEFAULT NULL;

-- Patna, Bihar coordinates for each route pickup stop
-- Office = 25.6093, 85.1376 (IIT Patna / Bihta area reference)
UPDATE cab_routes SET
  pickup_lat = 25.6205, pickup_lng = 85.1310,
  drop_lat   = 25.6093, drop_lng   = 85.1376
WHERE route_id = 1; -- Zone A – Rajiv Nagar Bus Stop

UPDATE cab_routes SET
  pickup_lat = 25.6012, pickup_lng = 85.1482,
  drop_lat   = 25.6093, drop_lng   = 85.1376
WHERE route_id = 2; -- Zone B – Kankarbagh Crossing

UPDATE cab_routes SET
  pickup_lat = 25.6097, pickup_lng = 85.1121,
  drop_lat   = 25.6093, drop_lng   = 85.1376
WHERE route_id = 3; -- Zone C – Boring Road Petrol Pump

UPDATE cab_routes SET
  pickup_lat = 25.6214, pickup_lng = 85.1268,
  drop_lat   = 25.6093, drop_lng   = 85.1376
WHERE route_id = 4; -- Zone D – Patliputra Colony Gate

UPDATE cab_routes SET
  pickup_lat = 25.6093, pickup_lng = 85.1376,
  drop_lat   = 25.6093, drop_lng   = 85.1376
WHERE route_id = 5; -- Night Cab – Office Main Gate

COMMIT;
