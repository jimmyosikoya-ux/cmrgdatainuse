import { FormDefinition, FormSubmission, HouseholdCase, QualityWarning, DatasetDefinition, ExportHistoryItem } from '../types/survey';
import { INITIAL_FORMS, INITIAL_CASES, INITIAL_QUALITY_RULES, generateSampleSubmissions } from '../data/mockData';

const STORAGE_KEYS = {
  FORMS: 'cmrg_forms_v1',
  PROD_SUBMISSIONS: 'cmrg_prod_submissions_v1',
  DEMO_SUBMISSIONS: 'cmrg_demo_submissions_v1',
  IS_DEMO_MODE: 'cmrg_is_demo_mode_v1',
  OFFLINE_QUEUE: 'cmrg_offline_queue_v1',
  DRAFTS: 'cmrg_drafts_v1',
  CASES: 'cmrg_cases_v1',
  DATASETS: 'cmrg_datasets_v1',
  ACTIVE_USER: 'cmrg_active_user_v1',
  SUPABASE_CONFIG: 'cmrg_supabase_config_v1',
  EXPORT_HISTORY: 'cmrg_export_history_v1',
  SERVER_SETTINGS: 'cmrg_server_settings_v1',
  TEAMS: 'cmrg_teams_v1'
};

export interface StoredDraft {
  id: string;
  form_id: string;
  form_title: string;
  case_id?: string;
  data: Record<string, any>;
  last_saved_at: string;
  step_index: number;
}

export interface SupabaseConfig {
  url: string;
  anon_key: string;
  is_connected: boolean;
  project_name: string;
  last_tested_at?: string;
}

export interface ServerSettings {
  autoPurgeSubmissions: boolean;
  purgeDaysOld: number;
  maxUploadSizeBytes: number; // e.g. 5242880 (5MB)
  organizationName: string;
  primaryServerUrl: string;
  licenseModel: string;
  emailNotificationsEnabled: boolean;
  notificationEmail: string;
}

export const INITIAL_DATASETS: DatasetDefinition[] = [
  {
    id: 'participants',
    name: 'Participants',
    version: 30,
    records_count: 54,
    attached_to: ['Admission (admission)', 'GuardianVerification (guardianverification)', 'Interest (interest)', 'Pre-baseline (prebaseline)', 'Signup (signup)'],
    published_from: ['Admission (admission)', 'GuardianVerification (guardianverification)', 'Interest (interest)', 'Signup (signup)'],
    schema_columns: ['participant_id', 'full_name', 'national_id', 'contact_phone', 'village_name', 'enrollment_date'],
    last_updated: '2026-10-14T09:00:00Z'
  },
  {
    id: 'cases',
    name: 'Cases',
    version: 177,
    records_count: 84,
    attached_to: ['Admission (admission)', 'GuardianVerification (guardianverification)', 'Interest (interest)', 'Pre-baseline (prebaseline)', 'Signup (signup)'],
    published_from: ['Admission (admission)', 'Interest (interest)', 'Pre-baseline (prebaseline)', 'Signup (signup)'],
    schema_columns: ['case_id', 'head_of_household', 'village', 'district', 'contact_phone', 'assigned_enumerator_id', 'status'],
    last_updated: '2026-10-14T11:30:00Z'
  }
];

export const INITIAL_TEAMS = [
  { id: 'team_alpha', name: 'Team Alpha - Rural Household Surveillance', supervisor: 'Dr. T. Chikore', members_count: 8, district: 'Mutare Rural' },
  { id: 'team_beta', name: 'Team Beta - Urban WASH & Sanitation', supervisor: 'Eng. K. Ndlovu', members_count: 6, district: 'Harare Metropolitan' },
  { id: 'team_gamma', name: 'Team Gamma - Nutrition & Child Health', supervisor: 'Sr. M. Sithole', members_count: 10, district: 'Manicaland Highlands' }
];

export class CMRGStorage {
  private static isInitialized = false;

  public static initialize(): void {
    if (this.isInitialized) return;

    if (!localStorage.getItem(STORAGE_KEYS.FORMS)) {
      localStorage.setItem(STORAGE_KEYS.FORMS, JSON.stringify(INITIAL_FORMS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.DATASETS)) {
      localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(INITIAL_DATASETS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(INITIAL_TEAMS));
    }

    // Default submissions: populate realistic structured records if both are empty
    if (!localStorage.getItem(STORAGE_KEYS.PROD_SUBMISSIONS) && !localStorage.getItem(STORAGE_KEYS.DEMO_SUBMISSIONS)) {
      const samples = generateSampleSubmissions();
      localStorage.setItem(STORAGE_KEYS.PROD_SUBMISSIONS, JSON.stringify(samples));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CASES)) {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(INITIAL_CASES));
    }

    if (!localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE)) {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.DRAFTS)) {
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.EXPORT_HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.EXPORT_HISTORY, JSON.stringify([
        {
          id: 'exp_001',
          user_email: 'supervisor.chikore@cmrg-field.org',
          project_name: 'CMRG Manicaland & Harare Longitudinal Study',
          form_title: 'Household listing - round 2',
          format: 'xlsx',
          record_count: 173,
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          status: 'completed',
          file_size: '242 KB',
          download_url: '#'
        },
        {
          id: 'exp_002',
          user_email: 'analyst.nyoni@cmrg-field.org',
          project_name: 'CMRG Manicaland & Harare Longitudinal Study',
          form_title: 'Household listing - round 2',
          format: 'csv',
          record_count: 173,
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          status: 'completed',
          file_size: '98 KB',
          download_url: '#'
        }
      ]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SERVER_SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SERVER_SETTINGS, JSON.stringify({
        autoPurgeSubmissions: true,
        purgeDaysOld: 60,
        maxUploadSizeBytes: 5242880,
        organizationName: 'CMRG Ltd (RC37852)',
        primaryServerUrl: 'https://cmrg-manicaland-vault.cmrg-field.org',
        licenseModel: 'CMRG Organization-Owned (Zero Per-User Licensing)',
        emailNotificationsEnabled: true,
        notificationEmail: 'research.operations@cmrg-field.org'
      }));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify({
        url: '',
        anon_key: '',
        is_connected: false,
        project_name: 'cmrg-supabase-unconnected'
      }));
    }

    this.isInitialized = true;
  }

  // Demo / Sandbox mode toggle
  public static isDemoMode(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_DEMO_MODE) === 'true';
  }

  public static setDemoMode(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.IS_DEMO_MODE, enabled ? 'true' : 'false');
  }

  // Forms
  public static getForms(): FormDefinition[] {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FORMS) || '[]');
    } catch {
      return INITIAL_FORMS;
    }
  }

  public static getFormById(id: string): FormDefinition | undefined {
    return this.getForms().find(f => f.id === id);
  }

  public static saveForm(form: FormDefinition): void {
    const forms = this.getForms();
    const index = forms.findIndex(f => f.id === form.id);
    if (index >= 0) {
      forms[index] = { ...form, updated_at: new Date().toISOString() };
    } else {
      forms.unshift(form);
    }
    localStorage.setItem(STORAGE_KEYS.FORMS, JSON.stringify(forms));
  }

  // Datasets (Screenshot 1: Participants, Cases, etc.)
  public static getDatasets(): DatasetDefinition[] {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DATASETS) || '[]');
    } catch {
      return INITIAL_DATASETS;
    }
  }

  public static saveDataset(dataset: DatasetDefinition): void {
    const datasets = this.getDatasets();
    const index = datasets.findIndex(d => d.id === dataset.id);
    if (index >= 0) {
      datasets[index] = { ...dataset, last_updated: new Date().toISOString() };
    } else {
      datasets.unshift(dataset);
    }
    localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(datasets));
  }

  public static deleteDataset(id: string): void {
    const datasets = this.getDatasets().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DATASETS, JSON.stringify(datasets));
  }

  // Teams (Screenshot 3: Your teams)
  public static getTeams(): Array<{ id: string; name: string; supervisor: string; members_count: number; district: string }> {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || '[]');
    } catch {
      return INITIAL_TEAMS;
    }
  }

  public static saveTeam(team: { id: string; name: string; supervisor: string; members_count: number; district: string }): void {
    const teams = this.getTeams();
    const index = teams.findIndex(t => t.id === team.id);
    if (index >= 0) {
      teams[index] = team;
    } else {
      teams.unshift(team);
    }
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  }

  // Submissions
  public static getSubmissions(formId?: string): FormSubmission[] {
    this.initialize();
    try {
      const isDemo = this.isDemoMode();
      const storageKey = isDemo ? STORAGE_KEYS.DEMO_SUBMISSIONS : STORAGE_KEYS.PROD_SUBMISSIONS;
      const all: FormSubmission[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (formId) {
        return all.filter(s => s.form_id === formId);
      }
      return all;
    } catch {
      return [];
    }
  }

  public static saveSubmission(submission: FormSubmission, isOnline: boolean): { queued: boolean; submission: FormSubmission } {
    this.initialize();
    const evaluatedSubmission = this.evaluateQualityRules(submission);

    if (isOnline) {
      const isDemo = this.isDemoMode();
      const storageKey = isDemo ? STORAGE_KEYS.DEMO_SUBMISSIONS : STORAGE_KEYS.PROD_SUBMISSIONS;
      const all = this.getSubmissions();
      
      const existingIdx = all.findIndex(s => s.id === evaluatedSubmission.id);
      if (existingIdx >= 0) {
        all[existingIdx] = evaluatedSubmission;
      } else {
        all.unshift(evaluatedSubmission);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(all));

      if (evaluatedSubmission.case_id) {
        this.updateCaseStatus(evaluatedSubmission.case_id, 'completed', evaluatedSubmission.id);
      }

      const forms = this.getForms();
      const form = forms.find(f => f.id === evaluatedSubmission.form_id);
      if (form) {
        form.submission_count = (form.submission_count || 0) + 1;
        this.saveForm(form);
      }

      return { queued: false, submission: evaluatedSubmission };
    } else {
      const queue = this.getOfflineQueue();
      const existingInQueue = queue.findIndex(q => q.id === evaluatedSubmission.id);
      if (existingInQueue >= 0) {
        queue[existingInQueue] = evaluatedSubmission;
      } else {
        queue.unshift(evaluatedSubmission);
      }
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      return { queued: true, submission: evaluatedSubmission };
    }
  }

  // Quality check evaluator
  public static evaluateQualityRules(submission: FormSubmission): FormSubmission {
    const warnings: QualityWarning[] = [...(submission.quality_warnings || [])];

    // Speed check: rapid interview completion anomaly (< 60s)
    const duration = submission.metadata?.duration_seconds || 0;
    if (duration > 0 && duration < 60) {
      if (!warnings.some(w => w.type === 'speed_anomaly')) {
        warnings.push({
          id: `qw_${Date.now()}_speed`,
          field: 'duration',
          type: 'speed_anomaly',
          message: `Completed in ${duration}s (threshold is 60s). Rapid interview completion anomaly detected.`,
          severity: 'medium',
          detected_at: new Date().toISOString(),
          resolved: false
        });
      }
    }

    // Outlier check on household members
    const numMembers = submission.data?.num_in_hh;
    if (typeof numMembers === 'number' && numMembers > 20) {
      if (!warnings.some(w => w.type === 'statistical_outlier')) {
        warnings.push({
          id: `qw_${Date.now()}_outlier`,
          field: 'num_in_hh',
          type: 'statistical_outlier',
          message: `Value '${numMembers}' is an outlier in field 'num_in_hh' (Regional mean: 5.4, SD: 3.2).`,
          severity: 'high',
          detected_at: new Date().toISOString(),
          resolved: false
        });
      }
    }

    // GPS accuracy warning (> 50m)
    if (submission.gps_location && submission.gps_location.accuracy > 50) {
      if (!warnings.some(w => w.type === 'geofence_drift')) {
        warnings.push({
          id: `qw_${Date.now()}_gps`,
          field: 'gps_accuracy',
          type: 'geofence_drift',
          message: `GPS accuracy ${Math.round(submission.gps_location.accuracy)}m exceeds 50m threshold. Location fix may have drifted.`,
          severity: 'low',
          detected_at: new Date().toISOString(),
          resolved: false
        });
      }
    }

    const updated = { ...submission, quality_warnings: warnings };
    if (warnings.length > 0 && updated.status === 'approved') {
      updated.status = 'flagged';
    }
    return updated;
  }

  public static updateSubmissionStatus(
    id: string,
    status: FormSubmission['status'],
    notes?: string,
    reviewerName: string = 'Authorized Supervisor',
    rejectionReason?: string
  ): void {
    const isDemo = this.isDemoMode();
    const storageKey = isDemo ? STORAGE_KEYS.DEMO_SUBMISSIONS : STORAGE_KEYS.PROD_SUBMISSIONS;
    const all = this.getSubmissions();
    const index = all.findIndex(s => s.id === id);
    if (index >= 0) {
      all[index].status = status;
      if (notes !== undefined) all[index].supervisor_notes = notes;
      if (rejectionReason !== undefined) all[index].rejection_reason = rejectionReason;
      all[index].reviewer_name = reviewerName;

      // Add to timestamped audit trail
      const auditTrail = all[index].audit_trail || [];
      auditTrail.push({
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: (status === 'flagged' ? 'corrections_requested' : status) as any,
        user_name: reviewerName,
        user_id: reviewerName.toLowerCase().replace(/\s+/g, '_'),
        user_role: 'supervisor',
        notes: notes || rejectionReason
      });
      all[index].audit_trail = auditTrail;

      localStorage.setItem(storageKey, JSON.stringify(all));
    }
  }

  // Offline queue
  public static getOfflineQueue(): FormSubmission[] {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
    } catch {
      return [];
    }
  }

  public static syncOfflineQueue(): { syncedCount: number; errors: number } {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { syncedCount: 0, errors: 0 };

    const isDemo = this.isDemoMode();
    const storageKey = isDemo ? STORAGE_KEYS.DEMO_SUBMISSIONS : STORAGE_KEYS.PROD_SUBMISSIONS;
    const all = this.getSubmissions();
    const now = new Date().toISOString();

    for (const sub of queue) {
      const syncedSub: FormSubmission = {
        ...sub,
        synced_at: now,
        is_offline_synced: true
      };

      const existingIndex = all.findIndex(s => s.id === syncedSub.id);
      if (existingIndex >= 0) {
        all[existingIndex] = syncedSub;
      } else {
        all.unshift(syncedSub);
      }

      if (syncedSub.case_id) {
        this.updateCaseStatus(syncedSub.case_id, 'completed', syncedSub.id);
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(all));
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));

    return { syncedCount: queue.length, errors: 0 };
  }

  // Drafts
  public static getDrafts(): StoredDraft[] {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFTS) || '[]');
    } catch {
      return [];
    }
  }

  public static saveDraft(draft: StoredDraft): void {
    const drafts = this.getDrafts();
    const index = drafts.findIndex(d => d.id === draft.id);
    if (index >= 0) {
      drafts[index] = { ...draft, last_saved_at: new Date().toISOString() };
    } else {
      drafts.unshift(draft);
    }
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  }

  public static deleteDraft(id: string): void {
    const drafts = this.getDrafts().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
  }

  // Cases
  public static getCases(): HouseholdCase[] {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    } catch {
      return INITIAL_CASES;
    }
  }

  public static saveCase(newCase: HouseholdCase): void {
    const cases = this.getCases();
    const index = cases.findIndex(c => c.id === newCase.id);
    if (index >= 0) {
      cases[index] = newCase;
    } else {
      cases.unshift(newCase);
    }
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  }

  public static updateCaseStatus(caseId: string, status: HouseholdCase['status'], submissionId?: string): void {
    const cases = this.getCases();
    const index = cases.findIndex(c => c.id === caseId);
    if (index >= 0) {
      cases[index].status = status;
      cases[index].last_visited_at = new Date().toISOString();
      if (submissionId) cases[index].submission_id = submissionId;
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }
  }

  public static assignCase(caseId: string, enumeratorId: string, enumeratorName: string): void {
    const cases = this.getCases();
    const index = cases.findIndex(c => c.id === caseId);
    if (index >= 0) {
      cases[index].assigned_enumerator_id = enumeratorId;
      cases[index].assigned_enumerator_name = enumeratorName;
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }
  }

  // Export History
  public static getExportHistory(): ExportHistoryItem[] {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPORT_HISTORY) || '[]');
    } catch {
      return [];
    }
  }

  public static addExportHistoryItem(item: ExportHistoryItem): void {
    const list = this.getExportHistory();
    list.unshift(item);
    localStorage.setItem(STORAGE_KEYS.EXPORT_HISTORY, JSON.stringify(list));
  }

  // Server Settings (Screenshot 3)
  public static getServerSettings(): ServerSettings {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVER_SETTINGS) || '{}');
    } catch {
      return {
        autoPurgeSubmissions: true,
        purgeDaysOld: 60,
        maxUploadSizeBytes: 5242880,
        organizationName: 'CMRG Ltd (RC37852)',
        primaryServerUrl: 'https://cmrg-manicaland-vault.cmrg-field.org',
        licenseModel: 'CMRG Organization-Owned (Zero Per-User Licensing)',
        emailNotificationsEnabled: true,
        notificationEmail: 'research.operations@cmrg-field.org'
      };
    }
  }

  public static saveServerSettings(settings: ServerSettings): void {
    localStorage.setItem(STORAGE_KEYS.SERVER_SETTINGS, JSON.stringify(settings));
  }

  // Supabase Config
  public static getSupabaseConfig(): SupabaseConfig {
    this.initialize();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG) || '{}');
    } catch {
      return {
        url: '',
        anon_key: '',
        is_connected: false,
        project_name: 'cmrg-supabase'
      };
    }
  }

  public static saveSupabaseConfig(config: SupabaseConfig): void {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
  }

  // Active User Authentication
  public static getActiveUser(): { email: string; name: string; role: string; serverUrl: string } | null {
    this.initialize();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
      if (stored) return JSON.parse(stored);
      return null;
    } catch {
      return null;
    }
  }

  public static saveActiveUser(user: { email: string; name: string; role: string; serverUrl: string } | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    }
  }

  public static logoutUser(): void {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
  }

  // Local storage cleanup
  public static cleanLocalStorage(formIds: string[], deleteDataOnly: boolean): void {
    const storageKey = this.isDemoMode() ? STORAGE_KEYS.DEMO_SUBMISSIONS : STORAGE_KEYS.PROD_SUBMISSIONS;
    if (deleteDataOnly) {
      let allSubs = this.getSubmissions();
      allSubs = allSubs.filter(s => !formIds.includes(s.form_id));
      localStorage.setItem(storageKey, JSON.stringify(allSubs));

      const forms = this.getForms();
      forms.forEach(f => {
        if (formIds.includes(f.id)) {
          f.submission_count = 0;
        }
      });
      localStorage.setItem(STORAGE_KEYS.FORMS, JSON.stringify(forms));
    } else {
      let forms = this.getForms();
      forms = forms.filter(f => !formIds.includes(f.id));
      localStorage.setItem(STORAGE_KEYS.FORMS, JSON.stringify(forms));

      let subs = this.getSubmissions();
      subs = subs.filter(s => !formIds.includes(s.form_id));
      localStorage.setItem(storageKey, JSON.stringify(subs));
    }
  }
}
