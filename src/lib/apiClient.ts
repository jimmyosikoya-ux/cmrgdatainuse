/**
 * CMRG Data Collect - Enterprise Server API Client
 * Connects frontend modules to server-side endpoints for AI generation,
 * audio speech-to-text, access code verification, sync receipts, and disaster recovery.
 */

import { FormDefinition, FormSubmission } from '../types/survey';

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  memoryUsageMB: number;
  services: {
    aiProvider: string;
    database: string;
    offlineEngine: string;
    storageBackend: string;
  };
  platform: string;
  organization: string;
}

export interface AccessCodeItem {
  code: string;
  projectId: string;
  projectName: string;
  formId?: string;
  assignedRole: 'enumerator' | 'supervisor' | 'analyst';
  assignedTeam?: string;
  district?: string;
  expiresAt: string;
  maxUses: number;
  currentUses: number;
  status: 'active' | 'revoked' | 'expired';
  createdBy: string;
  createdAt: string;
  auditTrail: Array<{ timestamp: string; action: string; actor: string; note?: string }>;
}

export interface TranscriptionResult {
  status: 'completed' | 'failed' | 'awaiting_configuration';
  submissionId?: string;
  audioFileName?: string;
  transcript?: string;
  languageDetected?: string;
  segments?: Array<{ segmentId: string; start: number; end: number; text: string }>;
  completedAt?: string;
  modelUsed?: string;
  isMachineGenerated?: boolean;
  error?: string;
}

export class CMRGApiClient {
  public static async getHealth(): Promise<HealthResponse | null> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return await res.json();
      return null;
    } catch (err) {
      console.warn('API health check error:', err);
      return null;
    }
  }

  public static async generateQuestionnaire(params: {
    prompt: string;
    studyCategory?: string;
    targetRespondents?: string;
    preferredLanguage?: string;
  }): Promise<{ success: boolean; form?: FormDefinition; error?: string; awaitingConfig?: boolean }> {
    try {
      const res = await fetch('/api/ai/generate-questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Server error generating questionnaire',
          awaitingConfig: data.awaitingConfig
        };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error reaching AI Studio backend' };
    }
  }

  public static async transcribeAudio(params: {
    audioBase64: string;
    mimeType?: string;
    submissionId?: string;
    audioFileName?: string;
    languageHint?: string;
  }): Promise<TranscriptionResult> {
    try {
      const res = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return {
        status: 'failed',
        error: err.message || 'Failed to reach speech-to-text service'
      };
    }
  }

  public static async getAccessCodes(): Promise<AccessCodeItem[]> {
    try {
      const res = await fetch('/api/access-codes');
      if (res.ok) {
        const data = await res.json();
        return data.accessCodes || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  public static async createAccessCode(params: {
    projectId?: string;
    projectName?: string;
    formId?: string;
    assignedRole?: 'enumerator' | 'supervisor' | 'analyst';
    assignedTeam?: string;
    district?: string;
    maxUses?: number;
    validDays?: number;
    createdBy?: string;
  }): Promise<{ success: boolean; accessCode?: AccessCodeItem; error?: string }> {
    try {
      const res = await fetch('/api/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public static async verifyAccessCode(code: string): Promise<{
    valid: boolean;
    accessCode?: AccessCodeItem;
    authorizationToken?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/access-codes/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      return await res.json();
    } catch (err: any) {
      return { valid: false, error: err.message || 'Network error verifying access code' };
    }
  }

  public static async revokeAccessCode(code: string, reason?: string, actor?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/access-codes/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, reason, actor })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false };
    }
  }

  public static async syncSubmissions(submissions: FormSubmission[], idempotencyKey: string) {
    try {
      const res = await fetch('/api/sync/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions, idempotencyKey })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public static async exportBackup() {
    window.open('/api/backup/export', '_blank');
  }

  public static async restoreBackup(backupData: any): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
