-- ═══════════════════════════════════════════════════════════════
-- migrate_v13_uploads.sql — Document Vault & Policy Library tables
-- Run after all previous migrations
-- ═══════════════════════════════════════════════════════════════

-- Employee Document Vault
CREATE TABLE IF NOT EXISTS employee_documents (
  doc_id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  category           ENUM('identity','educational','employment','financial','medical','address','other') DEFAULT 'other',
  doc_name           VARCHAR(200) NOT NULL,
  file_url           VARCHAR(500) NOT NULL,
  file_size          INT DEFAULT 0,           -- bytes
  expiry_date        DATE,
  notes              TEXT,
  status             ENUM('pending','verified','rejected') DEFAULT 'pending',
  shared_with_hr     TINYINT(1) DEFAULT 0,
  verified_by        INT,
  verified_at        DATETIME,
  reject_reason      TEXT,
  uploaded_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Company Policy Library
CREATE TABLE IF NOT EXISTS company_policies (
  policy_id              INT AUTO_INCREMENT PRIMARY KEY,
  title                  VARCHAR(300) NOT NULL,
  category               VARCHAR(100) DEFAULT 'General',
  version                VARCHAR(20)  DEFAULT 'v1.0',
  file_url               VARCHAR(500) NOT NULL,
  acknowledgement_required TINYINT(1) DEFAULT 1,
  applicable_to          VARCHAR(100) DEFAULT 'all',   -- 'all', dept name, role
  uploaded_by            INT NOT NULL,
  is_active              TINYINT(1) DEFAULT 1,
  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
  INDEX idx_category (category),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Policy Acknowledgements
CREATE TABLE IF NOT EXISTS policy_acknowledgements (
  ack_id          INT AUTO_INCREMENT PRIMARY KEY,
  policy_id       INT NOT NULL,
  user_id         INT NOT NULL,
  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ack (policy_id, user_id),
  FOREIGN KEY (policy_id) REFERENCES company_policies(policy_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

