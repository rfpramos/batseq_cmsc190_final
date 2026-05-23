-- Minimal schema for BatSEQ backend
-- Create tables: users, is_shared_to, isolate

-- users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved TINYINT(1) DEFAULT 0
);

-- is_shared_to
CREATE TABLE IF NOT EXISTS is_shared_to (
  email VARCHAR(255) NOT NULL,
  isolate_code VARCHAR(255) NOT NULL,
  PRIMARY KEY (email, isolate_code)
);

-- isolate
CREATE TABLE IF NOT EXISTS isolate (
  id INT AUTO_INCREMENT PRIMARY KEY,
  isolate_code VARCHAR(255) NOT NULL UNIQUE,
  type_of_sample VARCHAR(255),
  bat_source VARCHAR(255),
  sampling_site VARCHAR(255),
  gram_reaction VARCHAR(255),
  cell_shape VARCHAR(255),
  oxygen_requirement VARCHAR(255),
  presence_of_cytochrome_c_oxidase VARCHAR(255),
  endospore_forming_capability VARCHAR(255),
  antibiotic_resistance_profile VARCHAR(255),
  identity VARCHAR(255),
  pathogenicity VARCHAR(255),
  gene_seq TEXT,
  image_url VARCHAR(1024),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Optional: admin seed (plaintext password for testing only)
-- INSERT INTO users (username, password, email, role, approved) VALUES ('admin', 'adminpass', 'admin@example.com', 'admin', 1);
