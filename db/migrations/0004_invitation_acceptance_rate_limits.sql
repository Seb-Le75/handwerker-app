CREATE TABLE public.rate_limit_buckets (
  scope text NOT NULL,
  key_hash text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (scope, key_hash, window_started_at)
);

CREATE INDEX rate_limit_buckets_expires_at_idx ON public.rate_limit_buckets (expires_at);

REVOKE ALL ON public.rate_limit_buckets FROM PUBLIC, handwerker_app;

CREATE OR REPLACE FUNCTION app_private.consume_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $function$
DECLARE
  v_window timestamptz;
  v_count integer;
BEGIN
  IF p_scope NOT IN ('login_email', 'password_reset_email', 'member_invite_actor')
    OR p_key_hash !~ '^[0-9a-f]{64}$'
    OR p_limit < 1 OR p_limit > 1000
    OR p_window_seconds < 60 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'invalid rate limit parameters' USING ERRCODE = '22023';
  END IF;

  v_window := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limit_buckets (
    scope, key_hash, window_started_at, request_count, expires_at
  ) VALUES (
    p_scope, p_key_hash, v_window, 1, v_window + make_interval(secs => p_window_seconds * 2)
  )
  ON CONFLICT (scope, key_hash, window_started_at)
  DO UPDATE SET request_count = public.rate_limit_buckets.request_count + 1
  RETURNING request_count INTO v_count;

  -- Opportunistic, bounded-lifetime cleanup. No identifier or e-mail address is stored.
  DELETE FROM public.rate_limit_buckets WHERE expires_at < clock_timestamp();
  RETURN v_count <= p_limit;
END
$function$;

REVOKE ALL ON FUNCTION app_private.consume_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.consume_rate_limit(text, text, integer, integer) TO handwerker_app;

CREATE OR REPLACE FUNCTION app_private.accept_invitation(
  p_token_digest text,
  p_auth_subject text,
  p_email text,
  p_display_name text DEFAULT NULL
)
RETURNS TABLE (tenant_id uuid, membership_id uuid, invitation_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $function$
DECLARE
  v_invitation public.invitations%ROWTYPE;
  v_user public.users%ROWTYPE;
  v_membership public.memberships%ROWTYPE;
  v_email text := lower(btrim(p_email));
BEGIN
  IF p_token_digest !~ '^[0-9a-f]{64}$' OR nullif(btrim(p_auth_subject), '') IS NULL
    OR v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'invalid invitation credentials' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token_digest = p_token_digest
  FOR UPDATE;

  IF NOT FOUND OR v_invitation.revoked_at IS NOT NULL OR v_invitation.accepted_at IS NOT NULL
    OR v_invitation.expires_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'invitation is invalid or expired' USING ERRCODE = 'P0001';
  END IF;
  IF v_invitation.email <> v_email THEN
    RAISE EXCEPTION 'invitation identity does not match' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_user FROM public.users WHERE auth_subject = p_auth_subject FOR UPDATE;
  IF FOUND AND v_user.email <> v_email THEN
    RAISE EXCEPTION 'authenticated identity does not match e-mail' USING ERRCODE = 'P0001';
  END IF;

  IF NOT FOUND THEN
    SELECT * INTO v_user FROM public.users WHERE email = v_email FOR UPDATE;
    IF FOUND AND v_user.auth_subject <> p_auth_subject THEN
      RAISE EXCEPTION 'e-mail is already linked to another identity' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF v_user.id IS NULL THEN
    INSERT INTO public.users (auth_subject, email, display_name)
    VALUES (p_auth_subject, v_email, nullif(btrim(p_display_name), ''))
    RETURNING * INTO v_user;
  ELSIF v_user.status <> 'active' THEN
    RAISE EXCEPTION 'user is disabled' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_membership
  FROM public.memberships
  WHERE public.memberships.tenant_id = v_invitation.tenant_id
    AND user_id = v_user.id
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.memberships
    SET role_code = v_invitation.role_code,
        status = 'active',
        deactivated_at = NULL,
        updated_at = clock_timestamp(),
        version = version + 1
    WHERE id = v_membership.id
    RETURNING * INTO v_membership;
  ELSE
    INSERT INTO public.memberships (tenant_id, user_id, role_code)
    VALUES (v_invitation.tenant_id, v_user.id, v_invitation.role_code)
    RETURNING * INTO v_membership;
  END IF;

  UPDATE public.invitations
  SET accepted_at = clock_timestamp(), version = version + 1
  WHERE id = v_invitation.id;

  INSERT INTO public.audit_events (
    tenant_id, actor_membership_id, action, target_type, target_id, outcome, metadata
  ) VALUES (
    v_invitation.tenant_id, v_membership.id, 'invitation.accepted', 'membership',
    v_membership.id::text, 'success', jsonb_build_object('invitationId', v_invitation.id)
  );

  RETURN QUERY SELECT v_invitation.tenant_id, v_membership.id, v_invitation.id;
END
$function$;

REVOKE ALL ON FUNCTION app_private.accept_invitation(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.accept_invitation(text, text, text, text) TO handwerker_app;

COMMENT ON TABLE public.rate_limit_buckets IS
  'Application abuse-prevention counters. Keys are HMAC digests; raw e-mail addresses are never stored.';
COMMENT ON FUNCTION app_private.accept_invitation(text, text, text, text) IS
  'Atomically consumes a one-time invitation and creates or reactivates the matching tenant membership.';
