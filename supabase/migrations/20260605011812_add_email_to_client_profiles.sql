
ALTER TABLE mgc_client_profiles
  ADD COLUMN IF NOT EXISTS email text;

CREATE OR REPLACE FUNCTION mgc_handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.mgc_client_profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    full_name = coalesce(excluded.full_name, mgc_client_profiles.full_name);
  RETURN new;
END;
$$;
;
