
-- Trigger function: fires on mgc_client_profiles INSERT → calls Netlify function
CREATE OR REPLACE FUNCTION public.mgc_notify_new_client_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://mgcglobalconsulting.com/.netlify/functions/new-client-signup',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer 58df93c2-0a6d-44bc-819f-2bf66d07c54f'
    ),
    body    := jsonb_build_object(
      'type',       TG_OP,
      'table',      TG_TABLE_NAME,
      'schema',     TG_TABLE_SCHEMA,
      'record',     row_to_json(NEW)::jsonb,
      'old_record', NULL
    )::text
  );
  RETURN NEW;
END;
$$;

-- Attach trigger to mgc_client_profiles INSERT
DROP TRIGGER IF EXISTS mgc_client_signup_webhook ON public.mgc_client_profiles;
CREATE TRIGGER mgc_client_signup_webhook
  AFTER INSERT ON public.mgc_client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.mgc_notify_new_client_signup();
;
