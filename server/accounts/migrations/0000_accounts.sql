CREATE TABLE users (
  id TEXT PRIMARY KEY,
  account TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  credential_version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  realm INTEGER NOT NULL DEFAULT 0,
  layer INTEGER NOT NULL DEFAULT 1,
  combat_level INTEGER NOT NULL DEFAULT 1,
  power INTEGER NOT NULL DEFAULT 0,
  save_json TEXT,
  cloud_revision INTEGER NOT NULL DEFAULT 0,
  migration_id TEXT UNIQUE,
  migration_secret_hash TEXT
);
--> statement-breakpoint
CREATE INDEX users_realm_ranking ON users(realm DESC, layer DESC, power DESC, account);
--> statement-breakpoint
CREATE INDEX users_power_ranking ON users(power DESC, realm DESC, layer DESC, account);
--> statement-breakpoint
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX sessions_user ON sessions(user_id);
--> statement-breakpoint
CREATE TABLE rate_limits (bucket TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);
