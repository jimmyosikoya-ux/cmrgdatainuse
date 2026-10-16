import { FormDefinition, FormSubmission, HouseholdCase, PreloadedDataset, EnumeratorProfile, QualityRule } from '../types/survey';

export const INITIAL_FORMS: FormDefinition[] = [
  {
    id: 'form_hh_round2',
    title: 'Household listing - round 2',
    version: '2.4.1',
    description: 'Comprehensive socio-demographic, living condition, WASH and roster survey for remote rural household enumeration.',
    category: 'Household Economics',
    status: 'published',
    encryption_enabled: true,
    created_at: '2026-09-12T08:00:00Z',
    updated_at: '2026-10-14T16:20:00Z',
    submission_count: 173,
    fields: [
      {
        id: 'case_lookup',
        name: 'case_id',
        type: 'text',
        label: 'Household ID or Barcode',
        hint: 'Scan census QR tag or enter pre-assigned ID (e.g., HH-2026-081)',
        required: true,
        preload_dataset: 'dataset_census_baseline',
        preload_key: 'hh_id'
      },
      {
        id: 'respondent_name',
        name: 'respondent_name',
        type: 'text',
        label: 'Name of Primary Respondent / Household Head',
        hint: 'Full legal name as recognized in community registry',
        required: true
      },
      {
        id: 'gps_location',
        name: 'gps_location',
        type: 'geopoint',
        label: 'ENUMERATOR: Please record your GPS location at the main dwelling entrance.',
        hint: 'Stand outside dwelling with clear view of sky until accuracy is under 10 meters.',
        required: true
      },
      {
        id: 'dwelling_condition',
        name: 'dwelling_condition',
        type: 'select_one',
        label: 'How would you rate the overall physical condition of the dwelling?',
        required: true,
        options: [
          { value: 'excellent', label: 'Excellent (Solid masonry/concrete, intact roof)' },
          { value: 'good', label: 'Good (Minor wear, sound structure)' },
          { value: 'average', label: 'Average (Adequate shelter, visible weathering)' },
          { value: 'poor', label: 'Poor (Damaged thatch/corrugated sheets, cracked walls)' },
          { value: 'very_poor', label: 'Very Poor (Severe structural hazards, temporary thatch)' }
        ]
      },
      {
        id: 'water_source',
        name: 'water_source',
        type: 'select_one',
        label: 'What is the main source of drinking water for this household?',
        required: true,
        options: [
          { value: 'piped_water', label: 'Piped water to dwelling or yard' },
          { value: 'borehole', label: 'Protected borehole / tube well' },
          { value: 'protected_well', label: 'Protected dug well' },
          { value: 'rainwater', label: 'Rainwater collection storage' },
          { value: 'surface_water', label: 'Surface water (River, dam, lake, canal)' },
          { value: 'other', label: 'Other source (specify)' }
        ]
      },
      {
        id: 'water_source_other',
        name: 'water_source_other',
        type: 'text',
        label: 'Please specify the other water source:',
        relevance: "water_source = 'other'",
        required: true
      },
      {
        id: 'water_distance_minutes',
        name: 'water_distance_minutes',
        type: 'integer',
        label: 'Round-trip walking time to collect drinking water (minutes)',
        hint: '0 if source is inside compound',
        constraint: '. >= 0 and . <= 360',
        constraint_message: 'Value must be between 0 and 360 minutes.'
      },
      {
        id: 'num_in_hh',
        name: 'num_in_hh',
        type: 'integer',
        label: 'How many household members currently live and share meals here?',
        hint: 'Include members who have slept here for at least 3 of the last 6 months.',
        required: true,
        constraint: '. >= 1 and . <= 40',
        constraint_message: 'Household size must be at least 1 and usually under 40.'
      },
      {
        id: 'members_roster',
        name: 'members_roster',
        type: 'repeat',
        label: 'Household Member Demographic Roster',
        hint: 'Add entry for each household member reported in the total count.',
        repeat_fields: [
          { id: 'm_name', name: 'member_name', type: 'text', label: 'Member Name', required: true },
          {
            id: 'm_relation',
            name: 'relationship',
            type: 'select_one',
            label: 'Relationship to Head',
            options: [
              { value: 'head', label: 'Household Head' },
              { value: 'spouse', label: 'Spouse / Partner' },
              { value: 'child', label: 'Son / Daughter' },
              { value: 'parent', label: 'Parent / In-law' },
              { value: 'grandchild', label: 'Grandchild' },
              { value: 'other_relative', label: 'Other Relative' }
            ]
          },
          { id: 'm_age', name: 'age', type: 'integer', label: 'Age (years)', required: true },
          {
            id: 'm_gender',
            name: 'gender',
            type: 'select_one',
            label: 'Gender',
            options: [
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
              { value: 'other', label: 'Other' }
            ]
          }
        ]
      },
      {
        id: 'primary_income_source',
        name: 'primary_income_source',
        type: 'select_one',
        label: 'Primary livelihood or cash income stream:',
        options: [
          { value: 'crop_farming', label: 'Smallholder crop farming' },
          { value: 'livestock', label: 'Livestock / poultry rearing' },
          { value: 'wage_labor', label: 'Daily casual agricultural labor' },
          { value: 'salaried', label: 'Formal salaried employment' },
          { value: 'trading', label: 'Micro-retail or market trading' },
          { value: 'remittances', label: 'Remittances / Family support' }
        ]
      },
      {
        id: 'dwelling_photo',
        name: 'dwelling_photo',
        type: 'image',
        label: 'Add a photo of dwelling structure (optional)',
        hint: 'Capture wide view showing roofline and entrance.'
      },
      {
        id: 'audio_consent_note',
        name: 'audio_consent_note',
        type: 'audio',
        label: 'Verbal consent audio audit (optional)',
        hint: 'Record 10-second oral confirmation statement.'
      },
      {
        id: 'respondent_signature',
        name: 'respondent_signature',
        type: 'signature',
        label: 'Respondent Signature / Digital Mark',
        hint: 'Sign directly on screen with finger or stylus.',
        required: true
      }
    ]
  },
  {
    id: 'form_wash_rapid',
    title: 'WASH & Community Health Rapid Audit',
    version: '1.2.0',
    description: 'Sanitation facility inspection, water treatment verification, and hygiene practices assessment.',
    category: 'Water & Sanitation',
    status: 'published',
    encryption_enabled: true,
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-10-10T11:00:00Z',
    submission_count: 48,
    fields: [
      { id: 'facility_id', name: 'facility_id', type: 'text', label: 'Water Point / School / Clinic ID', required: true },
      { id: 'facility_type', name: 'facility_type', type: 'select_one', label: 'Facility Type', required: true, options: [
        { value: 'communal_borehole', label: 'Communal Borehole' },
        { value: 'primary_school', label: 'Primary School' },
        { value: 'health_post', label: 'Rural Health Post' }
      ]},
      { id: 'sanitation_gps', name: 'sanitation_gps', type: 'geopoint', label: 'GPS Coordinates', required: true },
      { id: 'handwashing_station', name: 'handwashing_station', type: 'select_one', label: 'Is a functional handwashing station present?', options: [
        { value: 'yes_soap_water', label: 'Yes, with soap and running water' },
        { value: 'yes_water_only', label: 'Yes, but water only (no soap)' },
        { value: 'none', label: 'No station available' }
      ]}
    ]
  }
];

export const INITIAL_PRELOAD_DATASETS: PreloadedDataset[] = [
  {
    id: 'dataset_census_baseline',
    name: 'Household Census Baseline & Sampling Frame 2026',
    description: 'Preloaded listing of target households in Mutare District, Chisamba, Muchena, and Sakubwa clusters.',
    record_count: 240,
    columns: ['hh_id', 'head_name', 'village', 'ward', 'phone', 'members_baseline'],
    last_updated: '2026-10-12T14:00:00Z',
    data: [
      { hh_id: 'HH-2026-081', head_name: 'Tendai Mutasa', village: 'Muchena', ward: 'Ward 4', phone: '+263 77 123 4567', members_baseline: 6 },
      { hh_id: 'HH-2026-082', head_name: 'Farai Nyathi', village: 'Chisamba', ward: 'Ward 4', phone: '+263 77 234 5678', members_baseline: 4 },
      { hh_id: 'HH-2026-083', head_name: 'Chipo Sibanda', village: 'Sakubwa', ward: 'Ward 8', phone: '+263 77 345 6789', members_baseline: 7 },
      { hh_id: 'HH-2026-084', head_name: 'Blessing Moyo', village: 'Dangare', ward: 'Ward 3', phone: '+263 77 456 7890', members_baseline: 5 },
      { hh_id: 'HH-2026-085', head_name: 'Tinashe Dube', village: 'Muchena', ward: 'Ward 4', phone: '+263 77 567 8901', members_baseline: 8 },
      { hh_id: 'HH-2026-086', head_name: 'Grace Chirwa', village: 'Sakubwa', ward: 'Ward 8', phone: '+263 77 678 9012', members_baseline: 3 }
    ]
  }
];

export const INITIAL_CASES: HouseholdCase[] = [
  {
    id: 'HH-2026-081',
    title: 'Household #081 — Mutasa Family',
    head_of_household: 'Tendai Mutasa',
    village: 'Muchena',
    district: 'Mutare Rural',
    contact_phone: '+263 77 123 4567',
    assigned_enumerator_id: 'enum_01',
    assigned_enumerator_name: 'Amina Khumalo',
    status: 'completed',
    priority: 'high',
    target_visit_date: '2026-10-14',
    baseline_members_count: 6,
    gps_expected: { lat: -18.9725, lng: 32.6512 },
    notes: 'Prior round reported water shortage; check new borehole proximity.',
    last_visited_at: '2026-10-14T09:42:15Z',
    submission_id: 'sub_001'
  },
  {
    id: 'HH-2026-082',
    title: 'Household #082 — Nyathi Compound',
    head_of_household: 'Farai Nyathi',
    village: 'Chisamba',
    district: 'Mutare Rural',
    contact_phone: '+263 77 234 5678',
    assigned_enumerator_id: 'enum_01',
    assigned_enumerator_name: 'Amina Khumalo',
    status: 'in_progress',
    priority: 'medium',
    target_visit_date: '2026-10-15',
    baseline_members_count: 4,
    gps_expected: { lat: -18.9680, lng: 32.6640 },
    notes: 'Farmer cooperative member; follow up on maize yield.'
  },
  {
    id: 'HH-2026-083',
    title: 'Household #083 — Sibanda Homestead',
    head_of_household: 'Chipo Sibanda',
    village: 'Sakubwa',
    district: 'Mutare Urban',
    contact_phone: '+263 77 345 6789',
    assigned_enumerator_id: 'enum_02',
    assigned_enumerator_name: 'David Chimedza',
    status: 'unvisited',
    priority: 'high',
    target_visit_date: '2026-10-16',
    baseline_members_count: 7,
    gps_expected: { lat: -18.9890, lng: 32.6420 },
    notes: 'Requires female head of household consent form.'
  },
  {
    id: 'HH-2026-084',
    title: 'Household #084 — Moyo Residence',
    head_of_household: 'Blessing Moyo',
    village: 'Dangare',
    district: 'Mutare Rural',
    contact_phone: '+263 77 456 7890',
    assigned_enumerator_id: 'enum_02',
    assigned_enumerator_name: 'David Chimedza',
    status: 'follow_up_needed',
    priority: 'high',
    target_visit_date: '2026-10-15',
    baseline_members_count: 5,
    gps_expected: { lat: -18.9550, lng: 32.6710 },
    notes: 'Respondent was at market during first attempt; return before 4 PM.'
  },
  {
    id: 'HH-2026-085',
    title: 'Household #085 — Dube Homestead',
    head_of_household: 'Tinashe Dube',
    village: 'Muchena',
    district: 'Mutare Rural',
    contact_phone: '+263 77 567 8901',
    assigned_enumerator_id: 'enum_03',
    assigned_enumerator_name: 'Grace Marufu',
    status: 'verified',
    priority: 'medium',
    target_visit_date: '2026-10-13',
    baseline_members_count: 8,
    gps_expected: { lat: -18.9740, lng: 32.6480 },
    last_visited_at: '2026-10-13T14:15:00Z',
    submission_id: 'sub_002'
  },
  {
    id: 'HH-2026-086',
    title: 'Household #086 — Chirwa Homestead',
    head_of_household: 'Grace Chirwa',
    village: 'Sakubwa',
    district: 'Mutare Urban',
    contact_phone: '+263 77 678 9012',
    assigned_enumerator_id: 'enum_03',
    assigned_enumerator_name: 'Grace Marufu',
    status: 'unvisited',
    priority: 'low',
    target_visit_date: '2026-10-17',
    baseline_members_count: 3,
    gps_expected: { lat: -18.9830, lng: 32.6450 },
    notes: 'Elderly resident; take extra care with consent reading.'
  }
];

export const INITIAL_ENUMERATORS: EnumeratorProfile[] = [
  {
    id: 'enum_01',
    name: 'Amina Khumalo',
    email: 'amina.khumalo@cmrg-field.org',
    role: 'enumerator',
    assigned_district: 'Mutare Rural / Muchena',
    device_id: 'SM-G990B_A498',
    submissions_count: 64,
    quality_score: 99.2,
    status: 'active'
  },
  {
    id: 'enum_02',
    name: 'David Chimedza',
    email: 'david.chimedza@cmrg-field.org',
    role: 'enumerator',
    assigned_district: 'Sakubwa & Dangare',
    device_id: 'TECNO-KF6P_9912',
    submissions_count: 58,
    quality_score: 96.5,
    status: 'active'
  },
  {
    id: 'enum_03',
    name: 'Grace Marufu',
    email: 'grace.marufu@cmrg-field.org',
    role: 'supervisor',
    assigned_district: 'Manicaland North',
    device_id: 'TAB-A8-SM_X200',
    submissions_count: 51,
    quality_score: 98.7,
    status: 'active'
  }
];

export const INITIAL_QUALITY_RULES: QualityRule[] = [
  {
    id: 'rule_speed',
    name: 'Surveyor Speed Anomaly Check',
    form_id: 'form_hh_round2',
    type: 'speed',
    condition_description: 'Flag interview if total duration < 60 seconds (indicates rapid clicking or skipped questions)',
    threshold_value: 60,
    enabled: true
  },
  {
    id: 'rule_hh_size_outlier',
    name: 'Household Size Statistical Outlier',
    form_id: 'form_hh_round2',
    type: 'outlier',
    field: 'num_in_hh',
    condition_description: 'Flag if number of household members is > 20 (statistical z-score > 3.0)',
    threshold_value: 20,
    enabled: true
  },
  {
    id: 'rule_geofence',
    name: 'Assigned Geopoint Proximity Check',
    form_id: 'form_hh_round2',
    type: 'geofence',
    condition_description: 'Flag if recorded GPS coordinates deviate > 500m from baseline census geopoint',
    threshold_value: 500,
    enabled: true
  }
];

// Helper to generate the 173 submissions matching Image 2 metrics
export function generateSampleSubmissions(): FormSubmission[] {
  const submissions: FormSubmission[] = [];
  const villages = [
    { name: 'Chisamba', lat: -18.9680, lng: 32.6640 },
    { name: 'Muchena', lat: -18.9725, lng: 32.6512 },
    { name: 'Sakubwa', lat: -18.9890, lng: 32.6420 },
    { name: 'Dangare', lat: -18.9550, lng: 32.6710 },
    { name: 'Mutare Aerodrome', lat: -18.9950, lng: 32.6280 }
  ];

  const waterSources = ['borehole', 'piped_water', 'protected_well', 'rainwater', 'surface_water', 'other'];
  const conditions = ['excellent', 'good', 'average', 'poor', 'very_poor'];
  const enumerators = INITIAL_ENUMERATORS;

  // Exact outlier submission matching Image 2: "The value '23' for the submission with ID ... is an outlier in the field num_in_hh"
  const outlierSubmission: FormSubmission = {
    id: 'sub-cmrg-8f12-001',
    form_id: 'form_hh_round2',
    form_title: 'Household listing - round 2',
    case_id: 'HH-2026-081',
    enumerator_id: enumerators[0].id,
    enumerator_name: enumerators[0].name,
    data: {
      case_id: 'HH-2026-081',
      respondent_name: 'Tendai Mutasa',
      dwelling_condition: 'average',
      water_source: 'borehole',
      water_distance_minutes: 15,
      num_in_hh: 23, // Outlier!
      primary_income_source: 'crop_farming'
    },
    metadata: {
      start_time: '2026-10-14T09:38:00Z',
      end_time: '2026-10-14T09:42:15Z',
      duration_seconds: 255, // 4m 15s
      device_id: enumerators[0].device_id,
      app_version: 'v3.2-prod'
    },
    gps_location: {
      lat: -18.9721,
      lng: 32.6519,
      accuracy: 4.8,
      timestamp: '2026-10-14T09:39:10Z'
    },
    media_attachments: [
      {
        field_id: 'dwelling_photo',
        file_name: 'mutasa_compound_entry.jpg',
        file_type: 'image/jpeg',
        file_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80',
        storage_path: 'surveys/form_hh_round2/mutasa_compound_entry.jpg'
      }
    ],
    quality_warnings: [
      {
        id: 'qw_001',
        field: 'num_in_hh',
        type: 'statistical_outlier',
        message: "The value '23' for submission is an outlier in the field 'num_in_hh' (Sample mean: 5.62, SD: 3.76).",
        severity: 'high',
        detected_at: '2026-10-14T09:42:20Z',
        resolved: false
      }
    ],
    status: 'flagged',
    created_at: '2026-10-14T09:42:15Z',
    synced_at: '2026-10-14T09:42:25Z',
    is_offline_synced: true
  };
  submissions.push(outlierSubmission);

  // Speed anomaly submission: Duration only 38 seconds!
  const speedAnomalySub: FormSubmission = {
    id: 'sub-cmrg-8f12-002',
    form_id: 'form_hh_round2',
    form_title: 'Household listing - round 2',
    case_id: 'HH-2026-083',
    enumerator_id: enumerators[1].id,
    enumerator_name: enumerators[1].name,
    data: {
      case_id: 'HH-2026-083',
      respondent_name: 'Chipo Sibanda',
      dwelling_condition: 'good',
      water_source: 'piped_water',
      water_distance_minutes: 0,
      num_in_hh: 4,
      primary_income_source: 'trading'
    },
    metadata: {
      start_time: '2026-10-14T11:15:00Z',
      end_time: '2026-10-14T11:15:38Z',
      duration_seconds: 38, // < 60s
      device_id: enumerators[1].device_id,
      app_version: 'v3.2-prod'
    },
    gps_location: {
      lat: -18.9888,
      lng: 32.6425,
      accuracy: 6.2,
      timestamp: '2026-10-14T11:15:10Z'
    },
    media_attachments: [],
    quality_warnings: [
      {
        id: 'qw_002',
        field: 'duration',
        type: 'speed_anomaly',
        message: 'Completed in 38 seconds (threshold is 60 seconds). Rapid input detected.',
        severity: 'medium',
        detected_at: '2026-10-14T11:15:40Z',
        resolved: false
      }
    ],
    status: 'pending_review',
    created_at: '2026-10-14T11:15:38Z',
    synced_at: '2026-10-14T11:16:00Z',
    is_offline_synced: true
  };
  submissions.push(speedAnomalySub);

  // Geofence drift submission: > 650m away from village center
  const geofenceAnomalySub: FormSubmission = {
    id: 'sub-cmrg-8f12-003',
    form_id: 'form_hh_round2',
    form_title: 'Household listing - round 2',
    case_id: 'HH-2026-084',
    enumerator_id: enumerators[1].id,
    enumerator_name: enumerators[1].name,
    data: {
      case_id: 'HH-2026-084',
      respondent_name: 'Blessing Moyo',
      dwelling_condition: 'poor',
      water_source: 'surface_water',
      water_distance_minutes: 45,
      num_in_hh: 7,
      primary_income_source: 'wage_labor'
    },
    metadata: {
      start_time: '2026-10-14T12:00:00Z',
      end_time: '2026-10-14T12:04:10Z',
      duration_seconds: 250,
      device_id: enumerators[1].device_id,
      app_version: 'v3.2-prod'
    },
    gps_location: {
      lat: -18.9610,
      lng: 32.6820, // drift > 700m
      accuracy: 9.1,
      timestamp: '2026-10-14T12:01:00Z'
    },
    media_attachments: [],
    quality_warnings: [
      {
        id: 'qw_003',
        field: 'gps_location',
        type: 'geofence_drift',
        message: 'GPS location recorded 740m from designated Dangare village cluster point.',
        severity: 'medium',
        detected_at: '2026-10-14T12:04:20Z',
        resolved: false
      }
    ],
    status: 'flagged',
    created_at: '2026-10-14T12:04:10Z',
    synced_at: '2026-10-14T12:05:00Z',
    is_offline_synced: false
  };
  submissions.push(geofenceAnomalySub);

  // Generate remaining up to 173 submissions with realistic distribution
  // Image 2 stats: Total 173, total duration 10h 30m 9s (~37809 seconds), average 3m 38s (~218 seconds)
  // num_in_hh distribution: Mean ~5.62, SD ~3.76, Min: 1, Max: 23, Median: 5
  const sampleSizes = [1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 7, 7, 8, 9, 10, 11, 12, 14, 16];

  for (let i = 4; i <= 173; i++) {
    const village = villages[i % villages.length];
    const enumUser = enumerators[i % enumerators.length];
    const water = waterSources[i % waterSources.length];
    const condition = conditions[i % conditions.length];
    const numMembers = sampleSizes[i % sampleSizes.length];

    // Jitter coordinates within 0.015 deg (~1.5km) of cluster centers
    const lat = village.lat + ((Math.sin(i * 1.7) * 0.008) + ((i % 5) * 0.002));
    const lng = village.lng + ((Math.cos(i * 2.3) * 0.008) + ((i % 7) * 0.002));

    // Durations around 210-230 seconds to maintain average ~3m 38s
    const duration = 180 + ((i * 13) % 85);

    submissions.push({
      id: `sub-cmrg-8f12-${String(i).padStart(3, '0')}`,
      form_id: 'form_hh_round2',
      form_title: 'Household listing - round 2',
      case_id: `HH-2026-${String(80 + (i % 30)).padStart(3, '0')}`,
      enumerator_id: enumUser.id,
      enumerator_name: enumUser.name,
      data: {
        case_id: `HH-2026-${String(80 + (i % 30)).padStart(3, '0')}`,
        respondent_name: `Respondent ${i} (${village.name})`,
        dwelling_condition: condition,
        water_source: water,
        water_distance_minutes: water === 'piped_water' ? 0 : ((i * 3) % 40),
        num_in_hh: numMembers,
        primary_income_source: ['crop_farming', 'wage_labor', 'trading', 'salaried'][i % 4]
      },
      metadata: {
        start_time: new Date(Date.now() - (173 - i) * 3600000).toISOString(),
        end_time: new Date(Date.now() - (173 - i) * 3600000 + duration * 1000).toISOString(),
        duration_seconds: duration,
        device_id: enumUser.device_id,
        app_version: 'v3.2-prod'
      },
      gps_location: {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        accuracy: Number((3.5 + ((i % 4) * 1.2)).toFixed(1)),
        timestamp: new Date(Date.now() - (173 - i) * 3600000 + 30000).toISOString()
      },
      media_attachments: [],
      quality_warnings: [],
      status: i % 15 === 0 ? 'pending_review' : 'approved',
      created_at: new Date(Date.now() - (173 - i) * 3600000).toISOString(),
      synced_at: new Date(Date.now() - (173 - i) * 3600000 + 120000).toISOString(),
      is_offline_synced: i % 3 === 0
    });
  }

  return submissions;
}
