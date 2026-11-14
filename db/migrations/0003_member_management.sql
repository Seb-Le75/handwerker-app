CREATE UNIQUE INDEX invitations_one_pending_per_tenant_email
  ON public.invitations (tenant_id, email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX memberships_tenant_role_status_idx
  ON public.memberships (tenant_id, role_code, status);
