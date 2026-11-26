-- ================================================================
--  CAB BOOKING SYSTEM — Migration
--  WorkforceIQ v7.0
-- ================================================================

-- ── Vehicle / Route options ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_routes (
  route_id    INT AUTO_INCREMENT PRIMARY KEY,
  route_name  VARCHAR(100) NOT NULL,        -- e.g. "Zone A – Rajiv Nagar"
  zone        VARCHAR(60)  NOT NULL,
  pickup_stop VARCHAR(150) NOT NULL,
  pickup_time TIME         NOT NULL,        -- fixed pickup time
  drop_time   TIME         NOT NULL,        -- fixed drop time
  total_seats INT          DEFAULT 12,
  is_active   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── Vehicle types ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_vehicles (
  vehicle_id   INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_type ENUM('Bus','Car','Bike') NOT NULL,
  label        VARCHAR(80)  NOT NULL,       -- e.g. "AC Bus – 12 seater"
  capacity     INT          DEFAULT 1,
  is_active    BOOLEAN      DEFAULT TRUE
);

-- ── Bookings ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_bookings (
  booking_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT          NOT NULL,
  route_id      INT          NOT NULL,
  vehicle_id    INT          NOT NULL,
  shift_id      INT          DEFAULT NULL,  -- linked shift (nullable)
  booking_date  DATE         NOT NULL,      -- the travel date
  trip_type     ENUM('pickup','drop','both') DEFAULT 'both',
  night_cab     BOOLEAN      DEFAULT FALSE, -- true = night cab request
  seat_number   INT          DEFAULT NULL,  -- assigned seat
  status        ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  approved_by   INT          DEFAULT NULL,
  approved_at   TIMESTAMP    DEFAULT NULL,
  reject_reason VARCHAR(255) DEFAULT NULL,
  special_note  TEXT         DEFAULT NULL,
  booked_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(user_id)   ON DELETE CASCADE,
  FOREIGN KEY (route_id)   REFERENCES cab_routes(route_id),
  FOREIGN KEY (vehicle_id) REFERENCES cab_vehicles(vehicle_id),
  FOREIGN KEY (shift_id)   REFERENCES shifts(shift_id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(user_id)  ON DELETE SET NULL
);

-- ── Seed: routes ────────────────────────────────────────────────
INSERT IGNORE INTO cab_routes (route_id, route_name, zone, pickup_stop, pickup_time, drop_time, total_seats) VALUES
(1, 'Zone A – Rajiv Nagar',  'North', 'Rajiv Nagar Bus Stop',  '08:15:00', '18:30:00', 12),
(2, 'Zone B – Kankarbagh',   'South', 'Kankarbagh Crossing',   '08:30:00', '18:45:00', 12),
(3, 'Zone C – Boring Road',  'West',  'Boring Road Petrol Pump','08:45:00', '19:00:00', 8),
(4, 'Zone D – Patliputra',   'East',  'Patliputra Colony Gate', '08:20:00', '18:35:00', 10),
(5, 'Night Cab – Any Zone',  'All',   'Office Main Gate',       '21:00:00', '22:30:00', 4);

-- ── Seed: vehicles ──────────────────────────────────────────────
INSERT IGNORE INTO cab_vehicles (vehicle_id, vehicle_type, label, capacity) VALUES
(1, 'Bus',  'AC Bus – 12 Seater',      12),
(2, 'Bus',  'Mini Bus – 8 Seater',      8),
(3, 'Car',  'Sedan – 4 Seater (AC)',    4),
(4, 'Car',  'SUV – 6 Seater (AC)',      6),
(5, 'Bike', 'Bike Taxi – 1 Rider',      1);
