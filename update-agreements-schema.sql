-- Update User Agreements Schema and Trigger

-- 1. Add missing columns to user_agreements
ALTER TABLE public.user_agreements
ADD COLUMN IF NOT EXISTS privacy_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS commercial_accepted BOOLEAN DEFAULT FALSE;

-- 2. Update the handle_new_user function to map metadata to agreements
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    
    -- Create notification preferences with defaults
    -- If commercial accepted, enable marketing?
    INSERT INTO public.notification_preferences (user_id, marketing_allowed)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'agreements_commercial')::boolean, FALSE)
    );
    
    -- Create user agreements record with data from metadata
    INSERT INTO public.user_agreements (
        user_id,
        terms_accepted,         -- Kullanıcı Sözleşmesi
        privacy_accepted,       -- Gizlilik Politikası
        kvkk_accepted,          -- KVKK Aydınlatma
        open_consent_accepted,  -- Açık Rıza
        commercial_accepted,    -- Ticari İleti
        accepted_at
    )
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'agreements_terms')::boolean, FALSE),
        COALESCE((NEW.raw_user_meta_data->>'agreements_privacy')::boolean, FALSE),
        COALESCE((NEW.raw_user_meta_data->>'agreements_kvkk')::boolean, FALSE),
        COALESCE((NEW.raw_user_meta_data->>'agreements_consent')::boolean, FALSE),
        COALESCE((NEW.raw_user_meta_data->>'agreements_commercial')::boolean, FALSE),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
