-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Base Profiles
CREATE TABLE parent_profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE player_profiles (
    id UUID PRIMARY KEY,
    parent_id UUID REFERENCES parent_profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    ceo_parent_id UUID REFERENCES parent_profiles(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Activity Structure
CREATE TABLE activity_groups (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- soccer, swim, dance, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE rosters (
    id UUID PRIMARY KEY,
    player_id UUID REFERENCES player_profiles(id) ON DELETE CASCADE NOT NULL,
    group_id UUID REFERENCES activity_groups(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'member' NOT NULL, -- member, coach, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE events (
    id UUID PRIMARY KEY,
    group_id UUID REFERENCES activity_groups(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    attire_gear TEXT DEFAULT 'General clothes' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE rsvps (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES player_profiles(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) NOT NULL, -- attending, declined, injured
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Health & Volunteer Systems (HIPAA & Operational boundary)
CREATE TABLE health_records (
    id UUID PRIMARY KEY,
    player_id UUID REFERENCES player_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    encrypted_allergy_notes TEXT NOT NULL,
    encrypted_medical_conditions TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE volunteer_shifts (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    parent_profile_id UUID REFERENCES parent_profiles(id) ON DELETE SET NULL,
    role_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE offers (
    id UUID PRIMARY KEY,
    player_profile_id UUID REFERENCES player_profiles(id) ON DELETE CASCADE NOT NULL,
    doc_url VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent' NOT NULL, -- sent, opened, paid, declined
    price_cents INTEGER NOT NULL,
    stripe_invoice_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Communication & Sync Credentials (SSO Encrypted Tokens)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    group_id UUID REFERENCES activity_groups(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID NOT NULL, -- parent_id or player_id (13+)
    sender_name VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    is_emergency BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE school_credentials (
    id UUID PRIMARY KEY,
    parent_profile_id UUID REFERENCES parent_profiles(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR(50) NOT NULL, -- parentvue, powerschool
    encrypted_username TEXT NOT NULL,
    encrypted_password TEXT NOT NULL,
    district_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Create Invariant Tenancy Indexes (AD-4 Indexing target)
CREATE INDEX idx_player_profiles_parent ON player_profiles(parent_id);
CREATE INDEX idx_rosters_player ON rosters(player_id);
CREATE INDEX idx_rosters_group ON rosters(group_id);
CREATE INDEX idx_events_group ON events(group_id);
CREATE INDEX idx_rsvps_player ON rsvps(player_id);
CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_volunteer_shifts_event ON volunteer_shifts(event_id);
CREATE INDEX idx_chat_messages_group ON chat_messages(group_id);
CREATE INDEX idx_offers_player ON offers(player_profile_id);

-- 6. Enable PostgreSQL Row-Level Security (RLS) on all tables (AD-3 Invariant)
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_credentials ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies mapping active parent context (app.current_parent_id)

-- Parent Profiles
CREATE POLICY parent_select_policy ON parent_profiles FOR SELECT USING (id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid);
CREATE POLICY parent_modify_policy ON parent_profiles FOR UPDATE USING (id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid);
CREATE POLICY parent_delete_policy ON parent_profiles FOR DELETE USING (id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid);
CREATE POLICY parent_insert_policy ON parent_profiles FOR INSERT WITH CHECK (true);

-- Player Profiles (COPPA boundary)
CREATE POLICY player_policy ON player_profiles FOR ALL 
    USING (parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid)
    WITH CHECK (parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid);

-- Organizations
CREATE POLICY organization_policy ON organizations FOR ALL 
    USING (ceo_parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid)
    WITH CHECK (ceo_parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid);

-- Activity Groups (visible to roster members or organization CEOs)
CREATE POLICY activity_groups_policy ON activity_groups FOR ALL
    USING (
        id IN (SELECT group_id FROM rosters WHERE player_id IN (SELECT id FROM player_profiles WHERE parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid))
        OR org_id IN (SELECT id FROM organizations WHERE ceo_parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid)
    );

-- Rosters (restricted to roster members)
CREATE POLICY rosters_policy ON rosters FOR ALL
    USING (
        group_id IN (SELECT group_id FROM rosters WHERE player_id IN (SELECT id FROM player_profiles WHERE parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid))
    );

-- Events (visible to group members)
CREATE POLICY events_policy ON events FOR ALL
    USING (
        group_id IN (SELECT group_id FROM rosters WHERE player_id IN (SELECT id FROM player_profiles WHERE parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid))
    );

-- RSVPs
CREATE POLICY rsvps_policy ON rsvps FOR ALL
    USING (
        player_id IN (SELECT id FROM player_profiles WHERE parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid)
    );

-- HIPAA Health Records (Ironclad PHI isolation)
CREATE POLICY health_records_policy ON health_records FOR ALL
    USING (
        player_id IN (SELECT id FROM player_profiles WHERE parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid)
    );

-- Volunteer Shifts
CREATE POLICY volunteer_shifts_policy ON volunteer_shifts FOR ALL
    USING (
        event_id IN (SELECT id FROM events WHERE group_id IN (SELECT group_id FROM rosters WHERE player_id IN (SELECT id FROM player_profiles WHERE parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid)))
    );

-- Offers
CREATE POLICY offers_policy ON offers FOR ALL
    USING (
        player_profile_id IN (SELECT id FROM player_profiles WHERE parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid)
    );

-- Chat Messages
CREATE POLICY chat_messages_policy ON chat_messages FOR ALL
    USING (
        group_id IN (SELECT group_id FROM rosters WHERE player_id IN (SELECT id FROM player_profiles WHERE parent_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid))
    );

-- School sync credentials
CREATE POLICY school_credentials_policy ON school_credentials FOR ALL
    USING (
        parent_profile_id = NULLIF(current_setting('app.current_parent_id', true), '')::uuid
    );
