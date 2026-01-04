-- Add user_agent column to push_subscriptions table
ALTER TABLE public.push_subscriptions 
ADD COLUMN IF NOT EXISTS user_agent TEXT;
