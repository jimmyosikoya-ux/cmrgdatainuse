import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { getSupabase } from './supabase';
import { CMRGStorage } from './storage';
import { FormDefinition, FormSubmission, HouseholdCase, QualityWarning } from '../types/survey';

export class CMRGDataService {
  /**
   * Loads forms: First checks Firestore, falls back to local storage cache if offline
   */
  public static async getForms(): Promise<FormDefinition[]> {
    try {
      const snap = await getDocs(collection(db, 'forms'));
      if (!snap.empty) {
        const cloudForms: FormDefinition[] = [];
        snap.forEach(d => {
          cloudForms.push(d.data() as FormDefinition);
        });
        // Cache to local storage for offline use
        cloudForms.forEach(f => CMRGStorage.saveForm(f));
        return cloudForms;
      }
    } catch (err) {
      console.warn('Firestore getForms fallback to local storage:', err);
    }
    return CMRGStorage.getForms();
  }

  /**
   * Real-time subscription to forms
   */
  public static subscribeForms(callback: (forms: FormDefinition[]) => void): () => void {
    const path = 'forms';
    try {
      return onSnapshot(
        collection(db, path),
        (snapshot) => {
          if (!snapshot.empty) {
            const forms: FormDefinition[] = [];
            snapshot.forEach(d => forms.push(d.data() as FormDefinition));
            forms.forEach(f => CMRGStorage.saveForm(f));
            callback(forms);
          } else {
            callback(CMRGStorage.getForms());
          }
        },
        (error) => {
          console.warn('Forms subscription listener fallback:', error.message);
          callback(CMRGStorage.getForms());
        }
      );
    } catch {
      callback(CMRGStorage.getForms());
      return () => {};
    }
  }

  /**
   * Save / publish form definition to Firestore & Supabase
   */
  public static async saveForm(form: FormDefinition): Promise<void> {
    const path = `forms/${form.id}`;
    // Always save locally first for immediate responsiveness
    CMRGStorage.saveForm(form);

    try {
      await setDoc(doc(db, 'forms', form.id), {
        ...form,
        created_by: auth.currentUser?.uid || 'admin',
        updated_at: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore form save warning:', error);
    }

    // Also push to Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('cmrg_forms').upsert({
          form_slug: form.id,
          title: form.title,
          version: form.version,
          description: form.description,
          category: form.category,
          status: form.status,
          schema_json: form.fields,
          encryption_enabled: form.encryption_enabled,
          updated_at: new Date().toISOString()
        });
      } catch (sbErr) {
        console.warn('Supabase form sync warning:', sbErr);
      }
    }
  }

  /**
   * Real-time subscription to submissions
   */
  public static subscribeSubmissions(
    callback: (submissions: FormSubmission[]) => void,
    formId?: string
  ): () => void {
    const path = 'submissions';
    try {
      return onSnapshot(
        collection(db, path),
        (snapshot) => {
          const subs: FormSubmission[] = [];
          snapshot.forEach(d => {
            const data = d.data() as FormSubmission;
            if (!formId || data.form_id === formId) {
              subs.push(data);
            }
          });

          // Sort latest first
          subs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          if (subs.length > 0) {
            callback(subs);
          } else {
            // If cloud has no records yet, return local production submissions
            callback(CMRGStorage.getSubmissions(formId));
          }
        },
        (error) => {
          console.warn('Submissions subscription fallback:', error.message);
          callback(CMRGStorage.getSubmissions(formId));
        }
      );
    } catch {
      callback(CMRGStorage.getSubmissions(formId));
      return () => {};
    }
  }

  /**
   * Submits a survey with GPS, quality rules, and duplicate protection
   */
  public static async submitSurvey(
    submission: FormSubmission,
    isOnline: boolean = navigator.onLine
  ): Promise<{ success: boolean; queued: boolean; submission: FormSubmission }> {
    // 1. Evaluate quality rules
    const evaluated = CMRGStorage.evaluateQualityRules(submission);

    // 2. If offline, reliably queue in persistent storage
    if (!isOnline) {
      const res = CMRGStorage.saveSubmission(evaluated, false);
      return { success: true, queued: true, submission: res.submission };
    }

    // 3. If online, save to local cache
    CMRGStorage.saveSubmission(evaluated, true);

    // 4. Save to Firestore with idempotency
    const path = `submissions/${evaluated.id}`;
    try {
      await setDoc(doc(db, 'submissions', evaluated.id), evaluated, { merge: true });

      // If associated with a case, update case status in Firestore
      if (evaluated.case_id) {
        await updateDoc(doc(db, 'cases', evaluated.case_id), {
          status: 'completed',
          last_visited_at: new Date().toISOString(),
          submission_id: evaluated.id
        }).catch(() => {});
      }
    } catch (fsErr) {
      console.warn('Firestore submit warning, item remains cached locally:', fsErr);
    }

    // 5. Save to Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('cmrg_submissions').upsert({
          id: evaluated.id,
          form_id: evaluated.form_id,
          case_id: evaluated.case_id || null,
          enumerator_id: evaluated.enumerator_id,
          enumerator_name: evaluated.enumerator_name,
          data: evaluated.data,
          start_time: evaluated.metadata?.start_time || evaluated.created_at,
          end_time: evaluated.metadata?.end_time || evaluated.created_at,
          device_id: evaluated.metadata?.device_id || 'browser-field',
          app_version: evaluated.metadata?.app_version || 'v3.2',
          gps_accuracy_meters: evaluated.gps_location?.accuracy || null,
          status: evaluated.status,
          quality_warnings: evaluated.quality_warnings || [],
          supervisor_notes: evaluated.supervisor_notes || null,
          is_offline_synced: evaluated.is_offline_synced || false,
          created_at: evaluated.created_at,
          synced_at: new Date().toISOString()
        });
      } catch (sbErr) {
        console.warn('Supabase sync warning:', sbErr);
      }
    }

    return { success: true, queued: false, submission: evaluated };
  }

  /**
   * Supervisor Review: Approves, rejects, or flags submission with notes and audit trail
   */
  public static async updateSubmissionStatus(
    submissionId: string,
    status: FormSubmission['status'],
    supervisorNotes?: string
  ): Promise<void> {
    // 1. Update local storage immediately
    CMRGStorage.updateSubmissionStatus(submissionId, status, supervisorNotes);

    // 2. Update Firestore
    const path = `submissions/${submissionId}`;
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        status,
        ...(supervisorNotes !== undefined ? { supervisor_notes: supervisorNotes } : {}),
        synced_at: new Date().toISOString()
      });
    } catch (fsErr) {
      console.warn('Firestore status update warning:', fsErr);
    }

    // 3. Update Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('cmrg_submissions').update({
          status,
          ...(supervisorNotes !== undefined ? { supervisor_notes: supervisorNotes } : {}),
          synced_at: new Date().toISOString()
        }).eq('id', submissionId);
      } catch (sbErr) {
        console.warn('Supabase status update warning:', sbErr);
      }
    }
  }

  /**
   * Sync offline queue to Firestore and Supabase
   */
  public static async syncOfflineQueue(): Promise<{ syncedCount: number; errors: number }> {
    const queue = CMRGStorage.getOfflineQueue();
    if (queue.length === 0) return { syncedCount: 0, errors: 0 };

    let syncedCount = 0;
    let errors = 0;

    for (const sub of queue) {
      try {
        const syncedSub: FormSubmission = {
          ...sub,
          synced_at: new Date().toISOString(),
          is_offline_synced: true
        };

        // Write to Firestore
        await setDoc(doc(db, 'submissions', syncedSub.id), syncedSub, { merge: true });

        // Update case if linked
        if (syncedSub.case_id) {
          await updateDoc(doc(db, 'cases', syncedSub.case_id), {
            status: 'completed',
            last_visited_at: new Date().toISOString(),
            submission_id: syncedSub.id
          }).catch(() => {});
        }

        // Write to Supabase if connected
        const supabase = getSupabase();
        if (supabase) {
          await supabase.from('cmrg_submissions').upsert({
            id: syncedSub.id,
            form_id: syncedSub.form_id,
            case_id: syncedSub.case_id || null,
            enumerator_id: syncedSub.enumerator_id,
            enumerator_name: syncedSub.enumerator_name,
            data: syncedSub.data,
            start_time: syncedSub.metadata?.start_time || syncedSub.created_at,
            end_time: syncedSub.metadata?.end_time || syncedSub.created_at,
            device_id: syncedSub.metadata?.device_id || 'offline-sync-device',
            status: syncedSub.status,
            quality_warnings: syncedSub.quality_warnings || [],
            is_offline_synced: true,
            created_at: syncedSub.created_at,
            synced_at: syncedSub.synced_at
          });
        }

        syncedCount++;
      } catch (err) {
        console.error('Failed to sync offline item:', sub.id, err);
        errors++;
      }
    }

    // Flush synced items from local queue
    CMRGStorage.syncOfflineQueue();

    return { syncedCount, errors };
  }

  /**
   * Real-time subscription to cases
   */
  public static subscribeCases(callback: (cases: HouseholdCase[]) => void): () => void {
    const path = 'cases';
    try {
      return onSnapshot(
        collection(db, path),
        (snapshot) => {
          if (!snapshot.empty) {
            const cases: HouseholdCase[] = [];
            snapshot.forEach(d => cases.push(d.data() as HouseholdCase));
            cases.forEach(c => CMRGStorage.saveCase(c));
            callback(cases);
          } else {
            callback(CMRGStorage.getCases());
          }
        },
        () => {
          callback(CMRGStorage.getCases());
        }
      );
    } catch {
      callback(CMRGStorage.getCases());
      return () => {};
    }
  }

  /**
   * Live dashboard metrics derived from real records
   */
  public static async getDashboardMetrics(submissions: FormSubmission[], cases: HouseholdCase[]) {
    const totalSubmissions = submissions.length;
    const approved = submissions.filter(s => s.status === 'approved').length;
    const pendingReview = submissions.filter(s => s.status === 'pending_review').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;
    const flagged = submissions.filter(s => s.status === 'flagged').length;
    const withGps = submissions.filter(s => s.gps_location?.lat && s.gps_location?.lng).length;
    const activeCases = cases.length;
    const completedCases = cases.filter(c => c.status === 'completed' || c.status === 'verified').length;

    return {
      totalSubmissions,
      approved,
      pendingReview,
      rejected,
      flagged,
      withGps,
      activeCases,
      completedCases
    };
  }
}
