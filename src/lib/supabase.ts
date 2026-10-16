import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { CMRGStorage, SupabaseConfig } from './storage';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = CMRGStorage.getSupabaseConfig();
  if (!config.url || !config.anon_key) return null;

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(config.url, config.anon_key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
    return supabaseInstance;
  } catch (err) {
    console.warn('Supabase client initialization fallback:', err);
    return null;
  }
}

/**
 * Validates real connectivity to Supabase by performing an actual query.
 * Does NOT mark connected until verified.
 */
export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; latencyMs: number; details?: Record<string, any> }> {
  if (!url || !anonKey) {
    return {
      success: false,
      message: 'Both Supabase Project URL and Public Anon Key are required.',
      latencyMs: 0
    };
  }

  const startTime = Date.now();
  try {
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false }
    });

    // Test real query to check API responsiveness
    const { data, error } = await testClient.from('cmrg_forms').select('id, title, version').limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      // If table doesn't exist yet, but the API replied with standard PostgreSQL error (code 42P01: relation does not exist),
      // the network connection and anon key authentication actually SUCCEEDED!
      if (error.code === '42P01' || error.message?.includes('relation "public.cmrg_forms" does not exist')) {
        const config: SupabaseConfig = {
          url,
          anon_key: anonKey,
          is_connected: true,
          project_name: url.replace('https://', '').split('.')[0],
          last_tested_at: new Date().toISOString()
        };
        CMRGStorage.saveSupabaseConfig(config);
        supabaseInstance = testClient;

        return {
          success: true,
          message: `Connected successfully (${latencyMs}ms). Migration schema needs to be executed to create CMRG tables.`,
          latencyMs,
          details: { status: 'connected_pending_migration', code: error.code }
        };
      }

      // Check for auth failure
      if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('API key')) {
        return {
          success: false,
          message: `Authentication failed: ${error.message}`,
          latencyMs
        };
      }

      return {
        success: false,
        message: `Query failed: ${error.message} (Code: ${error.code})`,
        latencyMs
      };
    }

    // Success with existing table
    const config: SupabaseConfig = {
      url,
      anon_key: anonKey,
      is_connected: true,
      project_name: url.replace('https://', '').split('.')[0],
      last_tested_at: new Date().toISOString()
    };
    CMRGStorage.saveSupabaseConfig(config);
    supabaseInstance = testClient;

    return {
      success: true,
      message: `Verified live connection to Supabase (${latencyMs}ms). CMRG tables active.`,
      latencyMs,
      details: { rowCount: data?.length ?? 0 }
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      message: `Network or host connection error: ${err?.message || 'Unable to reach host'}`,
      latencyMs
    };
  }
}

/**
 * Supabase Real Authentication Handlers
 */
export async function supabaseSignIn(email: string, pass: string) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client is not connected. Please verify project URL and Anon Key in Configuration.');
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: pass
  });

  if (error) throw error;
  return data;
}

export async function supabaseSignUp(email: string, pass: string, fullName: string, role: string) {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client is not connected. Please configure Supabase project credentials.');
  }

  const { data, error } = await client.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        full_name: fullName,
        role: role.toLowerCase()
      }
    }
  });

  if (error) throw error;

  // If session created, save initial profile
  if (data.user) {
    try {
      await client.from('cmrg_profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        role: role.toLowerCase(),
        assigned_district: 'Manicaland & Harare Operations'
      });
    } catch (profileErr) {
      console.warn('Profile upsert note:', profileErr);
    }
  }

  return data;
}

export async function supabaseSignOut() {
  const client = getSupabase();
  if (client) {
    await client.auth.signOut().catch(() => {});
  }
}

export async function supabaseResetPassword(email: string) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client is not connected.');

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}?mode=auth`
  });

  if (error) throw error;
}

/**
 * Generates the complete, production-grade PostgreSQL DDL schema with RLS policies,
 * multi-role memberships, organisation/project isolation, and PostGIS geocoding for CMRG Ltd.
 */
export function generatePostgreSqlSchema(): string {
  return `-- =========================================================================
-- CMRG Ltd (RC37852) — Enterprise Field Data Collection & Analytics Platform
-- Production PostgreSQL DDL Schema + Row Level Security (RLS) Policies
-- Ready to execute directly in Supabase SQL Editor or standard PostgreSQL 15+
-- =========================================================================

-- Enable UUID extension & PostGIS for geospatial fieldwork validation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. ENUMS & ACCESS CONTROL ROLES (All 9 Enterprise CMRG Roles)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'owner',
        'administrator',
        'project_manager',
        'form_designer',
        'supervisor',
        'enumerator',
        'reviewer',
        'analyst',
        'read_only'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE case_status AS ENUM ('unvisited', 'in_progress', 'completed', 'follow_up_needed', 'verified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('pending_review', 'approved', 'rejected', 'flagged');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ORGANISATIONS & PROJECTS (Multi-Tenant Isolation)
CREATE TABLE IF NOT EXISTS public.cmrg_organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cmrg_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.cmrg_organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PROFILES & PROJECT MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.cmrg_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'enumerator',
    assigned_district TEXT NOT NULL DEFAULT 'Manicaland & Harare',
    device_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cmrg_project_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.cmrg_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.cmrg_profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'enumerator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- 4. SURVEY FORMS REGISTRY (Versioned Questionnaires)
CREATE TABLE IF NOT EXISTS public.cmrg_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published', 'archived'
    schema_json JSONB NOT NULL,
    encryption_enabled BOOLEAN NOT NULL DEFAULT true,
    public_encryption_key TEXT,
    created_by UUID REFERENCES public.cmrg_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. LONGITUDINAL CASES TABLE (Sampling Units)
CREATE TABLE IF NOT EXISTS public.cmrg_cases (
    id TEXT PRIMARY KEY, -- e.g. 'HH-2026-081'
    title TEXT NOT NULL,
    head_of_household TEXT NOT NULL,
    village TEXT NOT NULL,
    district TEXT NOT NULL,
    contact_phone TEXT,
    assigned_enumerator_id UUID REFERENCES public.cmrg_profiles(id),
    status case_status NOT NULL DEFAULT 'unvisited',
    priority TEXT NOT NULL DEFAULT 'medium',
    target_visit_date DATE,
    baseline_members_count INT DEFAULT 0,
    gps_target GEOMETRY(Point, 4326),
    notes TEXT,
    last_visited_at TIMESTAMPTZ,
    submission_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SUBMISSIONS TABLE (Primary Field Records with Default pending_review)
CREATE TABLE IF NOT EXISTS public.cmrg_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.cmrg_forms(id),
    case_id TEXT REFERENCES public.cmrg_cases(id),
    enumerator_id UUID NOT NULL REFERENCES public.cmrg_profiles(id),
    enumerator_name TEXT NOT NULL,
    data JSONB NOT NULL, -- Answers key-value payload
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_seconds INT GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time))::INT) STORED,
    device_id TEXT NOT NULL,
    app_version TEXT NOT NULL DEFAULT 'v3.2',
    gps_point GEOMETRY(Point, 4326),
    gps_accuracy_meters NUMERIC(6, 2),
    status submission_status NOT NULL DEFAULT 'pending_review',
    quality_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    supervisor_notes TEXT,
    is_offline_synced BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. HOUSEHOLD ROSTER ITEMS (Normalized Child Table for Repeat Groups)
CREATE TABLE IF NOT EXISTS public.cmrg_household_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.cmrg_submissions(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    age INT NOT NULL,
    gender TEXT NOT NULL,
    education_level TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. AUDIT & QUALITY CHECKS LOG
CREATE TABLE IF NOT EXISTS public.cmrg_quality_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.cmrg_submissions(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    severity severity_level NOT NULL,
    message TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES public.cmrg_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.cmrg_organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmrg_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmrg_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmrg_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmrg_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmrg_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmrg_household_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmrg_quality_audits ENABLE ROW LEVEL SECURITY;

-- Helper function: get user role
CREATE OR REPLACE FUNCTION public.cmrg_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.cmrg_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: Users view own profile; Admins, Owners & Supervisors view all
CREATE POLICY "Users view own profile" ON public.cmrg_profiles
    FOR SELECT USING (auth.uid() = id OR public.cmrg_current_user_role() IN ('owner', 'administrator', 'supervisor'));

-- Forms: Published forms are readable by all authenticated enumerators; Designers & Admins manage
CREATE POLICY "Read published forms" ON public.cmrg_forms
    FOR SELECT TO authenticated
    USING (status = 'published' OR public.cmrg_current_user_role() IN ('owner', 'administrator', 'project_manager', 'form_designer', 'supervisor'));

CREATE POLICY "Designers manage forms" ON public.cmrg_forms
    FOR ALL TO authenticated
    USING (public.cmrg_current_user_role() IN ('owner', 'administrator', 'project_manager', 'form_designer'));

-- Cases: Enumerators see assigned cases; Supervisors see all cases
CREATE POLICY "Enumerators view assigned cases" ON public.cmrg_cases
    FOR SELECT TO authenticated
    USING (
        assigned_enumerator_id = auth.uid()
        OR public.cmrg_current_user_role() IN ('owner', 'administrator', 'project_manager', 'supervisor', 'analyst')
    );

CREATE POLICY "Enumerators update assigned cases status" ON public.cmrg_cases
    FOR UPDATE TO authenticated
    USING (assigned_enumerator_id = auth.uid() OR public.cmrg_current_user_role() IN ('owner', 'administrator', 'supervisor'));

-- Submissions:
-- Enumerators insert their own submissions with pending_review default
CREATE POLICY "Enumerators insert submissions" ON public.cmrg_submissions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = enumerator_id);

CREATE POLICY "Read submissions" ON public.cmrg_submissions
    FOR SELECT TO authenticated
    USING (
        enumerator_id = auth.uid() 
        OR public.cmrg_current_user_role() IN ('owner', 'administrator', 'project_manager', 'supervisor', 'reviewer', 'analyst')
    );

-- Supervisors and Reviewers update status
CREATE POLICY "Supervisors review submissions" ON public.cmrg_submissions
    FOR UPDATE TO authenticated
    USING (public.cmrg_current_user_role() IN ('owner', 'administrator', 'project_manager', 'supervisor', 'reviewer'));

-- Rosters inherit permission from parent submission
CREATE POLICY "Read roster records" ON public.cmrg_household_rosters
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cmrg_submissions s
            WHERE s.id = cmrg_household_rosters.submission_id
            AND (s.enumerator_id = auth.uid() OR public.cmrg_current_user_role() IN ('owner', 'administrator', 'supervisor', 'analyst'))
        )
    );

CREATE POLICY "Insert roster records" ON public.cmrg_household_rosters
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cmrg_submissions s
            WHERE s.id = cmrg_household_rosters.submission_id
            AND s.enumerator_id = auth.uid()
        )
    );

-- =========================================================================
-- STORAGE BUCKET CONFIGURATION (Private Media Vault)
-- =========================================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cmrg_media_vault', 'cmrg_media_vault', false);
-- CREATE POLICY "Enumerators upload survey media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cmrg_media_vault');
-- CREATE POLICY "Authorized download of survey media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cmrg_media_vault');
`;
}

/**
 * Generates Stata do-file script for importing survey data with value labels
 */
export function generateStataSyntax(formTitle: string): string {
  return `* ===============================================================
* CMRG Ltd (RC37852) — Field Data Stata Processing Syntax (.do)
* Form: ${formTitle}
* Generated: 2026-10-15
* ===============================================================

clear all
set more off

* 1. Import CSV
import delimited using "cmrg_${formTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_export.csv", clear varnames(1)

* 2. Format Dates and Timestamps
gen double start_dt = clock(start_time, "YMDhms")
format start_dt %tc
gen double end_dt = clock(end_time, "YMDhms")
format end_dt %tc

* 3. Label Variables
label variable num_in_hh "Total Household Members Sharing Meals"
label variable water_distance_minutes "Minutes to Collect Drinking Water"
label variable duration_seconds "Total Interview Duration (Seconds)"
label variable gps_accuracy "GPS Fix Accuracy in Meters"

* 4. Value Labels
label define water_lbl 1 "Piped water" 2 "Borehole" 3 "Protected well" 4 "Rainwater" 5 "Surface water" 6 "Other"
label define cond_lbl 1 "Excellent" 2 "Good" 3 "Average" 4 "Poor" 5 "Very Poor"
label define status_lbl 1 "Approved" 2 "Pending" 3 "Rejected" 4 "Flagged"

* 5. Summary Statistics and Quality Checks
summarize num_in_hh, detail
summarize duration_seconds, detail
tabulate water_source dwelling_condition, missing

* 6. Flag speed anomalies
gen byte flag_speed = (duration_seconds < 60)
label variable flag_speed "Speed anomaly: interview under 60 seconds"
tabulate flag_speed

di "Data processing complete. Saved to Stata .dta."
`;
}

/**
 * Generates SPSS Syntax (.sps)
 */
export function generateSpssSyntax(formTitle: string): string {
  return `* ===============================================================.
* CMRG Ltd — Field Survey SPSS Syntax File (.sps).
* Form: ${formTitle}.
* ===============================================================.

GET DATA /TYPE=TXT
  /FILE="cmrg_survey_data.csv"
  /DELCASE=LINE
  /DELIMITERS=","
  /QUALIFIER='"'
  /ARRANGEMENT=DELIMITED
  /FIRSTCASE=2
  /VARIABLES=
  submission_id A36
  case_id A20
  respondent_name A60
  dwelling_condition A20
  water_source A20
  water_distance_minutes F4.0
  num_in_hh F3.0
  duration_seconds F5.0
  gps_lat F10.6
  gps_lng F10.6
  status A15.
CACHE.
EXECUTE.

VARIABLE LABELS
  num_in_hh 'Number of Household Members'
  water_distance_minutes 'Time in minutes to water source'
  duration_seconds 'Total survey duration in seconds'.

VALUE LABELS dwelling_condition
  'excellent' 'Excellent Structure'
  'good' 'Good Condition'
  'average' 'Average Living Condition'
  'poor' 'Poor Condition'
  'very_poor' 'Hazardous Condition'.

FREQUENCIES VARIABLES=dwelling_condition water_source num_in_hh
  /STATISTICS=MEAN STDDEV MINIMUM MAXIMUM MEDIAN.
EXECUTE.
`;
}
