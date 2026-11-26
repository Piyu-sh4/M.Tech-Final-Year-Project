-- ═══════════════════════════════════════════════════════════════
--  v12.1 — Login Location, Weather & Session Tracking
-- ═══════════════════════════════════════════════════════════════

-- Login sessions with full location & weather context
CREATE TABLE IF NOT EXISTS login_sessions (
  session_id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL,
  ip_address        VARCHAR(45),
  -- Geo location (from browser or IP)
  latitude          DECIMAL(10,7),
  longitude         DECIMAL(10,7),
  city              VARCHAR(100),
  district          VARCHAR(100),
  state             VARCHAR(100),
  country           VARCHAR(100) DEFAULT 'India',
  pincode           VARCHAR(20),
  location_source   ENUM('gps','ip','manual','disabled') DEFAULT 'gps',
  full_address      TEXT,
  -- Weather at login time
  temperature_c     DECIMAL(5,2),
  temperature_f     DECIMAL(5,2),
  weather_condition VARCHAR(80),    -- e.g. "Partly Cloudy"
  weather_icon      VARCHAR(10),    -- emoji e.g. ⛅
  humidity_pct      TINYINT,
  wind_kph          DECIMAL(6,2),
  feels_like_c      DECIMAL(5,2),
  -- Device / Browser
  user_agent        TEXT,
  device_type       ENUM('desktop','mobile','tablet') DEFAULT 'desktop',
  browser           VARCHAR(80),
  os                VARCHAR(80),
  -- Timing
  login_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_at         TIMESTAMP NULL,
  duration_minutes  INT,
  is_active         TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_login (user_id, login_at),
  INDEX idx_active (is_active)
);

-- User location preferences (per user settings)
CREATE TABLE IF NOT EXISTS user_location_prefs (
  pref_id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT NOT NULL UNIQUE,
  location_enabled  TINYINT(1) DEFAULT 1,        -- 1 = on, 0 = off
  weather_enabled   TINYINT(1) DEFAULT 1,
  location_source   ENUM('gps','manual','ip') DEFAULT 'gps',
  -- Manual override location
  manual_city       VARCHAR(100),
  manual_state      VARCHAR(100),
  manual_lat        DECIMAL(10,7),
  manual_lng        DECIMAL(10,7),
  -- Temp unit preference
  temp_unit         ENUM('celsius','fahrenheit') DEFAULT 'celsius',
  -- Last known location (for quick load)
  last_city         VARCHAR(100),
  last_state        VARCHAR(100),
  last_temp_c       DECIMAL(5,2),
  last_weather      VARCHAR(80),
  last_weather_icon VARCHAR(10),
  last_updated      TIMESTAMP NULL,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Office locations (for "I'm at office" detection)
CREATE TABLE IF NOT EXISTS office_locations (
  office_id    INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  city         VARCHAR(100),
  state        VARCHAR(100),
  latitude     DECIMAL(10,7),
  longitude    DECIMAL(10,7),
  radius_meters INT DEFAULT 500,
  is_active    TINYINT(1) DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed common office locations
INSERT IGNORE INTO office_locations (name,city,state,latitude,longitude,radius_meters) VALUES
('HQ — Bangalore', 'Bangalore', 'Karnataka', 12.9716, 77.5946, 500),
('Mumbai Office',  'Mumbai',    'Maharashtra', 19.0760, 72.8777, 500),
('Delhi NCR',      'Gurugram',  'Haryana',    28.4595, 77.0266, 500),
('Hyderabad Hub',  'Hyderabad', 'Telangana',  17.3850, 78.4867, 500),
('Pune Office',    'Pune',      'Maharashtra', 18.5204, 73.8567, 500),
('Chennai Centre', 'Chennai',   'Tamil Nadu',  13.0827, 80.2707, 500);
