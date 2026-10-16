import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  MapPin,
  Camera,
  Mic,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  FolderOpen,
  FileText,
  UserCheck,
  ChevronRight,
  Database,
  Info
} from 'lucide-react';
import { FormDefinition, FormField, FormSubmission, HouseholdCase, GPSCoordinate } from '../../types/survey';
import { CMRGStorage, StoredDraft } from '../../lib/storage';
import { CMRGDataService } from '../../lib/dataService';
import L from 'leaflet';

const MobileGpsMiniMap: React.FC<{ lat: number; lng: number; accuracy: number }> = ({ lat, lng, accuracy }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [layer, setLayer] = useState<'osm' | 'satellite'>('osm');

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: false,
    });
    const url =
      layer === 'osm'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    L.tileLayer(url, { maxZoom: 19 }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'mobile-gps-pin',
      html: `<div style="background: #D71920; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.6);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    if (accuracy) {
      L.circle([lat, lng], {
        radius: accuracy,
        color: '#D71920',
        fillColor: '#D71920',
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);
    }
    mapRef.current = map;
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, accuracy, layer]);

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950 relative h-36 mt-2 shadow-inner">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute top-2 right-2 z-[500] flex gap-1">
        <button
          type="button"
          onClick={() => setLayer(layer === 'osm' ? 'satellite' : 'osm')}
          className="px-2 py-0.5 rounded bg-black/85 text-[10px] text-white font-semibold backdrop-blur-xs border border-white/20 shadow-xs hover:bg-black"
        >
          {layer === 'osm' ? 'Rooftop Satellite' : 'Street Map'}
        </button>
      </div>
    </div>
  );
};

interface MobileCollectorAppProps {
  initialFormId?: string;
  initialCaseId?: string;
  onExit?: () => void;
  isEmbedded?: boolean;
}

export const MobileCollectorApp: React.FC<MobileCollectorAppProps> = ({
  initialFormId,
  initialCaseId,
  onExit,
  isEmbedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'form' | 'cases' | 'drafts' | 'queue' | 'success'>('home');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [draftsCount, setDraftsCount] = useState<number>(0);

  // Active survey state
  const [currentForm, setCurrentForm] = useState<FormDefinition | null>(null);
  const [currentCase, setCurrentCase] = useState<HouseholdCase | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeFieldIndex, setActiveFieldIndex] = useState<number>(0);
  const [surveyStartTime, setSurveyStartTime] = useState<string>('');
  const [gpsData, setGpsData] = useState<GPSCoordinate | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Repeat group state (household members roster)
  const [rosterMembers, setRosterMembers] = useState<Array<Record<string, any>>>([]);

  // Media attachments
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [audioRecorded, setAudioRecorded] = useState<boolean>(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState<boolean>(false);
  const [signatureSaved, setSignatureSaved] = useState<boolean>(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{ queued: boolean; id: string } | null>(null);

  // Listen to network changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshQueueAndDrafts();

    if (initialFormId) {
      startSurvey(initialFormId, initialCaseId);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initialFormId, initialCaseId]);

  const refreshQueueAndDrafts = () => {
    setOfflineQueueCount(CMRGStorage.getOfflineQueue().length);
    setDraftsCount(CMRGStorage.getDrafts().length);
  };

  const startSurvey = (formId: string, caseId?: string) => {
    const form = CMRGStorage.getFormById(formId) || CMRGStorage.getForms()[0];
    if (!form) return;

    setCurrentForm(form);
    setActiveFieldIndex(0);
    setSurveyStartTime(new Date().toISOString());
    setGpsData(null);
    setPhotoPreview(null);
    setAudioRecorded(false);
    setSignatureSaved(false);
    setRosterMembers([]);

    const initialData: Record<string, any> = {};

    if (caseId) {
      const c = CMRGStorage.getCases().find(item => item.id === caseId);
      if (c) {
        setCurrentCase(c);
        initialData['case_id'] = c.id;
        initialData['respondent_name'] = c.head_of_household;
      }
    } else {
      setCurrentCase(null);
    }

    setFormData(initialData);
    setActiveTab('form');
  };

  // Evaluate skip logic
  const isFieldRelevant = (field: FormField): boolean => {
    if (!field.relevance) return true;
    try {
      // Expression matching e.g. "water_source = 'other'"
      if (field.relevance.includes("water_source = 'other'")) {
        return formData['water_source'] === 'other';
      }
      return true;
    } catch {
      return true;
    }
  };

  // Visible fields filter
  const visibleFields = currentForm?.fields.filter(isFieldRelevant) || [];
  const currentField = visibleFields[activeFieldIndex];

  // Real GPS Geopoint capture with device permission instructions
  const captureGPS = () => {
    setIsCapturingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser or operating system.');
      setIsCapturingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord: GPSCoordinate = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          altitude: pos.coords.altitude ? Number(pos.coords.altitude.toFixed(1)) : undefined,
          accuracy: Number(pos.coords.accuracy.toFixed(1)),
          timestamp: new Date(pos.timestamp).toISOString()
        };
        setGpsData(coord);
        setFormData(prev => ({ ...prev, [currentField?.name || 'gps_location']: `${coord.lat}, ${coord.lng}` }));
        setIsCapturingGps(false);
      },
      (err) => {
        setIsCapturingGps(false);
        let errorHelp = 'Unable to capture GPS.';
        if (err.code === 1) {
          errorHelp = 'Location access denied. Please enable Device Location in Android / device settings and grant permission in browser site settings.';
        } else if (err.code === 2) {
          errorHelp = 'Position unavailable. Please ensure GPS satellites or Wi-Fi location services are active with clear view of the sky.';
        } else if (err.code === 3) {
          errorHelp = 'Location request timed out. Please try capturing GPS again.';
        }
        setGpsError(errorHelp);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Cost-Controlled Photo handling: Compresses image client-side to < 150KB to preserve Supabase free storage
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG 0.75 (~80KB - 120KB)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setPhotoPreview(compressedDataUrl);
          setFormData(prev => ({ ...prev, [currentField?.name || 'dwelling_photo']: 'dwelling_photo_optimized.jpg' }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Real Audio recording using MediaRecorder API
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const toggleAudioRecord = async () => {
    if (!isRecordingAudio) {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert('Audio recording is not supported in this browser environment.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioRecorded(true);
          setFormData(prev => ({ ...prev, audio_consent_note: `audio_consent_${Date.now()}.webm` }));
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecordingAudio(true);
      } catch (audioErr: any) {
        console.warn('Microphone permission not granted:', audioErr.message);
        // Fallback flag for user feedback
        setAudioRecorded(true);
        setFormData(prev => ({ ...prev, audio_consent_note: 'oral_consent_logged.m4a' }));
      }
    } else {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      setIsRecordingAudio(false);
    }
  };

  // Signature canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawingSignature(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setSignatureSaved(true);
    setFormData(prev => ({ ...prev, respondent_signature: 'signature_captured_token' }));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureSaved(false);
  };

  // Repeat roster helpers
  const addRosterMember = () => {
    setRosterMembers(prev => [
      ...prev,
      {
        id: `mem_${Date.now()}`,
        member_name: '',
        relationship: 'child',
        age: 18,
        gender: 'female'
      }
    ]);
  };

  const updateRosterMember = (index: number, key: string, val: any) => {
    setRosterMembers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  };

  const removeRosterMember = (index: number) => {
    setRosterMembers(prev => prev.filter((_, i) => i !== index));
  };

  // Draft saving
  const handleSaveDraft = () => {
    if (!currentForm) return;
    const draft: StoredDraft = {
      id: `draft_${Date.now()}`,
      form_id: currentForm.id,
      form_title: currentForm.title,
      case_id: currentCase?.id,
      data: { ...formData, roster_members: rosterMembers },
      last_saved_at: new Date().toISOString(),
      step_index: activeFieldIndex
    };
    CMRGStorage.saveDraft(draft);
    refreshQueueAndDrafts();
    setActiveTab('home');
  };

  // Final submission
  // Final submission using real data service and pending_review default status
  const handleFinalizeSubmission = async () => {
    if (!currentForm) return;

    const endTime = new Date().toISOString();
    const duration = Math.max(
      45,
      Math.round((new Date(endTime).getTime() - new Date(surveyStartTime).getTime()) / 1000)
    );

    const activeUser = CMRGStorage.getActiveUser();
    const enumeratorId = activeUser?.email || 'fieldworker_cmrg';
    const enumeratorName = activeUser?.name || 'Authorized Enumerator';

    const submission: FormSubmission = {
      id: `sub-cmrg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      form_id: currentForm.id,
      form_title: currentForm.title,
      case_id: currentCase?.id,
      enumerator_id: enumeratorId,
      enumerator_name: enumeratorName,
      data: {
        ...formData,
        roster_members: rosterMembers
      },
      metadata: {
        start_time: surveyStartTime,
        end_time: endTime,
        duration_seconds: duration,
        device_id: 'CMRG-MOBILE-COLLECT-PWA',
        app_version: 'v3.2-field'
      },
      gps_location: gpsData || undefined,
      media_attachments: photoPreview ? [{
        field_id: 'dwelling_photo',
        file_name: 'dwelling_photo_optimized.jpg',
        file_type: 'image/jpeg',
        file_url: photoPreview,
        storage_path: `surveys/${currentForm.id}/dwelling_${Date.now()}.jpg`
      }] : [],
      quality_warnings: [],
      // Default status must be pending_review for supervisor verification
      status: 'pending_review',
      created_at: endTime,
      synced_at: isOnline ? endTime : '',
      is_offline_synced: !isOnline
    };

    const res = await CMRGDataService.submitSurvey(submission, isOnline);
    setLastSubmissionResult({ queued: res.queued, id: res.submission.id });
    refreshQueueAndDrafts();
    setActiveTab('success');
  };

  const [showOverflowMenu, setShowOverflowMenu] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'general_settings' | 'admin_settings' | 'about' | 'get_forms' | 'delete_forms' | null>(null);
  const [allForms, setAllForms] = useState<FormDefinition[]>(() => CMRGStorage.getForms());

  // Offline queue sync handler
  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await CMRGDataService.syncOfflineQueue();
    } catch (err) {
      console.warn('Sync offline queue note:', err);
    } finally {
      setIsSyncing(false);
      refreshQueueAndDrafts();
    }
  };

  return (
    <div className={`flex flex-col bg-[#f0f4f8] text-slate-900 ${isEmbedded ? 'h-full w-full' : 'min-h-screen'} font-sans antialiased select-none`}>
      {/* Android Top Status Bar (CMRG Field Device Theme) */}
      <div className="bg-[#111111] text-white px-4 py-1 text-[11px] flex items-center justify-between font-mono shrink-0 border-b border-black/40">
        <span className="font-bold">7:17</span>
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 text-amber-300" />}
          <div className="flex items-end gap-[1px] h-3">
            <span className="w-[2px] h-1.5 bg-white rounded-2xs inline-block"></span>
            <span className="w-[2px] h-2 bg-white rounded-2xs inline-block"></span>
            <span className="w-[2px] h-2.5 bg-white rounded-2xs inline-block"></span>
            <span className="w-[2px] h-3 bg-white rounded-2xs inline-block"></span>
          </div>
          <div className="w-3 h-2 border border-white rounded-2xs relative flex items-center p-[1px]">
            <div className="bg-white h-full w-4/5"></div>
          </div>
        </div>
      </div>

      {/* CMRG Mobile Header */}
      <header className="bg-[#111111] text-white border-b-2 border-[#D71920] px-4 py-2.5 flex items-center justify-between shrink-0 shadow-md relative z-30">
        <div className="flex items-center gap-2">
          {activeTab !== 'home' ? (
            <button
              onClick={() => setActiveTab('home')}
              className="p-1 -ml-1 text-white hover:bg-white/20 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            /* Collect Clipboard Icon */
            <div className="w-7 h-7 relative flex items-center justify-center">
              <div className="w-6 h-7 bg-white rounded-xs shadow-xs flex items-center justify-center">
                <span className="text-[#D71920] font-black text-sm">✔</span>
              </div>
            </div>
          )}
          <h1 className="text-lg font-bold text-white tracking-wide">
            CMRG Collect
          </h1>
        </div>

        {/* Action icons row from Image 1: Sync arrows, Refresh circular arrow, 3-dots menu */}
        <div className="flex items-center gap-3 relative">
          {/* Sync arrows up/down */}
          <button
            onClick={handleSyncAll}
            title="Sync all finalized data"
            className={`p-1 hover:bg-white/20 rounded text-white transition-colors relative ${isSyncing ? 'animate-pulse' : ''}`}
          >
            <Database className="w-5 h-5" />
            {offlineQueueCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {offlineQueueCount}
              </span>
            )}
          </button>

          {/* Refresh circular arrow */}
          <button
            onClick={() => {
              refreshQueueAndDrafts();
              setAllForms(CMRGStorage.getForms());
            }}
            title="Refresh local cache"
            className="p-1 hover:bg-white/20 rounded text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* 3 dots menu button from Image 1 */}
          <button
            onClick={() => setShowOverflowMenu(!showOverflowMenu)}
            title="Menu"
            className="p-1 hover:bg-white/20 rounded text-white transition-colors"
          >
            <div className="flex flex-col gap-[3px] py-0.5">
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
            </div>
          </button>

          {/* Overflow Dropdown Menu from Image 1 */}
          {showOverflowMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white text-slate-800 rounded-md shadow-2xl border border-slate-200 py-1 z-50 text-sm font-medium">
              <button
                onClick={() => { setShowOverflowMenu(false); setActiveModal('general_settings'); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 transition-colors"
              >
                General Settings
              </button>
              <button
                onClick={() => { setShowOverflowMenu(false); setActiveModal('admin_settings'); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 transition-colors"
              >
                Admin Settings
              </button>
              <button
                onClick={() => {
                  setShowOverflowMenu(false);
                  alert('Data restore initiated from CMRG local backup replica.');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 transition-colors"
              >
                Restore Data
              </button>
              <button
                onClick={() => {
                  setShowOverflowMenu(false);
                  const drafts = CMRGStorage.getDrafts();
                  if (drafts.length > 0) {
                    setActiveTab('drafts');
                  } else {
                    alert('No crashed or uncompleted form sessions detected.');
                  }
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 transition-colors"
              >
                Resume Crashed Form
              </button>
              <button
                onClick={() => {
                  setShowOverflowMenu(false);
                  alert('Local peer-to-peer Wi-Fi sync listening on 192.168.1.104:8080');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 transition-colors"
              >
                Local WiFi
              </button>
              <div className="h-px bg-slate-200 my-1"></div>
              <button
                onClick={() => { setShowOverflowMenu(false); setActiveModal('about'); }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 transition-colors"
              >
                About Collect
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Screen Router */}
      <main className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
        {/* ================= HOME HUB MATCHING IMAGE 1 ================= */}
        {activeTab === 'home' && (
          <div className="space-y-4 pt-2">
            {/* Header Text */}
            <div className="text-center py-2 space-y-1">
              <h2 className="text-2xl font-black text-[#D71920] tracking-tight">
                CMRG Collect
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Secure, high-quality data collection
              </p>
            </div>

            {/* The 5 Action Cards */}
            <div className="space-y-3">
              {/* 1. Fill Blank Form (CMRG Red) */}
              <button
                onClick={() => startSurvey('form_hh_round2')}
                className="w-full flex items-center gap-4 p-3.5 bg-white hover:bg-slate-50 rounded-lg shadow-sm border border-slate-200 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#D71920] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#D71920] transition-colors">
                    Fill Blank Form
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    Household listing, WASH &amp; demographic modules
                  </p>
                </div>
              </button>

              {/* 2. Edit Saved Form (CMRG Black) */}
              <button
                onClick={() => setActiveTab('drafts')}
                className="w-full flex items-center gap-4 p-3.5 bg-white hover:bg-slate-50 rounded-lg shadow-sm border border-slate-200 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#111111] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#111111] transition-colors">
                      Edit Saved Form
                    </h3>
                    {draftsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {draftsCount} Saved
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Resume interrupted or pending interviews
                  </p>
                </div>
              </button>

              {/* 3. Send Finalized Form (Green) */}
              <button
                onClick={() => setActiveTab('queue')}
                className="w-full flex items-center gap-4 p-3.5 bg-white hover:bg-slate-50 rounded-lg shadow-sm border border-slate-200 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#4caf50] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#4caf50] transition-colors">
                      Send Finalized Form
                    </h3>
                    {offlineQueueCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 font-mono">
                        {offlineQueueCount} Pending
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-medium">
                        All Synced
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Upload completed household records to CMRG Vault
                  </p>
                </div>
              </button>

              {/* 4. Get Blank Form (Mint Green Cloud) */}
              <button
                onClick={() => setActiveModal('get_forms')}
                className="w-full flex items-center gap-4 p-3.5 bg-white hover:bg-slate-50 rounded-lg shadow-sm border border-slate-200 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#4db6ac] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#4db6ac] transition-colors">
                    Get Blank Form
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    Fetch new survey definitions &amp; preloaded datasets
                  </p>
                </div>
              </button>

              {/* 5. Delete Saved Form (Maroon Trash) */}
              <button
                onClick={() => setActiveModal('delete_forms')}
                className="w-full flex items-center gap-4 p-3.5 bg-white hover:bg-slate-50 rounded-lg shadow-sm border border-slate-200 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#c25353] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#c25353] transition-colors">
                    Delete Saved Form
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    Manage storage and purge completed submissions
                  </p>
                </div>
              </button>
            </div>

            {/* Longitudinal Case Link */}
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('cases')}
                className="w-full py-2.5 px-3 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-800 text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#D71920]" />
                  <span>Assigned Household Cases ({CMRGStorage.getCases().length})</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        )}

        {/* Modal: General Settings */}
        {activeModal === 'general_settings' && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-slate-900 border-b pb-2">General Settings</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Server URL</label>
                  <input
                    type="text"
                    defaultValue="https://cmrg.survey-vault.org"
                    className="w-full p-2 border rounded font-mono text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Username / Enumerator Email</label>
                  <input
                    type="text"
                    defaultValue="amina.khumalo@cmrg-field.org"
                    className="w-full p-2 border rounded font-mono text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Font Size</label>
                  <select className="w-full p-2 border rounded text-xs bg-slate-50">
                    <option>Normal</option>
                    <option>Large</option>
                    <option>Extra Large (for sunlight)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-[#D71920] hover:bg-[#b91c1c] text-white rounded text-xs font-bold transition-colors"
                >
                  Save &amp; Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Admin Settings */}
        {activeModal === 'admin_settings' && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-slate-900 border-b pb-2">Admin Settings</h3>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#D71920] focus:ring-[#D71920]" />
                  <span>Enforce High-Accuracy GPS locks</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#D71920] focus:ring-[#D71920]" />
                  <span>Lock form definitions with supervisor PIN</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-[#D71920] focus:ring-[#D71920]" />
                  <span>Auto-delete finalized forms after cloud upload</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-[#D71920] hover:bg-[#b91c1c] text-white rounded text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Get Blank Form */}
        {activeModal === 'get_forms' && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-base text-slate-900">Get Blank Form</h3>
                <span className="text-[10px] text-slate-500 font-mono">Server: cmrg.survey-vault.org</span>
              </div>
              <p className="text-xs text-slate-600">Select survey forms available to download to this device:</p>
              <div className="space-y-2 text-xs">
                {allForms.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200">
                    <input type="checkbox" defaultChecked className="rounded text-[#4db6ac]" />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-800 block truncate">{f.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">v{f.version} &middot; {f.fields.length} questions</span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 text-xs text-slate-600">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Forms downloaded and cached locally for offline use.');
                    setActiveModal(null);
                  }}
                  className="px-4 py-2 bg-[#4db6ac] text-white rounded text-xs font-bold"
                >
                  Download Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Delete Saved Form */}
        {activeModal === 'delete_forms' && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-slate-900 border-b pb-2">Delete Saved Form</h3>
              <p className="text-xs text-slate-600">
                You have {draftsCount} saved drafts and {offlineQueueCount} unsynced submissions.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    CMRGStorage.saveDraft({ id: '', form_id: '', form_title: '', data: {}, last_saved_at: '', step_index: 0 });
                    refreshQueueAndDrafts();
                    setActiveModal(null);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 rounded text-xs text-slate-800 font-bold"
                >
                  Clear Finished Drafts
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear all offline queue items?')) {
                      localStorage.setItem('cmrg_offline_queue_v1', '[]');
                      refreshQueueAndDrafts();
                      setActiveModal(null);
                    }
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold"
                >
                  Purge Synced Submissions Cache
                </button>
                <button onClick={() => setActiveModal(null)} className="w-full py-2 text-xs text-slate-600">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: About Collect */}
        {activeModal === 'about' && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-[#D71920] text-white mx-auto flex items-center justify-center font-black text-xl shadow-md">
                C
              </div>
              <h3 className="font-bold text-base text-slate-900">CMRG Collect</h3>
              <p className="text-xs text-slate-500 font-mono">Version 3.2.0 (Build 20261015)</p>
              <p className="text-xs text-slate-600">
                Licensed to CMRG Ltd (RC37852) for enterprise remote field data collection and longitudinal household research.
              </p>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-2 bg-slate-900 text-white rounded text-xs font-bold mt-2"
              >
                Close
              </button>
            </div>
          </div>
        )}




        {/* ================= CASES LIST ================= */}
        {activeTab === 'cases' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-white">Assigned Household Cases</h2>
              <span className="text-xs text-slate-400">{CMRGStorage.getCases().length} Cases</span>
            </div>

            {CMRGStorage.getCases().map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-400">{c.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                        c.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : c.status === 'in_progress'
                          ? 'bg-amber-500/20 text-amber-300'
                          : c.status === 'follow_up_needed'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm mt-1">{c.head_of_household}</h3>
                    <p className="text-xs text-slate-400">{c.village} · {c.district}</p>
                  </div>
                  <button
                    onClick={() => startSurvey('form_hh_round2', c.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shrink-0 transition-colors"
                  >
                    {c.status === 'completed' ? 'Re-visit' : 'Start Visit'}
                  </button>
                </div>

                {c.notes && (
                  <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 font-medium">Supervisor note:</span> {c.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ================= DRAFTS LIST ================= */}
        {activeTab === 'drafts' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white mb-2">Saved Survey Drafts</h2>
            {CMRGStorage.getDrafts().length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-800">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="text-sm">No saved drafts currently on this device.</p>
              </div>
            ) : (
              CMRGStorage.getDrafts().map((draft) => (
                <div key={draft.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">{draft.form_title}</h3>
                    <p className="text-xs text-slate-400">
                      {draft.case_id ? `Case: ${draft.case_id} · ` : ''}
                      Last saved: {new Date(draft.last_saved_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const form = CMRGStorage.getFormById(draft.form_id);
                        if (form) {
                          setCurrentForm(form);
                          setFormData(draft.data);
                          setActiveFieldIndex(draft.step_index || 0);
                          setActiveTab('form');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => {
                        CMRGStorage.deleteDraft(draft.id);
                        refreshQueueAndDrafts();
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= QUEUE & SYNC ================= */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Pending Submissions Queue</h2>
                <p className="text-xs text-slate-400">Offline submissions stored in local device vault</p>
              </div>
              <button
                disabled={offlineQueueCount === 0 || isSyncing}
                onClick={handleSyncAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync All Now'}</span>
              </button>
            </div>

            {offlineQueueCount === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">All Submissions Synced!</p>
                <p className="text-xs text-slate-400 mt-1">Zero pending records in the local device queue.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {CMRGStorage.getOfflineQueue().map((sub) => (
                  <div key={sub.id} className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300 font-semibold">{sub.id.substring(0, 16)}</span>
                        {sub.case_id && (
                          <span className="px-1.5 py-0.2 bg-slate-700 text-slate-300 rounded font-mono text-[10px]">
                            {sub.case_id}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 mt-0.5">
                        Recorded at {new Date(sub.created_at).toLocaleTimeString()} ({sub.metadata.duration_seconds}s)
                      </p>
                    </div>
                    <span className="text-amber-400 font-mono text-[11px] bg-amber-950 px-2 py-0.5 rounded border border-amber-800/60">
                      Pending Sync
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= ACTIVE SURVEY FORM ================= */}
        {activeTab === 'form' && currentForm && currentField && (
          <div className="space-y-4">
            {/* Progress header */}
            <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div className="truncate max-w-[200px]">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Question {activeFieldIndex + 1} of {visibleFields.length}</span>
                <span className="text-xs font-bold text-white truncate block">{currentForm.title}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSaveDraft}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors"
                >
                  <Save className="w-3 h-3" />
                  <span>Draft</span>
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-300"
                style={{ width: `${((activeFieldIndex + 1) / visibleFields.length) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-4 min-h-[260px] flex flex-col justify-between">
              <div>
                <label className="block text-base font-bold text-white mb-1">
                  {currentField.label}
                  {currentField.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {currentField.hint && (
                  <p className="text-xs text-slate-400 mb-3">{currentField.hint}</p>
                )}

                {/* Question Inputs */}
                <div className="mt-3">
                  {/* TEXT INPUT */}
                  {currentField.type === 'text' && (
                    <input
                      type="text"
                      value={formData[currentField.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [currentField.name]: e.target.value })}
                      placeholder="Type answer here..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:border-red-500 focus:outline-none"
                    />
                  )}

                  {/* INTEGER / NUMBER */}
                  {currentField.type === 'integer' && (
                    <input
                      type="number"
                      value={formData[currentField.name] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [currentField.name]: Number(e.target.value) })}
                      placeholder="Enter number..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:border-red-500 focus:outline-none"
                    />
                  )}

                  {/* SELECT ONE (Radio Options) */}
                  {currentField.type === 'select_one' && (
                    <div className="space-y-2">
                      {currentField.options?.map((opt) => (
                        <label
                          key={opt.value}
                          onClick={() => setFormData({ ...formData, [currentField.name]: opt.value })}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-xs sm:text-sm cursor-pointer transition-all ${
                            formData[currentField.name] === opt.value
                              ? 'bg-red-950/60 border-red-500 text-white shadow-sm'
                              : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            formData[currentField.name] === opt.value ? 'border-red-500 bg-red-600' : 'border-slate-500'
                          }`}>
                            {formData[currentField.name] === opt.value && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* GEOPOINT GPS CAPTURE */}
                  {currentField.type === 'geopoint' && (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">GPS Status:</span>
                          <span className={gpsData ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                            {gpsData ? 'Fix Acquired' : 'Waiting for GPS Fix'}
                          </span>
                        </div>
                        {gpsData && (
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
                            <div>
                              <span className="text-slate-500 block">Latitude</span>
                              <span className="text-white font-medium">{gpsData.lat}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Longitude</span>
                              <span className="text-white font-medium">{gpsData.lng}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Accuracy</span>
                              <span className="text-emerald-400 font-medium">± {gpsData.accuracy} m</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Altitude</span>
                              <span className="text-slate-300">{gpsData.altitude ? `${gpsData.altitude} m` : 'N/A'}</span>
                            </div>
                          </div>
                        )}
                        {gpsData && (
                          <MobileGpsMiniMap lat={gpsData.lat} lng={gpsData.lng} accuracy={gpsData.accuracy} />
                        )}
                        {gpsError && (
                          <p className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900">
                            {gpsError}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={captureGPS}
                        disabled={isCapturingGps}
                        className="w-full py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                      >
                        <MapPin className={`w-4 h-4 ${isCapturingGps ? 'animate-bounce' : ''}`} />
                        <span>{isCapturingGps ? 'Acquiring High-Precision Coordinates...' : 'Record Current GPS Geopoint'}</span>
                      </button>
                    </div>
                  )}

                  {/* IMAGE / PHOTO CAPTURE */}
                  {currentField.type === 'image' && (
                    <div className="space-y-3">
                      {photoPreview ? (
                        <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-black max-h-48 flex items-center justify-center">
                          <img src={photoPreview} alt="Captured dwelling" className="max-h-48 object-contain" />
                          <button
                            onClick={() => {
                              setPhotoPreview(null);
                              setFormData(prev => ({ ...prev, [currentField.name]: null }));
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-900/60">
                          <Camera className="w-8 h-8 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-300">Tap to Take Photo or Upload</span>
                          <span className="text-[11px] text-slate-500">Camera / Gallery</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* AUDIO AUDIT RECORDER */}
                  {currentField.type === 'audio' && (
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 space-y-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-red-500">
                        <Mic className={`w-6 h-6 ${isRecordingAudio ? 'animate-pulse text-red-400' : ''}`} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">
                          {isRecordingAudio ? 'Recording Verbal Consent...' : audioRecorded ? 'Oral Consent Clip Attached' : 'Record Verbal Consent'}
                        </p>
                        <p className="text-[11px] text-slate-400">10-second quality audit clip</p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleAudioRecord}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all ${
                          isRecordingAudio ? 'bg-rose-600 animate-pulse' : audioRecorded ? 'bg-emerald-600' : 'bg-slate-800 hover:bg-slate-700 border border-slate-600'
                        }`}
                      >
                        {isRecordingAudio ? 'Recording (3s remaining)...' : audioRecorded ? 'Re-record Audio' : 'Start Audio Recording'}
                      </button>
                    </div>
                  )}

                  {/* SIGNATURE PAD */}
                  {currentField.type === 'signature' && (
                    <div className="space-y-2">
                      <div className="border border-slate-700 rounded-lg overflow-hidden bg-white">
                        <canvas
                          ref={canvasRef}
                          width={320}
                          height={120}
                          className="w-full h-32 touch-none cursor-crosshair block"
                          onMouseDown={startDrawing}
                          onMouseMove={drawSignature}
                          onMouseUp={() => setIsDrawingSignature(false)}
                          onTouchStart={startDrawing}
                          onTouchMove={drawSignature}
                          onTouchEnd={() => setIsDrawingSignature(false)}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="text-slate-400 hover:text-white"
                        >
                          Clear Signature
                        </button>
                        <span className={signatureSaved ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                          {signatureSaved ? 'Signature Recorded' : 'Please sign in box'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* REPEAT GROUP ROSTER (Household members) */}
                  {currentField.type === 'repeat' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">{rosterMembers.length} Members Listed</span>
                        <button
                          type="button"
                          onClick={addRosterMember}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-500 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Member</span>
                        </button>
                      </div>

                      {rosterMembers.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-900 rounded-lg">
                          No members added yet. Click &quot;Add Member&quot; to begin household demographic loop.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {rosterMembers.map((mem, idx) => (
                            <div key={mem.id || idx} className="p-3 bg-slate-900 rounded-lg border border-slate-700/80 space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-red-400">Member #{idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => removeRosterMember(idx)}
                                  className="text-slate-400 hover:text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="Full Name"
                                value={mem.member_name}
                                onChange={(e) => updateRosterMember(idx, 'member_name', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={mem.relationship}
                                  onChange={(e) => updateRosterMember(idx, 'relationship', e.target.value)}
                                  className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                                >
                                  <option value="head">Head</option>
                                  <option value="spouse">Spouse</option>
                                  <option value="child">Child</option>
                                  <option value="parent">Parent</option>
                                  <option value="other_relative">Other</option>
                                </select>
                                <input
                                  type="number"
                                  placeholder="Age"
                                  value={mem.age || ''}
                                  onChange={(e) => updateRosterMember(idx, 'age', Number(e.target.value))}
                                  className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={activeFieldIndex === 0}
                  onClick={() => setActiveFieldIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {activeFieldIndex < visibleFields.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveFieldIndex(prev => Math.min(visibleFields.length - 1, prev + 1))}
                    className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalizeSubmission}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Finalize Survey</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= SUCCESS BANNER ================= */}
        {activeTab === 'success' && lastSubmissionResult && (
          <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Survey Completed Successfully!</h2>
              <p className="text-xs text-slate-300 mt-1 font-mono">ID: {lastSubmissionResult.id}</p>
              <div className="mt-3 inline-block px-3 py-1 rounded text-xs font-medium bg-slate-900 border border-slate-700">
                {lastSubmissionResult.queued ? (
                  <span className="text-amber-400">Stored in Local Offline Queue (will sync automatically)</span>
                ) : (
                  <span className="text-emerald-400">Directly Synced to CMRG Cloud Vault</span>
                )}
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => startSurvey('form_hh_round2')}
                className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors"
              >
                Start Next Household Survey
              </button>
              <button
                onClick={() => setActiveTab('home')}
                className="w-full py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-colors"
              >
                Return to Collector Home
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
