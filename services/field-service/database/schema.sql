CREATE DATABASE IF NOT EXISTS field_db;

USE field_db;

CREATE TABLE IF NOT EXISTS owner_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    business_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_owner_user (user_id)
);

CREATE TABLE IF NOT EXISTS venues (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_profile_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_venues_owner_profile
        FOREIGN KEY (owner_profile_id)
        REFERENCES owner_profiles(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    venue_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    sport_type VARCHAR(80) NOT NULL,
    surface_type VARCHAR(80),
    price_per_hour DECIMAL(12, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_courts_venue
        FOREIGN KEY (venue_id)
        REFERENCES venues(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS court_slots (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    court_id BIGINT UNSIGNED NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('available', 'booked', 'blocked') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_court_slots_court
        FOREIGN KEY (court_id)
        REFERENCES courts(id)
        ON DELETE CASCADE,
    UNIQUE KEY unique_court_slot (court_id, slot_date, start_time, end_time)
);

CREATE TABLE IF NOT EXISTS court_photos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    court_id BIGINT UNSIGNED NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_court_photos_court
        FOREIGN KEY (court_id)
        REFERENCES courts(id)
        ON DELETE CASCADE
);

INSERT INTO owner_profiles (user_id, business_name, phone, address)
VALUES
    (1, 'Syifa Sport Center', '081234567890', 'Jakarta Selatan')
ON DUPLICATE KEY UPDATE
    business_name = VALUES(business_name),
    phone = VALUES(phone),
    address = VALUES(address);

INSERT INTO venues (id, owner_profile_id, name, address, city, description, is_active)
VALUES
    (1, 1, 'Syifa Sport Arena', 'Jl. Merdeka No. 10', 'Jakarta', 'Venue olahraga dengan lapangan futsal dan badminton', TRUE),
    (2, 1, 'UPNVJ Sport Hall', 'Jl. RS Fatmawati, Pondok Labu', 'Jakarta', 'Lapangan olahraga indoor dekat kampus', TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    address = VALUES(address),
    city = VALUES(city),
    description = VALUES(description),
    is_active = VALUES(is_active);

INSERT INTO courts (id, venue_id, name, sport_type, surface_type, price_per_hour, is_active)
VALUES
    (1, 1, 'Lapangan Futsal A', 'futsal', 'vinyl', 150000.00, TRUE),
    (2, 1, 'Lapangan Badminton A', 'badminton', 'wooden', 75000.00, TRUE),
    (3, 2, 'Lapangan Basket Indoor', 'basket', 'synthetic', 200000.00, TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    sport_type = VALUES(sport_type),
    surface_type = VALUES(surface_type),
    price_per_hour = VALUES(price_per_hour),
    is_active = VALUES(is_active);

INSERT INTO court_slots (court_id, slot_date, start_time, end_time, status)
VALUES
    (1, '2026-04-30', '08:00:00', '09:00:00', 'available'),
    (1, '2026-04-30', '09:00:00', '10:00:00', 'available'),
    (1, '2026-04-30', '10:00:00', '11:00:00', 'booked'),
    (2, '2026-04-30', '08:00:00', '09:00:00', 'available'),
    (2, '2026-04-30', '09:00:00', '10:00:00', 'available'),
    (3, '2026-04-30', '13:00:00', '14:00:00', 'available')
ON DUPLICATE KEY UPDATE
    status = VALUES(status);

INSERT INTO court_photos (court_id, image_url, is_primary)
VALUES
    (1, 'https://example.com/futsal-a.jpg', TRUE),
    (2, 'https://example.com/badminton-a.jpg', TRUE),
    (3, 'https://example.com/basket-indoor.jpg', TRUE);