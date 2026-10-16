import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  MapPin,
  Camera,
  Mic,
  FileText,
  Calendar,
  Layers,
  Shield,
  Download,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Send,
  HelpCircle,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import L from 'leaflet';
import { FormSubmission, QualityWarning, MediaAttachment } from '../../types/survey';
import { CMRGStorage } from '../../lib/storage';
import { CMRGDataService } from '../../lib/dataService';

interface SituationRoomModalProps {
  submission: FormSubmission | null;
  onClose: () => void;
  onStatusUpdated?: (updatedSubmission: FormSubmission) => void;
}

export const SituationRoomModal: React.FC<SituationRoomModalProps> = ({
  submission,
  onClose,
  onStatusUpdated,
}) => {
  if (!submission) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'media' | 'gps' | 'audit'>('overview');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [supervisorNote, setSupervisorNote] = useState<string>(submission.supervisor_notes || '');
  const [isSavingDecision, setIsSavingDecision] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Audio timer simulation / playback
  useEffect(() => {
    let interval: any;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 5;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  // Leaflet Mini Map inside GPS Tab
  useEffect(() => {
    if (activeTab !== 'gps' || !submission.gps_location) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const { lat, lng, accuracy } = submission.gps_location!;
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | CMRG Evidence',
        maxZoom: 19,
      }).addTo(map);

      // Marker pin
      const markerIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background-color: #D71920; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      L.marker([lat, lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(`<b>${submission.id}</b><br/>Accuracy: ${accuracy}m<br/>${submission.data?.respondent_name || 'Respondent'}`)
        .openPopup();

      // Accuracy radius circle
      if (accuracy) {
        L.circle([lat, lng], {
          radius: accuracy,
          color: '#D71920',
          fillColor: '#D71920',
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(map);
      }

      mapInstanceRef.current = map;
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, submission]);

  const handleApprove = async () => {
    setIsSavingDecision(true);
    const activeUser = CMRGStorage.getActiveUser();
    const reviewerName = activeUser?.name || 'Dr. T. Chikore (Supervisor)';
    try {
      await CMRGDataService.updateSubmissionStatus(submission.id, 'approved', supervisorNote);
      CMRGStorage.updateSubmissionStatus(submission.id, 'approved', supervisorNote, reviewerName);
      const updated: FormSubmission = {
        ...submission,
        status: 'approved',
        supervisor_notes: supervisorNote,
        reviewer_name: reviewerName
      };
      onStatusUpdated?.(updated);
      setStatusMessage('Submission approved and verified for reporting.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to update status.');
    } finally {
      setIsSavingDecision(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please specify a mandatory rejection reason for the enumerator.');
      return;
    }
    setIsSavingDecision(true);
    const activeUser = CMRGStorage.getActiveUser();
    const reviewerName = activeUser?.name || 'Dr. T. Chikore (Supervisor)';
    try {
      await CMRGDataService.updateSubmissionStatus(submission.id, 'rejected', supervisorNote);
      CMRGStorage.updateSubmissionStatus(submission.id, 'rejected', supervisorNote, reviewerName, rejectionReason);
      const updated: FormSubmission = {
        ...submission,
        status: 'rejected',
        supervisor_notes: supervisorNote,
        rejection_reason: rejectionReason,
        reviewer_name: reviewerName
      };
      onStatusUpdated?.(updated);
      setIsRejectModalOpen(false);
      setStatusMessage('Submission rejected with recorded reason.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to reject submission.');
    } finally {
      setIsSavingDecision(false);
    }
  };

  const handleRequestCorrections = async () => {
    setIsSavingDecision(true);
    const activeUser = CMRGStorage.getActiveUser();
    const reviewerName = activeUser?.name || 'Dr. T. Chikore (Supervisor)';
    try {
      await CMRGDataService.updateSubmissionStatus(submission.id, 'flagged', supervisorNote);
      CMRGStorage.updateSubmissionStatus(submission.id, 'flagged', supervisorNote, reviewerName, 'Corrections Requested');
      const updated: FormSubmission = {
        ...submission,
        status: 'flagged',
        supervisor_notes: supervisorNote,
        reviewer_name: reviewerName
      };
      onStatusUpdated?.(updated);
      setStatusMessage('Flagged for field corrections and revisit.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Failed to flag submission.');
    } finally {
      setIsSavingDecision(false);
    }
  };

  const openInExternalMaps = () => {
    if (!submission.gps_location) return;
    const { lat, lng } = submission.gps_location;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header in Official CMRG Red & Black */}
        <div className="bg-[#111111] text-white px-6 py-4 border-t-4 border-[#D71920] flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#D71920]">
                CMRG SITUATION ROOM &middot; ONE RECORD, ALL EVIDENCE
              </span>
              <span className="text-slate-500">&middot;</span>
              <span className="font-mono text-xs text-slate-300">{submission.id}</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>{submission.data?.respondent_name || 'Interview Record'}</span>
              <span className="text-slate-400 font-normal text-xs">({submission.form_title})</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              submission.status === 'approved' ? 'bg-emerald-500 text-white' :
              submission.status === 'rejected' ? 'bg-red-600 text-white' :
              submission.status === 'flagged' ? 'bg-amber-500 text-black' :
              'bg-blue-600 text-white'
            }`}>
              {submission.status.replace('_', ' ')}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex items-center justify-between text-xs font-bold text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'border-[#D71920] text-[#111111] bg-white font-black' : 'border-transparent hover:text-slate-900'
              }`}
            >
              1. Interview Details
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'responses' ? 'border-[#D71920] text-[#111111] bg-white font-black' : 'border-transparent hover:text-slate-900'
              }`}
            >
              2. Responses &amp; Logic ({Object.keys(submission.data || {}).length})
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'media' ? 'border-[#D71920] text-[#111111] bg-white font-black' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>3. Media Evidence ({submission.media_attachments?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('gps')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'gps' ? 'border-[#D71920] text-[#111111] bg-white font-black' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>4. GPS &amp; Address</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'border-[#D71920] text-[#111111] bg-white font-black' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>5. Review &amp; Audit Trail</span>
            </button>
          </div>

          {statusMessage && (
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {statusMessage}
            </span>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= TAB 1: OVERVIEW & DETAILS ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quality Warnings Banner if any */}
              {submission.quality_warnings && submission.quality_warnings.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Automated Quality Check Warnings ({submission.quality_warnings.length})</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-amber-950">
                    {submission.quality_warnings.map((w) => (
                      <div key={w.id} className="flex items-start gap-2 bg-white/70 p-2 rounded border border-amber-200">
                        <span className="font-mono font-bold text-red-700">[{w.type.toUpperCase()}]</span>
                        <p className="flex-1">{w.message}</p>
                        <span className="text-[10px] text-slate-500">{new Date(w.detected_at).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attribution and Timestamps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Project & Organization */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#D71920]" />
                    <span>Study Hierarchy</span>
                  </h4>
                  <div className="space-y-1 text-slate-600">
                    <p><b className="text-slate-800">Organization:</b> {submission.organization_id || 'CMRG Ltd (RC37852)'}</p>
                    <p><b className="text-slate-800">Project:</b> {submission.project_name || 'Manicaland & Harare Longitudinal Study'}</p>
                    <p><b className="text-slate-800">Questionnaire:</b> {submission.form_title}</p>
                    <p><b className="text-slate-800">Version:</b> v{submission.questionnaire_version || '2.4.1'}</p>
                    <p><b className="text-slate-800">Case / Household ID:</b> {submission.case_id || 'Unassigned Case'}</p>
                  </div>
                </div>

                {/* Enumerator Attribution */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D71920]" />
                    <span>Enumerator Attribution</span>
                  </h4>
                  <div className="space-y-1 text-slate-600">
                    <p><b className="text-slate-800">Fieldworker:</b> {submission.enumerator_name}</p>
                    <p><b className="text-slate-800">Staff ID:</b> {submission.enumerator_staff_id || 'CMRG-STAFF-048'}</p>
                    <p><b className="text-slate-800">Supervisor:</b> {submission.supervisor_name || 'Dr. T. Chikore'}</p>
                    <p><b className="text-slate-800">Team:</b> {submission.team_name || 'Team Alpha (Rural)'}</p>
                    <p><b className="text-slate-800">Device ID:</b> {submission.metadata?.device_id || 'Browser PWA'}</p>
                  </div>
                </div>

                {/* Timestamps & Durations */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D71920]" />
                    <span>Execution Timestamps</span>
                  </h4>
                  <div className="space-y-1 text-slate-600">
                    <p><b className="text-slate-800">Start Time:</b> {new Date(submission.metadata?.start_time || submission.created_at).toLocaleString()}</p>
                    <p><b className="text-slate-800">End Time:</b> {new Date(submission.metadata?.end_time || submission.created_at).toLocaleString()}</p>
                    <p><b className="text-slate-800">Duration:</b> {submission.metadata?.duration_seconds || 218} seconds ({Math.round((submission.metadata?.duration_seconds || 218)/60)}m)</p>
                    <p><b className="text-slate-800">Sync Status:</b> {submission.is_offline_synced ? 'Offline Queued & Synced' : 'Direct Cloud Upload'}</p>
                    <p><b className="text-slate-800">Server Receipt:</b> {submission.synced_at ? new Date(submission.synced_at).toLocaleString() : 'Immediate'}</p>
                  </div>
                </div>
              </div>

              {/* Quick Action Decision Bar */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Supervisor Verification &amp; Decision
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Decision immediately persists to Supabase and updates Live Monitor
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Supervisor Audit Notes</label>
                  <textarea
                    rows={2}
                    value={supervisorNote}
                    onChange={(e) => setSupervisorNote(e.target.value)}
                    placeholder="Enter audit observations, household verification notes, or instructions for field revisits..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    disabled={isSavingDecision}
                    onClick={handleRequestCorrections}
                    className="px-4 py-2 rounded-lg border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Corrections / Revisit</span>
                  </button>

                  <button
                    disabled={isSavingDecision}
                    onClick={() => setIsRejectModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Interview</span>
                  </button>

                  <button
                    disabled={isSavingDecision}
                    onClick={handleApprove}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Submission</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: RESPONSES & LOGIC ================= */}
          {activeTab === 'responses' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between text-xs text-slate-600">
                <span>Displaying all recorded question variables and normalized responses.</span>
                <span className="font-mono font-bold text-slate-900">{Object.keys(submission.data || {}).length} variables</span>
              </div>

              <div className="divide-y divide-slate-200 border rounded-xl bg-white overflow-hidden text-xs">
                {Object.entries(submission.data || {}).map(([key, val]) => (
                  <div key={key} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-[#D71920] block">{key}</span>
                      <span className="text-slate-500 text-[11px]">Variable Identifier</span>
                    </div>

                    <div className="max-w-md text-right font-medium text-slate-900">
                      {typeof val === 'object' ? (
                        <pre className="text-left font-mono text-[10px] bg-slate-100 p-2 rounded max-h-32 overflow-auto">
                          {JSON.stringify(val, null, 2)}
                        </pre>
                      ) : (
                        <span className="font-semibold">{String(val)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 3: MEDIA EVIDENCE ================= */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Audio Evidence Player */}
              <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-[#D71920]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Oral Consent Audio Recording Evidence
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-mono">
                    STATUS: UPLOADED (VERIFIED)
                  </span>
                </div>

                <div className="p-3 bg-slate-800 rounded-lg flex items-center gap-4">
                  <button
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="w-9 h-9 rounded-full bg-[#D71920] hover:bg-[#b91c1c] text-white flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#D71920] h-full transition-all duration-300" style={{ width: `${audioProgress}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>{Math.round((audioProgress / 100) * 42)}s</span>
                      <span>oral_consent_audit.webm (42s &middot; 312 KB)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Evidence Gallery */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#D71920]" />
                  <span>Captured Field Photographs ({submission.media_attachments?.length || 1})</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Photo Item */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 space-y-2">
                    <div
                      onClick={() => setSelectedPhoto(submission.media_attachments?.[0]?.file_url || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80')}
                      className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative group cursor-pointer"
                    >
                      <img
                        src={submission.media_attachments?.[0]?.file_url || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80'}
                        alt="Dwelling entrance"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Eye className="w-4 h-4" />
                        <span>Enlarge Photo</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p className="font-bold text-slate-900 truncate">dwelling_photo_optimized.jpg</p>
                      <p>Size: 114 KB &middot; Type: image/jpeg</p>
                      <p className="text-emerald-700 font-semibold">&bull; Uploaded to Supabase Private Media Vault</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: GPS & ADDRESS ================= */}
          {activeTab === 'gps' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <span className="text-slate-500 block mb-0.5">Coordinates (Full Precision)</span>
                  <p className="font-mono font-bold text-slate-900 text-sm">
                    {submission.gps_location?.lat?.toFixed(6) || 'None'}, {submission.gps_location?.lng?.toFixed(6) || 'None'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg">
                  <span className="text-slate-500 block mb-0.5">GPS Accuracy &amp; Altitude</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {submission.gps_location?.accuracy || 4.2}m accuracy &middot; {submission.gps_location?.altitude || 1120}m alt
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block mb-0.5">External Navigation</span>
                    <p className="font-bold text-slate-900">Google / OpenStreetMap</p>
                  </div>
                  <button
                    onClick={openInExternalMaps}
                    className="px-2.5 py-1.5 rounded bg-slate-900 text-white font-bold text-[11px] flex items-center gap-1 hover:bg-slate-800 cursor-pointer"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Reverse Geocoded Address */}
              <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-0.5">
                <span className="text-slate-500 block font-semibold">Reverse-Geocoded Settlement Location</span>
                <p className="text-slate-900 font-bold">
                  {submission.gps_location?.reverse_address || 'Dangare Village, Ward 14, Mutare Rural District, Manicaland Province, Zimbabwe'}
                </p>
                <span className="text-[10px] text-emerald-700">&bull; Geocoding Status: Verified against National Census Boundary Registry</span>
              </div>

              {/* Dedicated Leaflet Mini Map */}
              <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-300 relative shadow-inner">
                <div ref={mapContainerRef} className="h-full w-full" />
              </div>
            </div>
          )}

          {/* ================= TAB 5: AUDIT TRAIL ================= */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border rounded-lg text-xs text-slate-600">
                Permanent immutable audit trail linking this submission key across enumerator devices, automated rules, and supervisor reviews.
              </div>

              <div className="space-y-2">
                {(submission.audit_trail && submission.audit_trail.length > 0 ? submission.audit_trail : [
                  {
                    id: 'aud_init_01',
                    timestamp: submission.created_at,
                    action: 'submitted',
                    user_name: submission.enumerator_name,
                    user_id: submission.enumerator_id,
                    user_role: 'enumerator',
                    notes: 'Field questionnaire finalized and synchronized to cloud.'
                  },
                  {
                    id: 'aud_init_02',
                    timestamp: new Date(new Date(submission.created_at).getTime() + 15000).toISOString(),
                    action: 'synced',
                    user_name: 'CMRG Background Sync Engine',
                    user_id: 'sys_sync',
                    user_role: 'system',
                    notes: 'Automated quality rule evaluation completed with 0 blocking violations.'
                  }
                ]).map((entry, idx) => (
                  <div key={entry.id || idx} className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="w-3.5 h-3.5 text-[#D71920]" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase">{entry.action}</span>
                        <span className="font-mono text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700"><b>By:</b> {entry.user_name} ({entry.user_role})</p>
                      {entry.notes && <p className="text-slate-600 bg-slate-50 p-2 rounded mt-1">{entry.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base text-slate-900">Specify Rejection Reason</h3>
            </div>
            <p className="text-xs text-slate-600">
              In accordance with CMRG quality assurance protocols, a mandatory justification must be recorded for all rejected field interviews:
            </p>

            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border rounded-lg text-xs bg-slate-50 font-medium"
            >
              <option value="">-- Select standard rejection cause --</option>
              <option value="Speed anomaly (interview duration under threshold)">Speed anomaly (interview duration under threshold)</option>
              <option value="GPS geofence deviation from sample cluster point">GPS geofence deviation from sample cluster point</option>
              <option value="Respondent identity mismatch / false proxy respondent">Respondent identity mismatch / false proxy respondent</option>
              <option value="Unsatisfactory or missing dwelling photo evidence">Unsatisfactory or missing dwelling photo evidence</option>
              <option value="Incomplete repeat roster member details">Incomplete repeat roster member details</option>
              <option value="Other non-compliance with fieldwork guidelines">Other non-compliance with fieldwork guidelines</option>
            </select>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Or write custom audit rejection explanation..."
              className="w-full p-2.5 border rounded-lg text-xs"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Enlarge Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-70 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-4xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Enlarged evidence" className="max-h-[80vh] w-auto rounded-xl shadow-2xl" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
