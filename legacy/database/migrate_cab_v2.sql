-- ================================================================
--  CAB SYSTEM v2 — Driver Profiles, Tracking, Distance Limits
--  WorkforceIQ v7.0
--  Run AFTER migrate_cab.sql
-- ================================================================

-- ── Driver profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_drivers (
  driver_id       INT AUTO_INCREMENT PRIMARY KEY,
  employee_code   VARCHAR(20)  UNIQUE NOT NULL,   -- e.g. DRV-001
  full_name       VARCHAR(120) NOT NULL,
  mobile          VARCHAR(15)  NOT NULL,
  alt_mobile      VARCHAR(15)  DEFAULT NULL,
  email           VARCHAR(120) DEFAULT NULL,
  address         TEXT         NOT NULL,
  license_number  VARCHAR(30)  NOT NULL,
  license_expiry  DATE         NOT NULL,
  id_card_number  VARCHAR(40)  NOT NULL,           -- Aadhaar / DL / company ID
  id_card_type    ENUM('Aadhaar','Driving License','Passport','Company ID') DEFAULT 'Aadhaar',
  photo_url       VARCHAR(255) DEFAULT NULL,        -- path to uploaded photo
  id_card_url     VARCHAR(255) DEFAULT NULL,        -- path to scanned ID card
  vehicle_id      INT          DEFAULT NULL,        -- assigned vehicle
  assigned_route  INT          DEFAULT NULL,        -- primary route
  status          ENUM('active','on_leave','suspended','inactive') DEFAULT 'active',
  joining_date    DATE         DEFAULT NULL,
  emergency_contact_name   VARCHAR(120) DEFAULT NULL,
  emergency_contact_mobile VARCHAR(15)  DEFAULT NULL,
  rating          DECIMAL(3,2) DEFAULT 5.00,        -- avg rating 1–5
  total_trips     INT          DEFAULT 0,
  notes           TEXT         DEFAULT NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id)     REFERENCES cab_vehicles(vehicle_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_route) REFERENCES cab_routes(route_id)     ON DELETE SET NULL
);

-- ── Assign driver to booking (when approved) ─────────────────────
ALTER TABLE cab_bookings
  ADD COLUMN IF NOT EXISTS driver_id       INT     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS distance_km     DECIMAL(8,2) DEFAULT NULL,   -- employee's distance from pickup
  ADD COLUMN IF NOT EXISTS otp             VARCHAR(6)   DEFAULT NULL,   -- journey OTP
  ADD COLUMN IF NOT EXISTS journey_status  ENUM('waiting','in_transit','completed','sos') DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS journey_start   TIMESTAMP    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS journey_end     TIMESTAMP    DEFAULT NULL,
  ADD FOREIGN KEY (driver_id) REFERENCES cab_drivers(driver_id) ON DELETE SET NULL;

-- ── Distance limits per zone ─────────────────────────────────────
ALTER TABLE cab_routes
  ADD COLUMN IF NOT EXISTS max_distance_km  DECIMAL(6,2) DEFAULT 30.00,  -- max allowed distance
  ADD COLUMN IF NOT EXISTS base_lat         DECIMAL(10,7) DEFAULT 25.6093,  -- office lat (Patna default)
  ADD COLUMN IF NOT EXISTS base_lng         DECIMAL(10,7) DEFAULT 85.1376;  -- office lng

-- ── Live tracking pings (GPS breadcrumbs) ────────────────────────
CREATE TABLE IF NOT EXISTS cab_tracking (
  ping_id      INT AUTO_INCREMENT PRIMARY KEY,
  booking_id   INT          NOT NULL,
  driver_id    INT          NOT NULL,
  latitude     DECIMAL(10,7) NOT NULL,
  longitude    DECIMAL(10,7) NOT NULL,
  speed_kmh    DECIMAL(6,2) DEFAULT 0,
  heading      INT          DEFAULT 0,    -- degrees 0–360
  recorded_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES cab_bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)  REFERENCES cab_drivers(driver_id)   ON DELETE CASCADE
);

-- ── SOS alerts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_sos (
  sos_id      INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT          NOT NULL,
  user_id     INT          NOT NULL,
  latitude    DECIMAL(10,7) DEFAULT NULL,
  longitude   DECIMAL(10,7) DEFAULT NULL,
  message     TEXT         DEFAULT NULL,
  status      ENUM('open','acknowledged','resolved') DEFAULT 'open',
  resolved_by INT          DEFAULT NULL,
  resolved_at TIMESTAMP    DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES cab_bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(user_id)           ON DELETE CASCADE
);

-- ── Driver ratings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cab_driver_ratings (
  rating_id   INT AUTO_INCREMENT PRIMARY KEY,
  driver_id   INT          NOT NULL,
  booking_id  INT          NOT NULL,
  user_id     INT          NOT NULL,
  rating      TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback    TEXT         DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking_rating (booking_id, user_id),
  FOREIGN KEY (driver_id)  REFERENCES cab_drivers(driver_id)   ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES cab_bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(user_id)           ON DELETE CASCADE
);

-- ── Seed: sample drivers ─────────────────────────────────────────
INSERT IGNORE INTO cab_drivers
  (driver_id, employee_code, full_name, mobile, alt_mobile, email, address,
   license_number, license_expiry, id_card_number, id_card_type,
   vehicle_id, assigned_route, status, joining_date,
   emergency_contact_name, emergency_contact_mobile, rating, total_trips) VALUES
(1,'DRV-001','Ramesh Kumar Singh',  '+91-9801234561','+91-9801234562','ramesh.driver@wip.com',
   '12, Rajiv Nagar Colony, Near SBI Bank, Patna – 800001',
   'BR-2019-0123456','2027-03-15','1234 5678 9012','Aadhaar',
   1,1,'active','2021-06-01','Sunita Singh','+91-9801234563',4.8,312),

(2,'DRV-002','Suresh Prasad Yadav', '+91-9801234564','+91-9801234565','suresh.driver@wip.com',
   '45, Kankarbagh Main Road, Behind Petrol Pump, Patna – 800020',
   'BR-2018-0234567','2026-11-20','2345 6789 0123','Aadhaar',
   1,2,'active','2020-03-15','Meera Devi','+91-9801234566',4.6,287),

(3,'DRV-003','Manoj Kumar Sharma',  '+91-9801234567',NULL,'manoj.driver@wip.com',
   '78, Boring Road, Near City Mall, Patna – 800001',
   'BR-2020-0345678','2028-07-10','3456 7890 1234','Aadhaar',
   2,3,'active','2022-01-10','Ritu Sharma','+91-9801234568',4.9,198),

(4,'DRV-004','Deepak Verma',        '+91-9801234569','+91-9801234570','deepak.driver@wip.com',
   '23, Patliputra Colony, Sector B, Patna – 800013',
   'BR-2017-0456789','2025-12-31','4567 8901 2345','Aadhaar',
   3,4,'active','2019-08-20','Kavita Verma','+91-9801234571',4.7,421),

(5,'DRV-005','Vijay Shankar Mishra','+91-9801234572',NULL,'vijay.driver@wip.com',
   '56, Bailey Road, Near Airport, Patna – 800014',
   'BR-2021-0567890','2029-02-28','5678 9012 3456','Aadhaar',
   4,5,'active','2023-02-01','Anita Mishra','+91-9801234573',4.5,89);

-- Update route distances
UPDATE cab_routes SET max_distance_km = 25 WHERE route_id = 1;
UPDATE cab_routes SET max_distance_km = 20 WHERE route_id = 2;
UPDATE cab_routes SET max_distance_km = 15 WHERE route_id = 3;
UPDATE cab_routes SET max_distance_km = 22 WHERE route_id = 4;
UPDATE cab_routes SET max_distance_km = 50 WHERE route_id = 5;  -- night cab wider range

-- ================================================================
--  CAB SYSTEM v2.1 — Driver Responsibility & Travel Completion
-- ================================================================

-- Driver trip acknowledgment & responsibility log
ALTER TABLE cab_bookings
  ADD COLUMN IF NOT EXISTS driver_acknowledged  BOOLEAN   DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS driver_ack_at        TIMESTAMP DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS travel_km            DECIMAL(8,2) DEFAULT NULL,   -- actual km driven
  ADD COLUMN IF NOT EXISTS completion_note      TEXT      DEFAULT NULL,       -- driver's closing note
  ADD COLUMN IF NOT EXISTS notify_sent          BOOLEAN   DEFAULT FALSE;      -- broadcast sent flag

-- Notification log for travel completions
CREATE TABLE IF NOT EXISTS cab_travel_notifications (
  notif_id     INT AUTO_INCREMENT PRIMARY KEY,
  booking_id   INT          NOT NULL,
  driver_id    INT          NOT NULL,
  sent_to      ENUM('employee','manager','admin','all') DEFAULT 'all',
  message      TEXT         NOT NULL,
  travel_km    DECIMAL(8,2) DEFAULT NULL,
  sent_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES cab_bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)  REFERENCES cab_drivers(driver_id)   ON DELETE CASCADE
);
