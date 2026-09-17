CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES {{ENTERPRISE_SCHEMA}}.app_departments(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_departments_root_idx
  ON {{ENTERPRISE_SCHEMA}}.app_departments ((parent_id IS NULL))
  WHERE parent_id IS NULL;

CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  primary_department_id TEXT REFERENCES {{ENTERPRISE_SCHEMA}}.app_departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES {{ENTERPRISE_SCHEMA}}.app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_sessions_active_idx
  ON {{ENTERPRISE_SCHEMA}}.app_sessions(user_id, expires_at);

CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_roles (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_permissions (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_user_roles (
  user_id TEXT NOT NULL REFERENCES {{ENTERPRISE_SCHEMA}}.app_users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES {{ENTERPRISE_SCHEMA}}.app_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_role_permissions (
  role_id TEXT NOT NULL REFERENCES {{ENTERPRISE_SCHEMA}}.app_roles(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES {{ENTERPRISE_SCHEMA}}.app_permissions(code) ON DELETE RESTRICT,
  data_scope TEXT NOT NULL CHECK (data_scope IN ('self', 'department', 'department_and_children', 'all', 'custom')),
  PRIMARY KEY (role_id, permission_code)
);

CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_notifications (
  id TEXT PRIMARY KEY,
  recipient_user_id TEXT NOT NULL REFERENCES {{ENTERPRISE_SCHEMA}}.app_users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  dedupe_key TEXT UNIQUE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_notifications_recipient_idx
  ON {{ENTERPRISE_SCHEMA}}.app_notifications(recipient_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES {{ENTERPRISE_SCHEMA}}.app_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'success',
  request_id TEXT,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_audit_events_entity_idx
  ON {{ENTERPRISE_SCHEMA}}.app_audit_events(entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id TEXT REFERENCES {{ENTERPRISE_SCHEMA}}.app_users(id) ON DELETE SET NULL,
  request_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_by TEXT,
  locked_at TIMESTAMPTZ,
  last_error TEXT,
  result_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_jobs_claim_idx
  ON {{ENTERPRISE_SCHEMA}}.app_jobs(status, available_at, created_at);

CREATE TABLE IF NOT EXISTS {{ENTERPRISE_SCHEMA}}.app_idempotency_keys (
  actor_user_id TEXT NOT NULL REFERENCES {{ENTERPRISE_SCHEMA}}.app_users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (actor_user_id, operation, key)
);

INSERT INTO {{ENTERPRISE_SCHEMA}}.app_roles (id, code, name, description, is_system)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'super_admin', '超级管理员', '管理整个应用及所有数据', true),
  ('00000000-0000-0000-0000-000000000002', 'user', '普通用户', '仅拥有明确分配的业务权限', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO {{ENTERPRISE_SCHEMA}}.app_permissions (code, name, description)
VALUES
  ('system.users.read', '查看用户', '查看用户列表和基础信息'),
  ('system.users.manage', '管理用户', '创建、停用用户并分配角色'),
  ('system.departments.read', '查看部门', '查看部门树'),
  ('system.departments.manage', '管理部门', '维护部门树'),
  ('system.roles.read', '查看角色', '查看角色及权限'),
  ('system.roles.manage', '管理角色', '创建和编辑角色权限'),
  ('system.audit.read', '查看审计', '查看审计事件')
ON CONFLICT (code) DO NOTHING;
