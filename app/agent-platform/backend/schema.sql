DROP TABLE IF EXISTS location_pings;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  pw_hash    TEXT NOT NULL,
  pw_salt    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE invites (
  id         TEXT PRIMARY KEY,
  token      TEXT UNIQUE NOT NULL,
  admin_id   TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used       INTEGER DEFAULT 0
);

CREATE TABLE devices (
  id           TEXT PRIMARY KEY,
  admin_id     TEXT NOT NULL,
  invite_token TEXT,
  android_id   TEXT UNIQUE,
  model        TEXT,
  os_version   TEXT,
  sdk          INTEGER,
  status       TEXT DEFAULT 'pending',
  last_seen    INTEGER,
  fcm_token    TEXT,
  created_at   INTEGER NOT NULL
);

CREATE TABLE location_pings (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  lat       REAL, lng REAL,
  accuracy  REAL, speed REAL, bearing REAL,
  ts        INTEGER NOT NULL
);

CREATE INDEX idx_pings_device ON location_pings(device_id, ts DESC);
CREATE INDEX idx_devices_admin ON devices(admin_id);