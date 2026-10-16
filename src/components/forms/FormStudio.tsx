import React, { useState } from 'react';
import {
  Save,
  Play,
  Edit2,
  Copy,
  Trash2,
  Plus,
  MessageSquare,
  Disc,
  Type,
  Hash,
  MapPin,
  Camera,
  Mic,
  PenTool,
  QrCode,
  Calculator,
  Layers,
  Calendar,
  Clock,
  Sparkles,
  Check,
  Send,
  ShieldCheck,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckSquare
} from 'lucide-react';
import { FormDefinition, FormField, QuestionType } from '../../types/survey';
import { CMRGStorage } from '../../lib/storage';
import { CMRGDataService } from '../../lib/dataService';
import { CMRGApiClient } from '../../lib/apiClient';

interface FormStudioProps {
  onOpenMobile?: (formId: string) => void;
  onClose?: () => void;
}

const PRESET_RESEARCH_BRIEFS = [
  {
    title: 'Rural Household Living Standards & WASH Audit',
    category: 'Household & WASH',
    respondents: 'Heads of Household & Primary Caregivers (18+)',
    prompt: 'Conduct a comprehensive longitudinal survey evaluating household demographics, access to clean drinking water, sanitation facilities, hygiene practices, and vulnerability to seasonal waterborne illnesses in rural communities.'
  },
  {
    title: 'Maternal, Infant & Child Health Surveillance',
    category: 'Public Health',
    respondents: 'Mothers and caregivers of children under 5 years',
    prompt: 'Evaluate antenatal care visits, institutional delivery rates, routine immunization coverage, infant feeding practices, and child growth monitoring indicators across rural health clusters.'
  },
  {
    title: 'Smallholder Agriculture Yields & Market Access',
    category: 'Agriculture & Food Security',
    respondents: 'Smallholder farming household heads',
    prompt: 'Assess crop acreages, maize and legume yields, access to certified seeds and fertilizers, post-harvest grain losses, local grain market price realization, and household food insecurity coping strategies.'
  },
  {
    title: 'Youth Employment, Vocational Skills & Digital Livelihoods',
    category: 'Socio-economic & Labor',
    respondents: 'Youth aged 18 to 35 in urban and peri-urban settlements',
    prompt: 'Investigate employment status, informal economic activities, technical and vocational training completion, smartphone access, digital gig work participation, and monthly income bands.'
  }
];

export const FormStudio: React.FC<FormStudioProps> = ({ onOpenMobile, onClose }) => {
  const [forms, setForms] = useState<FormDefinition[]>(() => CMRGStorage.getForms());
  const [activeForm, setActiveForm] = useState<FormDefinition>(() => forms[0] || CMRGStorage.getForms()[0]);
  const [mode, setMode] = useState<'design' | 'test'>('design');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // AI Questionnaire Builder State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiBrief, setAiBrief] = useState<string>(PRESET_RESEARCH_BRIEFS[0].prompt);
  const [aiCategory, setAiCategory] = useState<string>(PRESET_RESEARCH_BRIEFS[0].category);
  const [aiRespondents, setAiRespondents] = useState<string>(PRESET_RESEARCH_BRIEFS[0].respondents);
  const [aiLanguage, setAiLanguage] = useState<string>('English');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiStepMessage, setAiStepMessage] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);

  // Publish Modal & Validation State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [publishVersion, setPublishVersion] = useState<string>(() => {
    const parts = (forms[0]?.version || '1.0.0').split('.');
    const nextMinor = (parseInt(parts[1] || '0') + 1).toString();
    return `${parts[0] || '1'}.${nextMinor}.0`;
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 3500);
  };

  const handleSave = async () => {
    await CMRGDataService.saveForm(activeForm);
    setForms(CMRGStorage.getForms());
    showToast(`Questionnaire '${activeForm.title}' saved to database.`);
  };

  // Pre-publication schema verification
  const validateQuestionnaire = (): { valid: boolean; errors: string[]; warnings: string[] } => {
    const errs: string[] = [];
    const warns: string[] = [];

    if (!activeForm.title || activeForm.title.trim().length === 0) {
      errs.push('Questionnaire title cannot be blank.');
    }

    if (!activeForm.fields || activeForm.fields.length === 0) {
      errs.push('Questionnaire must contain at least one question.');
    }

    const varNames = new Set<string>();
    activeForm.fields.forEach((field, idx) => {
      // Check label
      if (!field.label || field.label.trim().length === 0) {
        errs.push(`Question #${idx + 1} (${field.name || 'unnamed'}) has an empty label.`);
      }

      // Check unique variable name
      if (!field.name || !/^[a-z][a-z0-9_]*$/.test(field.name)) {
        warns.push(`Variable name '${field.name}' should use lowercase letters, numbers, and underscores (snake_case).`);
      }
      if (varNames.has(field.name)) {
        errs.push(`Duplicate variable name detected: '${field.name}'. Each question variable must be unique.`);
      }
      varNames.add(field.name);

      // Check choice options
      if (['select_one', 'select_multiple'].includes(field.type)) {
        if (!field.options || field.options.length < 2) {
          errs.push(`Question '${field.name}' (${field.type}) must have at least 2 answer choices configured.`);
        }
      }
    });

    return { valid: errs.length === 0, errors: errs, warnings: warns };
  };

  const handleOpenPublishModal = () => {
    const { errors, warnings } = validateQuestionnaire();
    setValidationErrors(errors);
    setValidationWarnings(warnings);
    setIsPublishModalOpen(true);
  };

  const handlePublish = async () => {
    const { valid } = validateQuestionnaire();
    if (!valid) return;

    setIsPublishing(true);
    const updatedForm: FormDefinition = {
      ...activeForm,
      version: publishVersion,
      status: 'published',
      updated_at: new Date().toISOString()
    };

    try {
      await CMRGDataService.saveForm(updatedForm);
      setActiveForm(updatedForm);
      setForms(CMRGStorage.getForms());
      setIsPublishModalOpen(false);
      showToast(`Questionnaire published live as immutable version ${publishVersion}!`);
    } catch (err: any) {
      showToast('Error publishing questionnaire to database.');
    } finally {
      setIsPublishing(false);
    }
  };

  // AI Questionnaire Builder Execution
  const handleGenerateAiQuestionnaire = async () => {
    if (!aiBrief.trim()) {
      setAiError('Please enter a research brief or study description.');
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);
    setAiStepMessage('Transmitting brief to CMRG Survey Methodology Engine...');

    try {
      setTimeout(() => setAiStepMessage('Synthesizing variables, choice lists, and skip logic...'), 1500);
      setTimeout(() => setAiStepMessage('Validating questions against CMRG schema standards...'), 3500);

      const result = await CMRGApiClient.generateQuestionnaire({
        prompt: aiBrief,
        studyCategory: aiCategory,
        targetRespondents: aiRespondents,
        preferredLanguage: aiLanguage
      });

      if (!result.success || !result.form) {
        if (result.awaitingConfig) {
          setAiError('Gemini AI Provider is awaiting configuration (GEMINI_API_KEY). You can continue manual form design or set the key in the Secrets panel.');
        } else {
          setAiError(result.error || 'Failed to generate questionnaire.');
        }
        return;
      }

      const generatedForm: FormDefinition = {
        id: `form_${Date.now()}`,
        title: result.form.title || 'AI Generated Questionnaire',
        version: result.form.version || '1.0.0',
        description: result.form.description || aiBrief,
        category: result.form.category || aiCategory,
        status: 'draft',
        encryption_enabled: true,
        submission_count: 0,
        fields: result.form.fields || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save and make active
      await CMRGDataService.saveForm(generatedForm);
      const updatedList = CMRGStorage.getForms();
      setForms(updatedList);
      setActiveForm(generatedForm);
      setIsAiModalOpen(false);
      showToast(`Synthesized complete questionnaire with ${generatedForm.fields.length} variables!`);
    } catch (err: any) {
      setAiError(err.message || 'Error occurred while contacting AI service.');
    } finally {
      setIsGeneratingAi(false);
      setAiStepMessage('');
    }
  };

  const handleAddFieldAt = (index: number, type: QuestionType = 'text') => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      name: `question_${activeForm.fields.length + 1}`,
      type,
      label: type === 'note' ? 'Please swipe forward to continue.' : 'New survey question prompt',
      required: false,
      options: ['select_one', 'select_multiple'].includes(type) ? [
        { value: 'option_1', label: 'Option 1' },
        { value: 'option_2', label: 'Option 2' }
      ] : undefined
    };

    const updated = [...activeForm.fields];
    updated.splice(index, 0, newField);
    const updatedForm = { ...activeForm, fields: updated };
    setActiveForm(updatedForm);
    setEditingFieldId(newField.id);
    CMRGDataService.saveForm(updatedForm);
  };

  const handleDuplicateField = (field: FormField, index: number) => {
    const dup: FormField = {
      ...field,
      id: `field_${Date.now()}`,
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`
    };
    const updated = [...activeForm.fields];
    updated.splice(index + 1, 0, dup);
    const updatedForm = { ...activeForm, fields: updated };
    setActiveForm(updatedForm);
    CMRGDataService.saveForm(updatedForm);
  };

  const handleDeleteField = (id: string) => {
    if (activeForm.fields.length <= 1) return;
    const updated = activeForm.fields.filter(f => f.id !== id);
    const updatedForm = { ...activeForm, fields: updated };
    setActiveForm(updatedForm);
    CMRGDataService.saveForm(updatedForm);
  };

  const handleUpdateField = (index: number, partial: Partial<FormField>) => {
    const updated = [...activeForm.fields];
    updated[index] = { ...updated[index], ...partial };
    const updatedForm = { ...activeForm, fields: updated };
    setActiveForm(updatedForm);
  };

  const handleAddChoice = (fieldIndex: number) => {
    const field = activeForm.fields[fieldIndex];
    const opts = field.options || [];
    const nextVal = `option_${opts.length + 1}`;
    const nextLabel = `Option ${opts.length + 1}`;
    handleUpdateField(fieldIndex, {
      options: [...opts, { value: nextVal, label: nextLabel }]
    });
  };

  const handleRemoveChoice = (fieldIndex: number, choiceIndex: number) => {
    const field = activeForm.fields[fieldIndex];
    const opts = (field.options || []).filter((_, i) => i !== choiceIndex);
    handleUpdateField(fieldIndex, { options: opts });
  };

  const handleUpdateChoice = (fieldIndex: number, choiceIndex: number, partial: { value?: string; label?: string }) => {
    const field = activeForm.fields[fieldIndex];
    const opts = [...(field.options || [])];
    opts[choiceIndex] = { ...opts[choiceIndex], ...partial };
    handleUpdateField(fieldIndex, { options: opts });
  };

  const getFieldIcon = (type: QuestionType) => {
    switch (type) {
      case 'note':
        return (
          <div className="w-7 h-7 bg-[#D71920] text-white flex items-center justify-center rounded-sm shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'select_one':
        return (
          <div className="w-7 h-7 bg-slate-800 text-white flex items-center justify-center rounded-sm shrink-0">
            <Disc className="w-4 h-4 text-red-400" />
          </div>
        );
      case 'select_multiple':
        return (
          <div className="w-7 h-7 bg-slate-800 text-white flex items-center justify-center rounded-sm shrink-0">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
        );
      case 'integer':
      case 'decimal':
        return (
          <div className="w-7 h-7 bg-slate-700 text-white flex items-center justify-center rounded-sm shrink-0">
            <Hash className="w-4 h-4" />
          </div>
        );
      case 'geopoint':
        return (
          <div className="w-7 h-7 bg-emerald-700 text-white flex items-center justify-center rounded-sm shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
        );
      case 'image':
        return (
          <div className="w-7 h-7 bg-blue-700 text-white flex items-center justify-center rounded-sm shrink-0">
            <Camera className="w-4 h-4" />
          </div>
        );
      case 'audio':
        return (
          <div className="w-7 h-7 bg-amber-700 text-white flex items-center justify-center rounded-sm shrink-0">
            <Mic className="w-4 h-4" />
          </div>
        );
      case 'signature':
        return (
          <div className="w-7 h-7 bg-purple-700 text-white flex items-center justify-center rounded-sm shrink-0">
            <PenTool className="w-4 h-4" />
          </div>
        );
      case 'barcode':
        return (
          <div className="w-7 h-7 bg-slate-900 text-white flex items-center justify-center rounded-sm shrink-0">
            <QrCode className="w-4 h-4" />
          </div>
        );
      case 'date':
        return (
          <div className="w-7 h-7 bg-indigo-700 text-white flex items-center justify-center rounded-sm shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
        );
      case 'time':
        return (
          <div className="w-7 h-7 bg-cyan-700 text-white flex items-center justify-center rounded-sm shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'calculate':
        return (
          <div className="w-7 h-7 bg-amber-600 text-white flex items-center justify-center rounded-sm shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
        );
      case 'repeat_group':
        return (
          <div className="w-7 h-7 bg-red-800 text-white flex items-center justify-center rounded-sm shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 bg-slate-600 text-white flex items-center justify-center rounded-sm shrink-0">
            <Type className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f6f8] text-[#111111] font-sans select-none overflow-hidden">
      {/* Top Main Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-[#D71920]">Questionnaire:</span>
            <select
              value={activeForm.id}
              onChange={(e) => {
                const found = forms.find(f => f.id === e.target.value);
                if (found) {
                  setActiveForm(found);
                  setEditingFieldId(null);
                }
              }}
              className="px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-md bg-white focus:outline-none focus:border-[#D71920]"
            >
              {forms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.title} ({f.version}) - {f.status.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
            ID: {activeForm.id}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
            activeForm.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {activeForm.status.toUpperCase()}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {activeForm.fields.length} Variables
          </span>
        </div>

        {/* Right side: Form Designer Title & Design / Test Switch */}
        <div className="flex items-center gap-6">
          <span className="text-base font-black text-slate-900">CMRG Form Studio</span>

          {/* Design / Test Toggle Switch */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={mode === 'design' ? 'text-[#D71920] font-bold' : 'text-slate-400'}>
              Design
            </span>
            <button
              onClick={() => {
                const nextMode = mode === 'design' ? 'test' : 'design';
                setMode(nextMode);
                if (nextMode === 'test') {
                  onOpenMobile?.(activeForm.id);
                }
              }}
              className="w-11 h-6 bg-[#111111] rounded-full p-0.5 transition-colors relative flex items-center cursor-pointer"
            >
              <div className={`w-5 h-5 rounded-full bg-[#D71920] transition-transform ${mode === 'test' ? 'translate-x-5' : ''}`} />
            </button>
            <span className={mode === 'test' ? 'text-[#D71920] font-bold' : 'text-slate-400'}>
              Test Mobile
            </span>
          </div>
        </div>
      </header>

      {/* Action Toolbar */}
      <div className="bg-[#111111] text-white px-6 py-2.5 flex items-center justify-between text-xs font-semibold shadow-xs border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-6">
          {/* AI Questionnaire Builder Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Questionnaire Studio</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 hover:text-[#D71920] transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Schema</span>
          </button>

          {/* Version Publishing with Verification */}
          <button
            onClick={handleOpenPublishModal}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#D71920] hover:bg-[#b91c1c] text-white rounded font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Validate &amp; Publish Version</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 hover:text-[#D71920] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {noticeMessage && (
          <div className="text-xs bg-emerald-950 text-emerald-300 px-3 py-1 rounded border border-emerald-700 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{noticeMessage}</span>
          </div>
        )}
      </div>

      {/* Main Designer Canvas */}
      <main className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-4">
        {/* Questionnaire Header Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Study Title</label>
              <input
                type="text"
                value={activeForm.title}
                onChange={(e) => setActiveForm({ ...activeForm, title: e.target.value })}
                className="w-full text-base font-bold text-slate-900 border-b border-slate-200 focus:border-[#D71920] focus:outline-none pb-1"
              />
            </div>
            <div className="w-48">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Study Category</label>
              <input
                type="text"
                value={activeForm.category || 'Household'}
                onChange={(e) => setActiveForm({ ...activeForm, category: e.target.value })}
                className="w-full text-xs font-semibold text-slate-800 border-b border-slate-200 focus:border-[#D71920] focus:outline-none pb-1"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Study Abstract / Interviewer Instructions</label>
            <textarea
              rows={2}
              value={activeForm.description || ''}
              onChange={(e) => setActiveForm({ ...activeForm, description: e.target.value })}
              className="w-full text-xs text-slate-600 border border-slate-200 rounded-md p-2 focus:border-[#D71920] focus:outline-none"
            />
          </div>
        </div>

        {/* Variables List */}
        {activeForm.fields.map((field, index) => {
          const isEditing = editingFieldId === field.id;
          return (
            <div
              key={field.id}
              className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                isEditing ? 'border-[#D71920] ring-2 ring-[#D71920]/20' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  {getFieldIcon(field.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {field.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                          *Required
                        </span>
                      )}
                      {field.relevance && (
                        <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded">
                          Skip: {field.relevance}
                        </span>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-900">{field.label}</p>
                        {field.hint && (
                          <p className="text-[11px] text-slate-500 italic flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-slate-400" />
                            {field.hint}
                          </p>
                        )}
                        {field.options && field.options.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {field.options.map((opt, i) => (
                              <span key={i} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                                {opt.label} ({opt.value})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Full In-Place Question Editor */
                      <div className="space-y-3 pt-3 border-t border-slate-100 mt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Question Prompt Wording</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                              className="w-full text-xs p-2 border border-slate-300 rounded-md focus:border-[#D71920] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Variable Name (snake_case)</label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => handleUpdateField(index, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-md focus:border-[#D71920] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Question Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => handleUpdateField(index, { type: e.target.value as QuestionType })}
                              className="w-full text-xs p-2 border border-slate-300 rounded-md bg-white focus:border-[#D71920] focus:outline-none font-medium"
                            >
                              <option value="text">Text (Single-line)</option>
                              <option value="integer">Integer Number</option>
                              <option value="decimal">Decimal Number</option>
                              <option value="select_one">Single Choice (Radio)</option>
                              <option value="select_multiple">Multiple Choice (Checkboxes)</option>
                              <option value="note">Read-only Note / Instruction</option>
                              <option value="date">Date</option>
                              <option value="time">Time</option>
                              <option value="geopoint">GPS Geopoint</option>
                              <option value="image">Camera / Photo Attachment</option>
                              <option value="audio">Voice Audio Recording</option>
                              <option value="signature">Digital Touch Signature</option>
                              <option value="barcode">Barcode / QR Code</option>
                              <option value="calculate">Calculated Expression</option>
                              <option value="repeat_group">Repeat Group (Roster)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">Interviewer Hint</label>
                            <input
                              type="text"
                              value={field.hint || ''}
                              onChange={(e) => handleUpdateField(index, { hint: e.target.value })}
                              placeholder="e.g. Read prompt clearly to respondent"
                              className="w-full text-xs p-2 border border-slate-300 rounded-md focus:border-[#D71920] focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                              <input
                                type="checkbox"
                                checked={Boolean(field.required)}
                                onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                                className="w-4 h-4 text-red-600 rounded"
                              />
                              <span>Mandatory (Required)</span>
                            </label>
                          </div>
                        </div>

                        {/* Choice List Editor for select_one and select_multiple */}
                        {['select_one', 'select_multiple'].includes(field.type) && (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700">Answer Choices (Coded Values &amp; Labels)</span>
                              <button
                                type="button"
                                onClick={() => handleAddChoice(index)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Choice</span>
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              {(field.options || []).map((opt, cIdx) => (
                                <div key={cIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={opt.value}
                                    onChange={(e) => handleUpdateChoice(index, cIdx, { value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                                    placeholder="code_value"
                                    className="w-32 text-xs font-mono p-1.5 border border-slate-300 rounded bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) => handleUpdateChoice(index, cIdx, { label: e.target.value })}
                                    placeholder="Choice label visible to enumerator"
                                    className="flex-1 text-xs p-1.5 border border-slate-300 rounded bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChoice(index, cIdx)}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skip Logic / Relevance & Constraints */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                              Skip Logic (Relevance Expression)
                            </label>
                            <input
                              type="text"
                              value={field.relevance || ''}
                              onChange={(e) => handleUpdateField(index, { relevance: e.target.value })}
                              placeholder="e.g. water_source = 'other' or age >= 18"
                              className="w-full text-xs font-mono p-2 border border-slate-300 rounded-md focus:border-[#D71920] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                              Validation Constraint &amp; Error Message
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={field.constraint || ''}
                                onChange={(e) => handleUpdateField(index, { constraint: e.target.value })}
                                placeholder="e.g. . >= 0 and . <= 120"
                                className="w-1/2 text-xs font-mono p-2 border border-slate-300 rounded-md focus:border-[#D71920] focus:outline-none"
                              />
                              <input
                                type="text"
                                value={field.constraint_message || ''}
                                onChange={(e) => handleUpdateField(index, { constraint_message: e.target.value })}
                                placeholder="Error message"
                                className="w-1/2 text-xs p-2 border border-slate-300 rounded-md focus:border-[#D71920] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFieldId(null);
                              CMRGDataService.saveForm(activeForm);
                            }}
                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded cursor-pointer"
                          >
                            Save Question Edits
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Question Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingFieldId(isEditing ? null : field.id)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                    title={isEditing ? 'Close Editor' : 'Edit Question'}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicateField(field, index)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                    title="Duplicate Question"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Question Button */}
        <div className="pt-4 text-center">
          <button
            onClick={() => handleAddFieldAt(activeForm.fields.length, 'text')}
            className="px-5 py-2.5 rounded-lg bg-[#D71920] hover:bg-[#b91c1c] text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question to Questionnaire</span>
          </button>
        </div>
      </main>

      {/* ================= PUBLISH VERSION MODAL ================= */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-[#D71920]" />
              <div>
                <h3 className="text-base">Pre-Publication Validation &amp; Release</h3>
                <p className="text-xs text-slate-500 font-normal">
                  Publishing releases an immutable questionnaire version to field enumerators.
                </p>
              </div>
            </div>

            {/* Validation Feedback */}
            {validationErrors.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 space-y-1.5 text-xs text-rose-800">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Validation Blockers ({validationErrors.length})</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5 text-xs text-amber-800">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Methodology Warnings ({validationWarnings.length})</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  {validationWarnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationErrors.length === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>All {activeForm.fields.length} variables passed schema validation rules!</span>
              </div>
            )}

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Form Identifier (Stable Slug)</label>
                <input
                  type="text"
                  disabled
                  value={activeForm.id}
                  className="w-full p-2 bg-slate-100 border border-slate-300 rounded font-mono text-slate-600"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">New Semantic Version</label>
                <input
                  type="text"
                  value={publishVersion}
                  onChange={(e) => setPublishVersion(e.target.value)}
                  placeholder="e.g. 1.1.0"
                  className="w-full p-2 bg-white border border-slate-300 rounded font-mono focus:border-[#D71920] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isPublishing || validationErrors.length > 0}
                onClick={handlePublish}
                className="px-4 py-2 bg-[#D71920] hover:bg-[#b91c1c] disabled:opacity-50 text-white rounded text-xs font-bold cursor-pointer"
              >
                {isPublishing ? 'Publishing to Database...' : 'Confirm & Publish Live'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= AI QUESTIONNAIRE BUILDER MODAL ================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Sparkles className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-base">CMRG AI Questionnaire Studio</h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Transform research briefs into fully structured, editable field questionnaires
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Sample Briefs */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Load Standard CMRG Study Brief Template:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_RESEARCH_BRIEFS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setAiBrief(preset.prompt);
                      setAiCategory(preset.category);
                      setAiRespondents(preset.respondents);
                    }}
                    className="p-2 text-left bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg transition-colors text-xs"
                  >
                    <span className="font-bold text-slate-800 block truncate">{preset.title}</span>
                    <span className="text-[10px] text-slate-500">{preset.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Research Brief / Questionnaire Outline
                </label>
                <textarea
                  rows={4}
                  value={aiBrief}
                  onChange={(e) => setAiBrief(e.target.value)}
                  placeholder="Describe research objectives, target indicators, sections needed, and study methodology..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:border-[#D71920] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Study Category</label>
                  <input
                    type="text"
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Respondents</label>
                  <input
                    type="text"
                    value={aiRespondents}
                    onChange={(e) => setAiRespondents(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Language</label>
                  <select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="English">English</option>
                    <option value="Shona">Shona</option>
                    <option value="Ndebele">Ndebele</option>
                    <option value="Hausa">Hausa</option>
                    <option value="Yoruba">Yoruba</option>
                    <option value="Igbo">Igbo</option>
                    <option value="French">French</option>
                    <option value="Swahili">Swahili</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading / Progress */}
            {isGeneratingAi && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center space-y-2">
                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-red-700">{aiStepMessage}</p>
                <p className="text-[10px] text-slate-500">
                  Synthesizing complete instrument with variables, skip patterns, and validation rules.
                </p>
              </div>
            )}

            {/* Error Display */}
            {aiError && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">AI Studio Notice:</span>
                  <span>{aiError}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Generates real, editable schema matching CMRG Data Collect standards.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateAiQuestionnaire}
                  className="px-5 py-2 bg-[#D71920] hover:bg-[#b91c1c] text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Questionnaire</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
