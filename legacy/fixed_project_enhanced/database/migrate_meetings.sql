-- ================================================================
--  MEETING ROOM SYSTEM — WorkforceIQ v7.0
-- ================================================================

CREATE TABLE IF NOT EXISTS meeting_rooms (
  room_id      INT AUTO_INCREMENT PRIMARY KEY,
  room_name    VARCHAR(100) NOT NULL,
  room_code    VARCHAR(20)  UNIQUE NOT NULL,   -- e.g. ROOM-001
  capacity     INT          DEFAULT 10,
  has_video    BOOLEAN      DEFAULT TRUE,
  has_audio    BOOLEAN      DEFAULT TRUE,
  has_screen   BOOLEAN      DEFAULT TRUE,
  location     VARCHAR(120) DEFAULT 'Virtual',
  is_active    BOOLEAN      DEFAULT TRUE,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meetings (
  meeting_id     INT AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  description    TEXT         DEFAULT NULL,
  meeting_type   ENUM('internal','client','interview','standup','review','training','emergency') DEFAULT 'internal',
  host_id        INT          NOT NULL,
  room_id        INT          DEFAULT NULL,
  room_code      VARCHAR(20)  UNIQUE NOT NULL,   -- join code e.g. WIP-123456
  scheduled_at   DATETIME     NOT NULL,
  duration_mins  INT          DEFAULT 60,
  ended_at       DATETIME     DEFAULT NULL,
  status         ENUM('scheduled','active','ended','cancelled') DEFAULT 'scheduled',
  agenda         TEXT         DEFAULT NULL,
  recording_url  VARCHAR(255) DEFAULT NULL,
  password       VARCHAR(20)  DEFAULT NULL,
  allow_guests   BOOLEAN      DEFAULT FALSE,
  client_name    VARCHAR(120) DEFAULT NULL,
  client_email   VARCHAR(120) DEFAULT NULL,
  report_generated BOOLEAN    DEFAULT FALSE,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id)  REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (room_id)  REFERENCES meeting_rooms(room_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meeting_participants (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id   INT NOT NULL,
  user_id      INT DEFAULT NULL,      -- NULL = guest
  guest_name   VARCHAR(120) DEFAULT NULL,
  guest_email  VARCHAR(120) DEFAULT NULL,
  role         ENUM('host','co_host','presenter','participant','viewer') DEFAULT 'participant',
  status       ENUM('invited','accepted','declined','joined','left') DEFAULT 'invited',
  joined_at    DATETIME    DEFAULT NULL,
  left_at      DATETIME    DEFAULT NULL,
  mic_on       BOOLEAN     DEFAULT FALSE,
  video_on     BOOLEAN     DEFAULT FALSE,
  hand_raised  BOOLEAN     DEFAULT FALSE,
  FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meeting_messages (
  msg_id       INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id   INT          NOT NULL,
  sender_id    INT          DEFAULT NULL,
  sender_name  VARCHAR(120) DEFAULT 'Guest',
  content      TEXT         NOT NULL,
  msg_type     ENUM('chat','system','reaction') DEFAULT 'chat',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)  REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meeting_notes (
  note_id      INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id   INT          NOT NULL,
  author_id    INT          DEFAULT NULL,
  content      TEXT         NOT NULL,
  note_type    ENUM('note','action','decision','question') DEFAULT 'note',
  assigned_to  INT          DEFAULT NULL,
  due_date     DATE         DEFAULT NULL,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id)  REFERENCES meetings(meeting_id) ON DELETE CASCADE,
  FOREIGN KEY (author_id)   REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meeting_reports (
  report_id        INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id       INT     NOT NULL UNIQUE,
  summary          TEXT    DEFAULT NULL,   -- AI-generated summary
  key_points       TEXT    DEFAULT NULL,   -- JSON array of key discussion points
  action_items     TEXT    DEFAULT NULL,   -- JSON array of action items
  decisions        TEXT    DEFAULT NULL,   -- JSON array of decisions made
  attendee_list    TEXT    DEFAULT NULL,   -- JSON
  duration_actual  INT     DEFAULT NULL,   -- actual minutes
  generated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by     ENUM('ai','manual') DEFAULT 'ai',
  FOREIGN KEY (meeting_id) REFERENCES meetings(meeting_id) ON DELETE CASCADE
);

-- ── Seed rooms ────────────────────────────────────────────────
INSERT IGNORE INTO meeting_rooms (room_id,room_name,room_code,capacity,location) VALUES
(1,'Main Conference Room','ROOM-001',20,'Floor 3 – East Wing'),
(2,'Board Room',          'ROOM-002',12,'Floor 5 – Director Suite'),
(3,'Team Room Alpha',     'ROOM-003',8, 'Floor 2 – Dev Wing'),
(4,'Team Room Beta',      'ROOM-004',8, 'Floor 2 – Dev Wing'),
(5,'Client Meeting Room', 'ROOM-005',15,'Floor 1 – Reception'),
(6,'Virtual Only',        'ROOM-006',50,'Remote / Video Call');
