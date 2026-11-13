CREATE OR REPLACE FUNCTION app_private.current_auth_subject()
RETURNS text
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $function$
  SELECT NULLIF(current_setting('app.current_auth_subject', true), '')
$function$;

REVOKE ALL ON FUNCTION app_private.current_auth_subject() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.current_auth_subject() TO handwerker_app;

CREATE POLICY users_current_auth_subject ON public.users
  FOR SELECT TO handwerker_app
  USING (auth_subject = app_private.current_auth_subject());

CREATE POLICY memberships_current_identity ON public.memberships
  FOR SELECT TO handwerker_app
  USING (user_id = app_private.current_user_id());

INSERT INTO public.permissions (code, description)
VALUES ('members.disable', 'Mitgliedschaften deaktivieren')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (role_code, permission_code)
VALUES ('owner_admin', 'members.disable')
ON CONFLICT (role_code, permission_code) DO NOTHING;
