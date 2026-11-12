DO $role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'handwerker_app') THEN
    CREATE ROLE handwerker_app
      NOLOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOINHERIT
      NOBYPASSRLS;
  END IF;
END
$role$;

ALTER ROLE handwerker_app
  NOLOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOINHERIT
  NOBYPASSRLS;

GRANT handwerker_app TO CURRENT_USER;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public, app_private TO handwerker_app;

CREATE OR REPLACE FUNCTION app_private.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $function$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
$function$;

CREATE OR REPLACE FUNCTION app_private.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $function$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$function$;

REVOKE ALL ON FUNCTION app_private.current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.current_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.current_tenant_id() TO handwerker_app;
GRANT EXECUTE ON FUNCTION app_private.current_user_id() TO handwerker_app;

CREATE TABLE public.roles (
  code text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL,
  is_system boolean NOT NULL DEFAULT true
);

CREATE TABLE public.permissions (
  code text PRIMARY KEY,
  description text NOT NULL
);

CREATE TABLE public.role_permissions (
  role_code text NOT NULL REFERENCES public.roles(code) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES public.permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  legal_name text NOT NULL,
  slug text NOT NULL CONSTRAINT tenants_slug_unique UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deletion_pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CONSTRAINT tenants_version_positive CHECK (version > 0)
);

CREATE TABLE public.tenant_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Europe/Berlin',
  locale text NOT NULL DEFAULT 'de-DE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CONSTRAINT tenant_settings_version_positive CHECK (version > 0)
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  auth_subject text NOT NULL CONSTRAINT users_auth_subject_unique UNIQUE,
  email text NOT NULL CONSTRAINT users_email_unique UNIQUE,
  display_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CONSTRAINT users_version_positive CHECK (version > 0),
  CONSTRAINT users_email_normalized CHECK (email = lower(btrim(email)))
);

CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  role_code text NOT NULL REFERENCES public.roles(code) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz,
  version integer NOT NULL DEFAULT 1 CONSTRAINT memberships_version_positive CHECK (version > 0),
  CONSTRAINT memberships_tenant_user_unique UNIQUE (tenant_id, user_id),
  CONSTRAINT memberships_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT memberships_deactivation_consistent CHECK (
    (status = 'active' AND deactivated_at IS NULL)
    OR (status = 'disabled' AND deactivated_at IS NOT NULL)
  )
);

CREATE INDEX memberships_user_status_idx ON public.memberships(user_id, status);

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invited_by_membership_id uuid NOT NULL,
  email text NOT NULL,
  role_code text NOT NULL REFERENCES public.roles(code) ON DELETE RESTRICT,
  token_digest text NOT NULL CONSTRAINT invitations_token_digest_unique UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1 CONSTRAINT invitations_version_positive CHECK (version > 0),
  CONSTRAINT invitations_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT invitations_inviter_tenant_fk
    FOREIGN KEY (tenant_id, invited_by_membership_id)
    REFERENCES public.memberships(tenant_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT invitations_email_normalized CHECK (email = lower(btrim(email))),
  CONSTRAINT invitations_single_terminal_state CHECK (NOT (accepted_at IS NOT NULL AND revoked_at IS NOT NULL))
);

CREATE INDEX invitations_tenant_email_idx ON public.invitations(tenant_id, email);

CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  actor_membership_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  outcome text NOT NULL CHECK (outcome IN ('success', 'denied', 'failure')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_events_actor_tenant_fk
    FOREIGN KEY (tenant_id, actor_membership_id)
    REFERENCES public.memberships(tenant_id, id)
    ON DELETE RESTRICT
);

CREATE INDEX audit_events_tenant_occurred_idx ON public.audit_events(tenant_id, occurred_at);

INSERT INTO public.roles (code, label, description) VALUES
  ('owner_admin', 'Inhaber/Admin', 'Vollzugriff innerhalb des Betriebs'),
  ('office_dispatch', 'Büro/Disposition', 'Kunden-, Auftrags- und Terminverwaltung'),
  ('master', 'Meister', 'Fachliche Leitung und Freigaben'),
  ('technician', 'Monteur', 'Eigene Einsätze und Arbeitsnachweise'),
  ('accounting', 'Buchhaltung', 'Finanz- und Belegprozesse'),
  ('read_only', 'Nur-Lesen', 'Lesender Zugriff auf freigegebene Bereiche');

INSERT INTO public.permissions (code, description) VALUES
  ('tenant.read', 'Betriebsprofil lesen'),
  ('tenant.update', 'Betriebsprofil ändern'),
  ('members.read', 'Mitglieder lesen'),
  ('members.invite', 'Mitglieder einladen'),
  ('members.role.assign', 'Rollen zuweisen'),
  ('audit.read', 'Audit-Ereignisse lesen');

INSERT INTO public.role_permissions (role_code, permission_code)
SELECT 'owner_admin', code FROM public.permissions;

INSERT INTO public.role_permissions (role_code, permission_code) VALUES
  ('office_dispatch', 'tenant.read'),
  ('office_dispatch', 'members.read'),
  ('master', 'tenant.read'),
  ('master', 'members.read'),
  ('accounting', 'tenant.read'),
  ('read_only', 'tenant.read');

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events FORCE ROW LEVEL SECURITY;

CREATE POLICY tenants_isolation ON public.tenants
  FOR ALL TO handwerker_app
  USING (id = app_private.current_tenant_id())
  WITH CHECK (id = app_private.current_tenant_id());

CREATE POLICY tenant_settings_isolation ON public.tenant_settings
  FOR ALL TO handwerker_app
  USING (tenant_id = app_private.current_tenant_id())
  WITH CHECK (tenant_id = app_private.current_tenant_id());

CREATE POLICY users_current_identity ON public.users
  FOR SELECT TO handwerker_app
  USING (id = app_private.current_user_id());

CREATE POLICY users_same_tenant ON public.users
  FOR SELECT TO handwerker_app
  USING (
    EXISTS (
      SELECT 1
      FROM public.memberships
      WHERE memberships.tenant_id = app_private.current_tenant_id()
        AND memberships.user_id = users.id
        AND memberships.status = 'active'
    )
  );

CREATE POLICY memberships_isolation ON public.memberships
  FOR ALL TO handwerker_app
  USING (tenant_id = app_private.current_tenant_id())
  WITH CHECK (tenant_id = app_private.current_tenant_id());

CREATE POLICY invitations_isolation ON public.invitations
  FOR ALL TO handwerker_app
  USING (tenant_id = app_private.current_tenant_id())
  WITH CHECK (tenant_id = app_private.current_tenant_id());

CREATE POLICY audit_events_select ON public.audit_events
  FOR SELECT TO handwerker_app
  USING (tenant_id = app_private.current_tenant_id());

CREATE POLICY audit_events_insert ON public.audit_events
  FOR INSERT TO handwerker_app
  WITH CHECK (tenant_id = app_private.current_tenant_id());

GRANT SELECT ON public.roles, public.permissions, public.role_permissions TO handwerker_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants, public.tenant_settings, public.memberships, public.invitations TO handwerker_app;
GRANT SELECT ON public.users TO handwerker_app;
GRANT SELECT, INSERT ON public.audit_events TO handwerker_app;

COMMENT ON ROLE handwerker_app IS 'Least-privilege application role; tenant access is constrained by RLS.';
COMMENT ON TABLE public.audit_events IS 'Append-only security and business audit events. The application role has no UPDATE or DELETE grant.';
