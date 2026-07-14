-- Add SSO provider tracking and multi-role array options to parent_profiles
ALTER TABLE parent_profiles ADD COLUMN sso_provider VARCHAR(50);
ALTER TABLE parent_profiles ADD COLUMN active_roles VARCHAR(50)[] DEFAULT ARRAY['parent']::VARCHAR(50)[];

-- Create Account Settings table
CREATE TABLE account_settings (
    parent_profile_id UUID PRIMARY KEY REFERENCES parent_profiles(id) ON DELETE CASCADE,
    push_active BOOLEAN DEFAULT true NOT NULL,
    sms_active BOOLEAN DEFAULT true NOT NULL,
    theme VARCHAR(20) DEFAULT 'light' NOT NULL,
    payout_connected BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable PostgreSQL Row-Level Security on settings table
ALTER TABLE account_settings ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies mapping active parent context (app.current_parent_id)
CREATE POLICY settings_select_policy ON account_settings FOR SELECT USING (parent_profile_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid);
CREATE POLICY settings_modify_policy ON account_settings FOR UPDATE USING (parent_profile_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid);
CREATE POLICY settings_delete_policy ON account_settings FOR DELETE USING (parent_profile_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid);
CREATE POLICY settings_insert_policy ON account_settings FOR INSERT WITH CHECK (parent_profile_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid);
