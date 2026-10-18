export const identitySchema = `
CREATE TABLE IF NOT EXISTS platform_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS platform_roles (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS platform_user_roles (
  user_id TEXT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  role_code TEXT NOT NULL REFERENCES platform_roles(code),
  PRIMARY KEY(user_id,role_code)
);
CREATE TABLE IF NOT EXISTS platform_role_permissions (
  role_code TEXT NOT NULL REFERENCES platform_roles(code),
  permission TEXT NOT NULL,
  PRIMARY KEY(role_code,permission)
);
CREATE TABLE IF NOT EXISTS platform_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS platform_sessions_user ON platform_sessions(user_id);
CREATE TABLE IF NOT EXISTS platform_login_attempts (
  account_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS resource_policies (
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES platform_users(id),
  visibility TEXT NOT NULL CHECK(visibility IN ('private','internal','all')),
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(resource_type,resource_id)
);
CREATE INDEX IF NOT EXISTS resource_policies_owner ON resource_policies(owner_id);
CREATE TABLE IF NOT EXISTS platform_audit (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);`;
