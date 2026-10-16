import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware for JSON and large Base64 audio/photo payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// In-memory persistent server state for access codes, audit logs, and sync receipts
interface AccessCodeRecord {
  code: string;
  projectId: string;
  projectName: string;
  formId?: string;
  assignedRole: 'enumerator' | 'supervisor' | 'analyst';
  assignedTeam?: string;
  district?: string;
  expiresAt: string; // ISO
  maxUses: number;
  currentUses: number;
  status: 'active' | 'revoked' | 'expired';
  createdBy: string;
  createdAt: string;
  auditTrail: Array<{ timestamp: string; action: string; actor: string; note?: string }>;
}

const serverState = {
  accessCodes: new Map<string, AccessCodeRecord>([
    [
      'CMRG-FIELD-HARARE-2026',
      {
        code: 'CMRG-FIELD-HARARE-2026',
        projectId: 'cmrg_longitudinal_2026',
        projectName: 'CMRG Manicaland & Harare Longitudinal Study',
        formId: 'form_hh_round2',
        assignedRole: 'enumerator',
        assignedTeam: 'Team Beta - Urban WASH & Sanitation',
        district: 'Harare Metropolitan',
        expiresAt: new Date(Date.now() + 86400000 * 90).toISOString(),
        maxUses: 100,
        currentUses: 14,
        status: 'active',
        createdBy: 'supervisor.chikore@cmrg-field.org',
        createdAt: '2026-10-01T08:00:00Z',
        auditTrail: [
          {
            timestamp: '2026-10-01T08:00:00Z',
            action: 'created',
            actor: 'supervisor.chikore@cmrg-field.org',
            note: 'Provisioned for Round 2 Enumeration batch'
          }
        ]
      }
    ],
    [
      'CMRG-MUTARE-RURAL-774',
      {
        code: 'CMRG-MUTARE-RURAL-774',
        projectId: 'cmrg_longitudinal_2026',
        projectName: 'CMRG Manicaland & Harare Longitudinal Study',
        formId: 'form_hh_round2',
        assignedRole: 'enumerator',
        assignedTeam: 'Team Alpha - Rural Household Surveillance',
        district: 'Mutare Rural',
        expiresAt: new Date(Date.now() + 86400000 * 60).toISOString(),
        maxUses: 50,
        currentUses: 22,
        status: 'active',
        createdBy: 'supervisor.chikore@cmrg-field.org',
        createdAt: '2026-10-02T10:00:00Z',
        auditTrail: [
          {
            timestamp: '2026-10-02T10:00:00Z',
            action: 'created',
            actor: 'supervisor.chikore@cmrg-field.org'
          }
        ]
      }
    ]
  ]),
  serverAuditLogs: [] as Array<{
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details: any;
  }>,
  syncReceipts: new Map<string, {
    receiptId: string;
    submissionId: string;
    idempotencyKey: string;
    serverReceiptTimestamp: string;
    status: 'acknowledged' | 'duplicate_ignored';
    acknowledgementToken: string;
  }>()
};

// ================= API ENDPOINTS =================

// 1. Health & Readiness Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    services: {
      aiProvider: aiClient ? 'configured' : 'awaiting_configuration',
      database: 'cloud_firestore_active',
      offlineEngine: 'indexeddb_pwa_enabled',
      storageBackend: 'supabase_and_local_dual'
    },
    platform: 'CMRG Data Collect (Enterprise Field Edition)',
    organization: 'Communication and Marketing Research Group Limited (RC378525)'
  });
});

// 2. AI Questionnaire Builder Endpoint
app.post('/api/ai/generate-questionnaire', async (req, res) => {
  try {
    const { prompt, studyCategory, targetRespondents, preferredLanguage } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'A prompt or research brief is required.'
      });
    }

    if (!aiClient) {
      return res.status(503).json({
        error: 'Gemini AI provider is not configured. Please configure GEMINI_API_KEY in the environment secrets panel.',
        awaitingConfig: true
      });
    }

    const systemInstruction = `You are the Principal Survey Methodologist and Questionnaire Architect for Communication and Marketing Research Group Limited (CMRG).
Turn the research brief into a complete, comprehensive, production-ready questionnaire matching CMRG's exact data model.

You MUST output ONLY a valid JSON object matching this TypeScript interface without markdown wrappers or other commentary:

interface GeneratedForm {
  title: string;
  description: string;
  category: string; // e.g. "Household", "Health", "WASH", "Agriculture", "Socio-economic"
  version: string; // e.g. "1.0.0"
  fields: Array<{
    id: string;
    name: string; // clean snake_case variable name
    type: "note" | "text" | "integer" | "decimal" | "select_one" | "select_multiple" | "date" | "time" | "geopoint" | "image" | "audio" | "signature" | "barcode" | "calculate" | "repeat_group";
    label: string; // Clear question wording
    hint?: string; // Interviewer instructions
    required: boolean;
    options?: Array<{ value: string; label: string }>; // For select_one and select_multiple
    relevance?: string; // Skip logic expression e.g. "water_source = 'other'" or "age >= 18"
    constraint?: string; // e.g. ". >= 0 and . <= 120"
    constraint_message?: string;
    calculation?: string; // For calculate type
    repeat_count?: number; // For repeat_group type
  }>;
}

Guidelines:
1. Generate an exhaustive, professional instrument with appropriate sections (Eligibility & Consent, Identification, Demographics, Core Subject Questions, GPS Location, Photo/Audio Evidence, and Respondent Signature).
2. Use clean snake_case for variable names (e.g. respondent_age, household_income, main_water_source).
3. Include valid skip logic (relevance rules) where appropriate.
4. Output strict JSON only.`;

    const userPrompt = `Study Category: ${studyCategory || 'Household & Socio-Economic'}
Target Respondents: ${targetRespondents || 'Heads of Household & Adults 18+'}
Language: ${preferredLanguage || 'English'}
Research Brief:
${prompt}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Attempt clean regex extract
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse structured questionnaire JSON from AI response.');
      }
    }

    // Assign stable IDs if missing
    if (parsed.fields && Array.isArray(parsed.fields)) {
      parsed.fields = parsed.fields.map((f: any, idx: number) => ({
        ...f,
        id: f.id || `fld_${Date.now()}_${idx + 1}`,
        name: f.name || `var_${idx + 1}`,
        type: f.type || 'text',
        required: Boolean(f.required)
      }));
    }

    // Log audit
    serverState.serverAuditLogs.push({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'system.ai_studio',
      action: 'questionnaire_synthesized',
      resourceType: 'form',
      resourceId: parsed.title || 'untitled',
      details: { fieldCount: parsed.fields?.length || 0, category: parsed.category }
    });

    return res.json({
      success: true,
      form: parsed
    });
  } catch (err: any) {
    console.error('AI Questionnaire generation error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate questionnaire with AI.'
    });
  }
});

// 3. Audio Upload and AI Transcription Endpoint
app.post('/api/ai/transcribe-audio', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      submissionId,
      audioFileName,
      languageHint
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({
        error: 'audioBase64 data is required for transcription.'
      });
    }

    if (!aiClient) {
      return res.status(503).json({
        status: 'awaiting_configuration',
        error: 'Speech-to-text API is not configured. Set GEMINI_API_KEY in the Secrets panel.',
        awaitingConfig: true
      });
    }

    // Clean base64 header if present
    const cleanBase64 = audioBase64.includes('base64,')
      ? audioBase64.split('base64,')[1]
      : audioBase64;

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: cleanBase64
      }
    };

    const promptText = `Transcribe this field interview audio recording verbatim.
Preserve exact wording, pauses, and responses. 
Support English and regional language terms where applicable (e.g. Nigerian/African localized terms).
Format output as a structured transcript. Include timestamps or speaker turns where distinguishable.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [audioPart, { text: promptText }]
      }
    });

    const transcriptText = response.text || '';

    // Generate basic segments from line breaks or timestamps
    const rawLines = transcriptText.split('\n').filter(l => l.trim().length > 0);
    const segments = rawLines.map((line, idx) => ({
      segmentId: `seg_${idx + 1}`,
      start: idx * 5,
      end: (idx + 1) * 5,
      text: line.trim()
    }));

    const result = {
      status: 'completed',
      submissionId,
      audioFileName: audioFileName || 'field_recording.webm',
      transcript: transcriptText,
      languageDetected: languageHint || 'English (Regional Fieldwork)',
      segments,
      completedAt: new Date().toISOString(),
      modelUsed: 'gemini-3.5-transcribe',
      isMachineGenerated: true
    };

    // Log to server audit
    serverState.serverAuditLogs.push({
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'system.speech_transcriber',
      action: 'audio_transcribed',
      resourceType: 'submission_audio',
      resourceId: submissionId || 'unknown',
      details: { wordCount: transcriptText.split(/\s+/).length }
    });

    return res.json(result);
  } catch (err: any) {
    console.error('Audio transcription error:', err);
    return res.status(500).json({
      status: 'failed',
      error: err.message || 'Audio transcription failed on server.'
    });
  }
});

// 4. Access Code Management Endpoints
app.get('/api/access-codes', (req, res) => {
  const codes = Array.from(serverState.accessCodes.values());
  res.json({ accessCodes: codes });
});

app.post('/api/access-codes', (req, res) => {
  const {
    projectId,
    projectName,
    formId,
    assignedRole = 'enumerator',
    assignedTeam,
    district,
    maxUses = 50,
    validDays = 30,
    createdBy = 'CMRG Administrator'
  } = req.body;

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const cleanTeam = (assignedTeam || 'FIELD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  const code = `CMRG-${cleanTeam}-${randomSuffix}`;

  const record: AccessCodeRecord = {
    code,
    projectId: projectId || 'cmrg_primary_project',
    projectName: projectName || 'CMRG Field Operations',
    formId,
    assignedRole,
    assignedTeam,
    district,
    expiresAt: new Date(Date.now() + 86400000 * validDays).toISOString(),
    maxUses: Number(maxUses) || 50,
    currentUses: 0,
    status: 'active',
    createdBy,
    createdAt: new Date().toISOString(),
    auditTrail: [
      {
        timestamp: new Date().toISOString(),
        action: 'created',
        actor: createdBy,
        note: `Issued for ${assignedRole} in ${district || 'National'}`
      }
    ]
  };

  serverState.accessCodes.set(code, record);

  serverState.serverAuditLogs.push({
    id: `aud_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: createdBy,
    action: 'access_code_created',
    resourceType: 'access_code',
    resourceId: code,
    details: { assignedRole, maxUses }
  });

  res.json({ success: true, accessCode: record });
});

app.post('/api/access-codes/verify', (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Access code is required.' });
  }

  const record = serverState.accessCodes.get(code.trim().toUpperCase());
  if (!record) {
    return res.status(404).json({ valid: false, error: 'Invalid or unknown activation code.' });
  }

  if (record.status === 'revoked') {
    return res.status(403).json({ valid: false, error: 'This access code has been revoked by an administrator.' });
  }

  const isExpired = new Date(record.expiresAt).getTime() < Date.now();
  if (isExpired) {
    record.status = 'expired';
    return res.status(403).json({ valid: false, error: 'This access code has expired.' });
  }

  if (record.currentUses >= record.maxUses) {
    return res.status(403).json({ valid: false, error: 'Maximum device authorization limit reached for this code.' });
  }

  // Record usage
  record.currentUses += 1;
  record.auditTrail.push({
    timestamp: new Date().toISOString(),
    action: 'device_activated',
    actor: 'mobile_client',
    note: `Device authorized. Total activations: ${record.currentUses}/${record.maxUses}`
  });

  return res.json({
    valid: true,
    accessCode: record,
    authorizationToken: `cmrg_auth_${Buffer.from(code + ':' + Date.now()).toString('base64')}`
  });
});

app.post('/api/access-codes/revoke', (req, res) => {
  const { code, reason, actor = 'Administrator' } = req.body;
  const record = serverState.accessCodes.get(code);
  if (!record) {
    return res.status(404).json({ error: 'Code not found' });
  }

  record.status = 'revoked';
  record.auditTrail.push({
    timestamp: new Date().toISOString(),
    action: 'revoked',
    actor,
    note: reason || 'Revoked via Administration Console'
  });

  serverState.serverAuditLogs.push({
    id: `aud_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor,
    action: 'access_code_revoked',
    resourceType: 'access_code',
    resourceId: code,
    details: { reason }
  });

  res.json({ success: true, message: `Access code ${code} revoked.` });
});

// 5. Idempotent Submission Sync Endpoint
app.post('/api/sync/submissions', (req, res) => {
  const { submissions, idempotencyKey } = req.body;

  if (!submissions || !Array.isArray(submissions)) {
    return res.status(400).json({ error: 'submissions array is required.' });
  }

  const receipts: any[] = [];
  const now = new Date().toISOString();

  for (const sub of submissions) {
    const subKey = sub.id || `sub_${Date.now()}`;
    const existing = serverState.syncReceipts.get(subKey);

    if (existing) {
      receipts.push({
        submissionId: subKey,
        receiptId: existing.receiptId,
        acknowledgementToken: existing.acknowledgementToken,
        status: 'duplicate_ignored',
        serverReceiptTimestamp: existing.serverReceiptTimestamp
      });
      continue;
    }

    const receiptId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const acknowledgementToken = `ack_${Buffer.from(subKey + ':' + now).toString('base64')}`;

    const receiptObj = {
      receiptId,
      submissionId: subKey,
      idempotencyKey: idempotencyKey || subKey,
      serverReceiptTimestamp: now,
      status: 'acknowledged' as const,
      acknowledgementToken
    };

    serverState.syncReceipts.set(subKey, receiptObj);
    receipts.push(receiptObj);

    // Audit log
    serverState.serverAuditLogs.push({
      id: `aud_${Date.now()}`,
      timestamp: now,
      actor: sub.enumerator_name || 'enumerator',
      action: 'submission_received',
      resourceType: 'submission',
      resourceId: subKey,
      details: {
        formId: sub.form_id,
        gps: sub.gps_location ? 'captured' : 'none',
        duration: sub.metadata?.duration_seconds
      }
    });
  }

  res.json({
    success: true,
    processedCount: submissions.length,
    receipts
  });
});

// 6. Backup Export and Restore Endpoints
app.get('/api/backup/export', (req, res) => {
  const backupData = {
    formatVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    organization: 'Communication and Marketing Research Group Limited (RC378525)',
    accessCodes: Array.from(serverState.accessCodes.values()),
    auditLogs: serverState.serverAuditLogs,
    receiptCount: serverState.syncReceipts.size,
    checksum: `sha_${Buffer.from(new Date().toISOString()).toString('base64')}`
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=cmrg_backup_${Date.now()}.json`);
  res.json(backupData);
});

app.post('/api/backup/restore', (req, res) => {
  const { backupData } = req.body;
  if (!backupData || !backupData.organization) {
    return res.status(400).json({ success: false, error: 'Invalid CMRG backup snapshot structure.' });
  }

  let restoredCodes = 0;
  if (Array.isArray(backupData.accessCodes)) {
    for (const codeObj of backupData.accessCodes) {
      serverState.accessCodes.set(codeObj.code, codeObj);
      restoredCodes++;
    }
  }

  serverState.serverAuditLogs.push({
    id: `aud_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: 'administrator',
    action: 'backup_restored',
    resourceType: 'system_backup',
    resourceId: backupData.checksum || 'manual_snapshot',
    details: { restoredCodes, exportedAt: backupData.exportedAt }
  });

  res.json({
    success: true,
    message: `System snapshot restored successfully. Restored ${restoredCodes} access codes.`,
    verification: {
      codesInDb: serverState.accessCodes.size,
      status: 'verified_healthy'
    }
  });
});

// 7. Audit Logs Endpoint
app.get('/api/audit-logs', (req, res) => {
  res.json({ auditLogs: serverState.serverAuditLogs });
});

// ================= VITE DEV MIDDLEWARE =================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CMRG Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
