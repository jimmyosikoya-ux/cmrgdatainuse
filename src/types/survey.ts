export type QuestionType =
  | 'text'
  | 'integer'
  | 'decimal'
  | 'select_one'
  | 'select_multiple'
  | 'geopoint'
  | 'image'
  | 'audio'
  | 'signature'
  | 'date'
  | 'time'
  | 'repeat'
  | 'repeat_group'
  | 'barcode'
  | 'calculate'
  | 'note';

export interface StoredDraft {
  id: string;
  form_id: string;
  form_title: string;
  case_id?: string;
  data: Record<string, any>;
  last_saved_at: string;
  step_index: number;
}

export interface FormOption {
  value: string;
  label: string;
}

export interface RepeatGroupField {
  id: string;
  name: string;
  type: 'text' | 'integer' | 'select_one' | 'date';
  label: string;
  required?: boolean;
  options?: FormOption[];
}

export interface FormField {
  id: string;
  name: string;
  type: QuestionType;
  label: string;
  hint?: string;
  required?: boolean;
  options?: FormOption[];
  relevance?: string; // Skip logic expression e.g. "water_source = 'other'"
  constraint?: string; // Validation e.g. ". >= 0 and . <= 120"
  constraint_message?: string;
  default_value?: any;
  calculate?: string;
  repeat_fields?: RepeatGroupField[];
  preload_dataset?: string;
  preload_key?: string;
}

export interface FormDefinition {
  id: string;
  title: string;
  version: string;
  description: string;
  category: string;
  fields: FormField[];
  status: 'draft' | 'published' | 'archived';
  encryption_enabled: boolean;
  public_key?: string;
  created_at: string;
  updated_at: string;
  submission_count: number;
  published_to_datasets?: string[];
  datasets_attached?: string[];
}

export interface GPSCoordinate {
  lat: number;
  lng: number;
  altitude?: number;
  accuracy: number;
  timestamp: string;
  reverse_address?: string;
  geocoding_status?: 'available' | 'unavailable' | 'pending' | 'denied';
}

export interface QualityWarning {
  id: string;
  field: string;
  type: 'speed_anomaly' | 'statistical_outlier' | 'geofence_drift' | 'missing_critical' | 'duplicate_entry';
  message: string;
  severity: 'low' | 'medium' | 'high';
  detected_at: string;
  resolved: boolean;
}

export interface MediaAttachment {
  field_id: string;
  file_name: string;
  file_type: string;
  file_url: string; // base64 or signed url
  storage_path: string;
  size_bytes?: number;
  upload_status?: 'uploaded' | 'pending' | 'failed' | 'denied';
  file_size_formatted?: string;
  mime_type?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'submitted' | 'approved' | 'rejected' | 'corrections_requested' | 'edited' | 'synced' | 'flagged' | 'pending_review';
  user_name: string;
  user_id: string;
  user_role: string;
  notes?: string;
}

export interface FormSubmission {
  id: string; // Permanent unique submission ID
  organization_id?: string;
  project_id?: string;
  project_name?: string;
  form_id: string;
  form_title: string;
  questionnaire_version?: string;
  case_id?: string;
  interview_id?: string;
  enumerator_id: string;
  enumerator_name: string;
  enumerator_staff_id?: string;
  supervisor_name?: string;
  team_name?: string;
  device_id?: string;
  data: Record<string, any>;
  metadata: {
    start_time: string;
    end_time: string;
    duration_seconds: number;
    device_id: string;
    app_version: string;
    server_receipt_timestamp?: string;
    last_sync_timestamp?: string;
  };
  gps_location?: GPSCoordinate;
  media_attachments: MediaAttachment[];
  quality_warnings: QualityWarning[];
  status: 'approved' | 'rejected' | 'pending_review' | 'flagged';
  supervisor_notes?: string;
  reviewer_name?: string;
  reviewer_id?: string;
  rejection_reason?: string;
  audit_trail?: AuditLogEntry[];
  created_at: string;
  synced_at: string;
  is_offline_synced?: boolean;
  transcription?: AudioTranscriptionData;
}

export interface AudioTranscriptionData {
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'awaiting_configuration';
  transcript?: string;
  original_transcript?: string;
  language_detected?: string;
  completed_at?: string;
  error_message?: string;
  segments?: Array<{ segmentId: string; start: number; end: number; text: string }>;
  edit_history?: Array<{
    timestamp: string;
    edited_by: string;
    previous_text: string;
    new_text: string;
    reason?: string;
  }>;
  discrepancy_flags?: Array<{
    field_id: string;
    description: string;
    flagged_by: string;
    timestamp: string;
  }>;
}

export interface HouseholdCase {
  id: string; // e.g. "HH-2026-081"
  title: string;
  head_of_household: string;
  village: string;
  district: string;
  contact_phone: string;
  assigned_enumerator_id: string;
  assigned_enumerator_name: string;
  status: 'unvisited' | 'in_progress' | 'completed' | 'follow_up_needed' | 'verified';
  priority: 'high' | 'medium' | 'low';
  target_visit_date: string;
  baseline_members_count: number;
  gps_expected: { lat: number; lng: number };
  notes?: string;
  last_visited_at?: string;
  submission_id?: string;
}

export interface DatasetDefinition {
  id: string; // e.g. "participants", "cases"
  name: string;
  version: number;
  records_count: number;
  attached_to: string[];
  published_from: string[];
  schema_columns: string[];
  last_updated: string;
}

export interface ExportHistoryItem {
  id: string;
  user_email: string;
  project_name: string;
  form_title: string;
  format: 'csv' | 'xlsx' | 'spss_sav' | 'json' | 'geojson' | 'kml';
  record_count: number;
  timestamp: string;
  status: 'completed' | 'processing' | 'failed';
  download_url?: string;
  file_size?: string;
  expires_at?: string;
}

export interface VariableFrequencyItem {
  code: string | number;
  answer_label: string;
  count: number;
  percentage: number;
}

export interface VariableSummaryReport {
  field_name: string;
  question_prompt: string;
  total_n: number;
  valid_count: number;
  missing_count: number;
  missing_percentage: number;
  mean?: number;
  median?: number;
  standard_deviation?: number;
  min?: number;
  max?: number;
  frequencies: VariableFrequencyItem[];
}

export interface CrosstabMatrix {
  row_variable: string;
  row_label: string;
  col_variable: string;
  col_label: string;
  row_categories: string[];
  col_categories: string[];
  matrix: number[][]; // [rowIdx][colIdx] = count
  row_totals: number[];
  col_totals: number[];
  grand_total: number;
}

export interface PreloadedDataset {
  id: string;
  name: string;
  description: string;
  record_count: number;
  columns: string[];
  last_updated: string;
  data: Record<string, any>[];
}

export interface EnumeratorProfile {
  id: string;
  name: string;
  email: string;
  role: 'enumerator' | 'supervisor' | 'analyst';
  assigned_district: string;
  device_id: string;
  submissions_count: number;
  quality_score: number;
  status: 'active' | 'suspended' | 'offline';
}

export interface QualityRule {
  id: string;
  name: string;
  form_id: string;
  type: 'speed' | 'outlier' | 'geofence' | 'consistency';
  field?: string;
  condition_description: string;
  threshold_value?: number;
  enabled: boolean;
}

