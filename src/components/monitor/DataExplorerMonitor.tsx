import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Layers,
  MapPin,
  PieChart as PieIcon,
  BarChart3,
  Filter,
  Eye,
  Check,
  X,
  RefreshCw,
  HelpCircle,
  Sliders,
  Shield,
  Camera,
  Mic,
  PenTool,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Table,
  Map as MapIcon,
  Activity,
  AlertCircle
} from 'lucide-react';
import { FormSubmission, QualityWarning } from '../../types/survey';
import { CMRGStorage } from '../../lib/storage';
import { CMRGDataService } from '../../lib/dataService';
import { LeafletSubmissionsMap } from './LeafletSubmissionsMap';
import { SituationRoomModal } from './SituationRoomModal';

interface DataExplorerMonitorProps {
  onOpenMobile?: () => void;
}

export const DataExplorerMonitor: React.FC<DataExplorerMonitorProps> = ({ onOpenMobile }) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>(() => CMRGStorage.getSubmissions('form_hh_round2'));
  const [monitorTab, setMonitorTab] = useState<'table' | 'map' | 'stats' | 'quality'>('table');
  const [selectedField, setSelectedField] = useState<string>('num_in_hh');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [filterWarningOnly, setFilterWarningOnly] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'approved' | 'flagged' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'created_at' | 'duration' | 'respondent' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const unsubscribe = CMRGDataService.subscribeSubmissions((subs) => {
      setSubmissions(subs);
    }, 'form_hh_round2');
    return () => unsubscribe();
  }, []);

  const refreshData = () => {
    const fresh = CMRGStorage.getSubmissions('form_hh_round2');
    setSubmissions(fresh);
    showToast('Submissions refreshed from live database vault.');
  };

  const totalSubmissions = submissions.length;
  const totalFields = 17;

  const totalDurationSec = useMemo(() => {
    return submissions.reduce((acc, s) => acc + (s.metadata?.duration_seconds || 218), 0);
  }, [submissions]);

  const avgDurationSec = useMemo(() => {
    return Math.round(totalDurationSec / Math.max(1, totalSubmissions));
  }, [totalDurationSec, totalSubmissions]);

  const formatHours = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const formatAvg = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const allWarnings = useMemo(() => {
    const list: Array<{ sub: FormSubmission; warning: QualityWarning }> = [];
    submissions.forEach((sub) => {
      sub.quality_warnings?.forEach((w) => {
        list.push({ sub, warning: w });
      });
    });
    return list;
  }, [submissions]);

  // Counts by status
  const statusCounts = useMemo(() => {
    return {
      all: submissions.length,
      pending_review: submissions.filter((s) => s.status === 'pending_review').length,
      approved: submissions.filter((s) => s.status === 'approved').length,
      flagged: submissions.filter((s) => s.status === 'flagged').length,
      rejected: submissions.filter((s) => s.status === 'rejected').length,
    };
  }, [submissions]);

  // Filtered & sorted submissions for table
  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];

    if (filterWarningOnly) {
      result = result.filter((s) => s.quality_warnings && s.quality_warnings.length > 0);
    }

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const idMatch = s.id.toLowerCase().includes(q);
        const caseMatch = s.case_id?.toLowerCase().includes(q);
        const respMatch = (s.data?.respondent_name || '').toLowerCase().includes(q);
        const enumMatch = s.enumerator_name.toLowerCase().includes(q);
        const noteMatch = (s.supervisor_notes || '').toLowerCase().includes(q);
        return idMatch || caseMatch || respMatch || enumMatch || noteMatch;
      });
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'duration') {
        cmp = (a.metadata?.duration_seconds || 0) - (b.metadata?.duration_seconds || 0);
      } else if (sortField === 'respondent') {
        cmp = (a.data?.respondent_name || '').localeCompare(b.data?.respondent_name || '');
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [submissions, filterWarningOnly, statusFilter, searchQuery, sortField, sortOrder]);

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedSubmissionIds.size === filteredSubmissions.length) {
      setSelectedSubmissionIds(new Set());
    } else {
      setSelectedSubmissionIds(new Set(filteredSubmissions.map((s) => s.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedSubmissionIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedSubmissionIds(next);
  };

  const handleBulkApprove = async () => {
    if (selectedSubmissionIds.size === 0) return;
    const activeUser = CMRGStorage.getActiveUser();
    const reviewerName = activeUser?.name || 'Supervisor Officer';
    for (const id of Array.from(selectedSubmissionIds)) {
      await CMRGDataService.updateSubmissionStatus(id, 'approved', 'Bulk verified by supervisor');
      CMRGStorage.updateSubmissionStatus(id, 'approved', 'Bulk verified by supervisor', reviewerName);
    }
    setSelectedSubmissionIds(new Set());
    refreshData();
    showToast(`Approved ${selectedSubmissionIds.size} submission records.`);
  };

  const handleBulkFlag = async () => {
    if (selectedSubmissionIds.size === 0) return;
    const activeUser = CMRGStorage.getActiveUser();
    const reviewerName = activeUser?.name || 'Supervisor Officer';
    for (const id of Array.from(selectedSubmissionIds)) {
      await CMRGDataService.updateSubmissionStatus(id, 'flagged', 'Flagged in bulk for revisitation');
      CMRGStorage.updateSubmissionStatus(id, 'flagged', 'Flagged in bulk for revisitation', reviewerName);
    }
    setSelectedSubmissionIds(new Set());
    refreshData();
    showToast(`Flagged ${selectedSubmissionIds.size} records for field corrections.`);
  };

  const handleExportSelectedCsv = () => {
    const targets = submissions.filter((s) => selectedSubmissionIds.has(s.id));
    const toExport = targets.length > 0 ? targets : filteredSubmissions;

    const headers = [
      'submission_id',
      'case_id',
      'respondent_name',
      'dwelling_condition',
      'water_source',
      'num_in_hh',
      'duration_seconds',
      'gps_lat',
      'gps_lng',
      'gps_accuracy',
      'enumerator_name',
      'status',
      'created_at',
    ];

    const rows = toExport.map((s) => [
      `"${s.id}"`,
      `"${s.case_id || ''}"`,
      `"${(s.data?.respondent_name || '').replace(/"/g, '""')}"`,
      `"${s.data?.dwelling_condition || ''}"`,
      `"${s.data?.water_source || ''}"`,
      s.data?.num_in_hh || 0,
      s.metadata?.duration_seconds || 0,
      s.gps_location?.lat || '',
      s.gps_location?.lng || '',
      s.gps_location?.accuracy || '',
      `"${(s.enumerator_name || '').replace(/"/g, '""')}"`,
      `"${s.status}"`,
      `"${s.created_at}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cmrg_situation_room_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${toExport.length} verified records to CSV.`);
  };

  const fieldStats = useMemo(() => {
    const values: number[] = [];
    let missingCount = 0;

    submissions.forEach((s) => {
      const v = s.data?.[selectedField];
      if (typeof v === 'number' && !isNaN(v)) {
        values.push(v);
      } else {
        missingCount++;
      }
    });

    if (values.length === 0) {
      return { n: 0, missing: submissions.length, mean: 0, sd: 0, min: 0, max: 0, median: 0, distribution: {} };
    }

    values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const sd = Math.sqrt(variance);
    const min = values[0];
    const max = values[values.length - 1];
    const median = values[Math.floor(values.length / 2)];

    const distribution: Record<number, number> = {};
    values.forEach((v) => {
      distribution[v] = (distribution[v] || 0) + 1;
    });

    return {
      n: values.length,
      missing: missingCount,
      mean: Number(mean.toFixed(2)),
      sd: Number(sd.toFixed(2)),
      min,
      max,
      median,
      distribution,
    };
  }, [submissions, selectedField]);

  const categoricalStats = useMemo(() => {
    if (selectedField !== 'water_source' && selectedField !== 'dwelling_condition') return null;
    const counts: Record<string, number> = {};
    submissions.forEach((s) => {
      const v = s.data?.[selectedField] || 'Unspecified';
      counts[v] = (counts[v] || 0) + 1;
    });
    return counts;
  }, [submissions, selectedField]);

  const handleUpdateStatus = async (subId: string, newStatus: FormSubmission['status']) => {
    const activeUser = CMRGStorage.getActiveUser();
    const reviewerName = activeUser?.name || 'Supervisor Officer';
    await CMRGDataService.updateSubmissionStatus(subId, newStatus);
    CMRGStorage.updateSubmissionStatus(subId, newStatus, undefined, reviewerName);
    refreshData();
    if (selectedSubmission?.id === subId) {
      setSelectedSubmission((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // CMRG Palette: Official Red, Charcoal/Obsidian, Warm Accents
  const sliceColors = [
    '#D71920',
    '#111111',
    '#b91c1c',
    '#334155',
    '#ea580c',
    '#64748b',
    '#dc2626',
    '#475569',
    '#f97316',
    '#1e293b',
    '#ef4444',
    '#0f172a',
    '#991b1b',
    '#d97706',
    '#7f1d1d',
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] text-[#111111] overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-6 z-50 bg-[#111111] text-white px-4 py-2.5 rounded-lg shadow-2xl border-l-4 border-[#D71920] text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Monitor Navigation Bar (CMRG Black & Red Header) */}
      <div className="bg-[#111111] text-white px-6 py-2.5 flex items-center justify-between shadow-md shrink-0 border-b-2 border-[#D71920]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#D71920] uppercase tracking-wider">
              CMRG FIELD MONITOR
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-xs font-bold text-white">Household Listing — Round 2</span>
          </div>

          <span className="text-[11px] bg-red-950 text-red-300 px-2.5 py-0.5 rounded-full font-mono font-bold border border-red-800">
            Live Field Stream &middot; AES-256 Vault
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setMonitorTab('table')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              monitorTab === 'table' ? 'bg-[#D71920] text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Situation Room ({filteredSubmissions.length})</span>
          </button>

          <button
            onClick={() => setMonitorTab('map')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              monitorTab === 'map' ? 'bg-[#D71920] text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>GPS Geospatial Map</span>
          </button>

          <button
            onClick={() => setMonitorTab('stats')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              monitorTab === 'stats' ? 'bg-[#D71920] text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Variable Distributions</span>
          </button>

          <button
            onClick={() => setMonitorTab('quality')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              monitorTab === 'quality' ? 'bg-[#D71920] text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Quality Audit ({allWarnings.length})</span>
          </button>
        </div>

        {/* Action icons row */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <button
            onClick={refreshData}
            title="Refresh database records"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportSelectedCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={onOpenMobile}
            className="px-3.5 py-1.5 rounded bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Open Field Collector</span>
          </button>
        </div>
      </div>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        {/* SUBMISSIONS */}
        <div className="bg-[#f8fafc] rounded-lg p-3 border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-red-50 text-[#D71920] flex items-center justify-center shrink-0 border border-red-100">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              SUBMISSIONS VERIFIED
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-slate-900 tabular-nums">{totalSubmissions}</span>
              <span className="text-[11px] text-slate-500">records</span>
            </div>
            <div className="text-[10px] text-slate-500 flex gap-2 mt-0.5">
              <span>Approved: <b className="font-semibold text-emerald-700">{statusCounts.approved}</b></span>
              <span>&middot;</span>
              <span>Pending: <b className="font-semibold text-blue-700">{statusCounts.pending_review}</b></span>
            </div>
          </div>
        </div>

        {/* FIELDS */}
        <div className="bg-[#f8fafc] rounded-lg p-3 border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 border border-slate-200">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">QUESTION FIELDS</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-slate-900 tabular-nums">{totalFields}</span>
              <span className="text-[11px] text-slate-500">active items</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              <span>GPS Geopoint &middot; Multimedia &middot; Audio &middot; Signature</span>
            </div>
          </div>
        </div>

        {/* DURATION */}
        <div className="bg-[#f8fafc] rounded-lg p-3 border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              TOTAL INTERVIEW DURATION
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-slate-900 tabular-nums">{formatHours(totalDurationSec)}</span>
              <span className="text-[11px] text-slate-500">clocked</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              <span>Avg interview: <b className="font-semibold text-slate-800 tabular-nums">{formatAvg(avgDurationSec)}</b></span>
            </div>
          </div>
        </div>

        {/* QUALITY CHECKS */}
        <div className="bg-[#f8fafc] rounded-lg p-3 border border-slate-200 shadow-2xs flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${
              allWarnings.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              SUPERVISOR QUALITY FLAGS
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-slate-900 tabular-nums">{allWarnings.length}</span>
              <span className="text-[11px] text-slate-500">outlier warnings</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              <span>Speed checks, GPS radius &amp; logic constraints</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PRIMARY MONITOR VIEWPORT ================= */}
      <div className="flex-1 overflow-hidden p-6">
        {/* ================= TAB 1: SITUATION ROOM DATA TABLE ================= */}
        {monitorTab === 'table' && (
          <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Filter Toolbar */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Bar */}
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search respondent, ID, enumerator..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#D71920]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Pills */}
                <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-md font-semibold">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({statusCounts.all})
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending_review')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      statusFilter === 'pending_review' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending ({statusCounts.pending_review})
                  </button>
                  <button
                    onClick={() => setStatusFilter('approved')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      statusFilter === 'approved' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Approved ({statusCounts.approved})
                  </button>
                  <button
                    onClick={() => setStatusFilter('flagged')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      statusFilter === 'flagged' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Flagged ({statusCounts.flagged})
                  </button>
                  <button
                    onClick={() => setStatusFilter('rejected')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      statusFilter === 'rejected' ? 'bg-red-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Rejected ({statusCounts.rejected})
                  </button>
                </div>

                {/* Warning filter toggle */}
                <button
                  onClick={() => setFilterWarningOnly(!filterWarningOnly)}
                  className={`px-2.5 py-1.5 rounded-md border flex items-center gap-1 transition-colors ${
                    filterWarningOnly ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Outliers Only</span>
                </button>
              </div>

              {/* Bulk actions */}
              <div className="flex items-center gap-2">
                {selectedSubmissionIds.size > 0 && (
                  <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-semibold animate-in fade-in">
                    <span>{selectedSubmissionIds.size} Selected</span>
                    <span className="text-slate-500">|</span>
                    <button
                      onClick={handleBulkApprove}
                      className="text-emerald-400 hover:text-emerald-300 font-bold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={handleBulkFlag}
                      className="text-amber-400 hover:text-amber-300 font-bold"
                    >
                      Flag Revisit
                    </button>
                    <button
                      onClick={handleExportSelectedCsv}
                      className="text-blue-300 hover:text-blue-200"
                    >
                      Export CSV
                    </button>
                  </div>
                )}

                <span className="text-slate-500 text-[11px] font-mono">
                  Showing {filteredSubmissions.length} of {submissions.length} Records
                </span>
              </div>
            </div>

            {/* Submissions Table with Situation Room triggers */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#111111] text-white font-bold tracking-wider uppercase text-[10px] sticky top-0 z-20">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="cursor-pointer">
                        {selectedSubmissionIds.size === filteredSubmissions.length && filteredSubmissions.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#D71920]" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 font-mono">Submission ID</th>
                    <th className="p-3">Case / Respondent</th>
                    <th className="p-3">Enumerator &middot; Team</th>
                    <th className="p-3 cursor-pointer" onClick={() => { setSortField('duration'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                      <div className="flex items-center gap-1">
                        <span>Duration</span>
                        {sortField === 'duration' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th className="p-3">GPS Coordinate</th>
                    <th className="p-3">Evidence Attachments</th>
                    <th className="p-3">Review Status</th>
                    <th className="p-3 text-right">Situation Room Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-700">No submissions matching current criteria.</p>
                        <p className="text-xs text-slate-500 mt-1">Try clearing filters or search queries.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub, idx) => {
                      const isSelected = selectedSubmissionIds.has(sub.id);
                      const hasWarning = sub.quality_warnings && sub.quality_warnings.length > 0;
                      const hasPhoto = sub.media_attachments && sub.media_attachments.some((m) => m.file_type.includes('image'));
                      const hasAudio = sub.media_attachments && sub.media_attachments.some((m) => m.file_type.includes('audio'));

                      return (
                        <tr
                          key={sub.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-red-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <button onClick={() => toggleSelectOne(sub.id)} className="cursor-pointer">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#D71920]" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                              )}
                            </button>
                          </td>

                          {/* Submission ID */}
                          <td className="p-3 font-mono font-bold text-slate-900">
                            <button
                              onClick={() => setSelectedSubmission(sub)}
                              className="text-left hover:text-[#D71920] hover:underline cursor-pointer"
                              title="Open in Situation Room"
                            >
                              {sub.id}
                            </button>
                            {sub.case_id && (
                              <span className="block text-[10px] text-slate-500 font-normal">
                                Case: {sub.case_id}
                              </span>
                            )}
                          </td>

                          {/* Respondent Name & Housing */}
                          <td className="p-3">
                            <div className="font-bold text-slate-900">
                              {sub.data?.respondent_name || 'Anonymous Household'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {sub.data?.dwelling_condition || 'Standard dwelling'} &middot; {sub.data?.num_in_hh || 1} members
                            </div>
                          </td>

                          {/* Enumerator */}
                          <td className="p-3">
                            <div className="font-medium text-slate-800">{sub.enumerator_name}</div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Duration */}
                          <td className="p-3 font-mono text-slate-700">
                            {formatAvg(sub.metadata?.duration_seconds || 180)}
                          </td>

                          {/* GPS Coordinate */}
                          <td className="p-3">
                            {sub.gps_location ? (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-[#D71920] shrink-0" />
                                <span>
                                  {sub.gps_location.lat.toFixed(4)}, {sub.gps_location.lng.toFixed(4)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  (&plusmn;{sub.gps_location.accuracy || 3.8}m)
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No GPS signal</span>
                            )}
                          </td>

                          {/* Attachments */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              {hasPhoto && (
                                <span className="p-1 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Photo Attached">
                                  <Camera className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {hasAudio && (
                                <span className="p-1 rounded bg-purple-50 text-purple-700 border border-purple-200" title="Audio Recorded">
                                  <Mic className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <span className="p-1 rounded bg-slate-100 text-slate-700 border border-slate-200" title="Signed Consent Form">
                                <PenTool className="w-3.5 h-3.5" />
                              </span>
                              {hasWarning && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]" title="Outlier Warnings">
                                  ! {sub.quality_warnings?.length}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Review Status */}
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : sub.status === 'rejected'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : sub.status === 'flagged'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}
                            >
                              {sub.status.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Action Button: Situation Room */}
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedSubmission(sub)}
                              className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-[#D71920] text-white font-bold text-xs transition-colors flex items-center gap-1.5 ml-auto cursor-pointer shadow-2xs"
                              title="Inspect complete interview record, GPS map, audio & responses in Situation Room"
                            >
                              <Shield className="w-3.5 h-3.5 text-[#D71920] group-hover:text-white" />
                              <span>Situation Room</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-semibold">
                  {selectedSubmissionIds.size} of {filteredSubmissions.length} records selected
                </span>
                <span className="text-slate-300">&middot;</span>
                <span className="text-slate-500">
                  Data Vault: PostgreSQL / Supabase RLS Protected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportSelectedCsv}
                  className="px-3 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold cursor-pointer"
                >
                  Export Filtered CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: GEOSPATIAL FIELD MAP ================= */}
        {monitorTab === 'map' && (
          <div className="h-full flex flex-col overflow-hidden">
            <LeafletSubmissionsMap
              submissions={submissions}
              selectedSubmission={selectedSubmission}
              onSelectSubmission={(sub) => setSelectedSubmission(sub)}
              filterWarningOnly={filterWarningOnly}
            />
          </div>
        )}

        {/* ================= TAB 3: VARIABLE DISTRIBUTIONS & ANALYTICS ================= */}
        {monitorTab === 'stats' && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
            {/* Left: Interactive Field Inspector */}
            <div className="lg:col-span-7 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Target Field:</span>
                  <select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                    className="text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="num_in_hh">num_in_hh (Household Members Count)</option>
                    <option value="water_source">water_source (Main Drinking Water Source)</option>
                    <option value="dwelling_condition">dwelling_condition (Dwelling Condition)</option>
                    <option value="water_distance_minutes">water_distance_minutes (Walking Time to Water)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      chartType === 'bar' ? 'bg-[#111111] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Bar Chart
                  </button>
                  <button
                    onClick={() => setChartType('pie')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      chartType === 'pie' ? 'bg-[#D71920] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Pie Chart
                  </button>
                </div>
              </div>

              {/* Statistical Summary Box */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-xs font-mono">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans">N Valid</span>
                    <span className="font-bold text-slate-900 text-sm">{fieldStats.n}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans">N Missing</span>
                    <span className="font-bold text-slate-900 text-sm">{fieldStats.missing}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans">Mean</span>
                    <span className="font-bold text-slate-900 text-sm">{fieldStats.mean}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans">SD</span>
                    <span className="font-bold text-slate-900 text-sm">{fieldStats.sd}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans">Min</span>
                    <span className="font-bold text-slate-900 text-sm">{fieldStats.min}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans">Median</span>
                    <span className="font-bold text-slate-900 text-sm">{fieldStats.median}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans">Max</span>
                    <span className="font-bold text-[#D71920] text-sm">{fieldStats.max}</span>
                  </div>
                </div>
              </div>

              {/* Chart Rendering */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
                {chartType === 'pie' ? (
                  <div className="flex flex-col sm:flex-row items-center gap-8 w-full justify-center">
                    <div className="relative w-48 h-48 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {(() => {
                          const entries = selectedField === 'num_in_hh'
                            ? Object.entries(fieldStats.distribution)
                            : Object.entries(categoricalStats || {});
                          const total = entries.reduce((acc, [_, count]) => acc + (count as number), 0) || 1;
                          let accumulatedAngle = 0;

                          return entries.map(([key, count], index) => {
                            const sliceFraction = (count as number) / total;
                            const angle = sliceFraction * 360;
                            const startAngle = accumulatedAngle;
                            accumulatedAngle += angle;

                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = ((startAngle + angle) * Math.PI) / 180;

                            const x1 = 50 + 40 * Math.cos(startRad);
                            const y1 = 50 + 40 * Math.sin(startRad);
                            const x2 = 50 + 40 * Math.cos(endRad);
                            const y2 = 50 + 40 * Math.sin(endRad);

                            const largeArc = angle > 180 ? 1 : 0;
                            const color = sliceColors[index % sliceColors.length];

                            return (
                              <path
                                key={key}
                                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={color}
                                stroke="#ffffff"
                                strokeWidth="1.5"
                                className="hover:opacity-85 transition-opacity cursor-pointer"
                              >
                                <title>{`${key}: ${count} (${Math.round(sliceFraction * 100)}%)`}</title>
                              </path>
                            );
                          });
                        })()}
                      </svg>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs max-h-56 overflow-y-auto">
                      {(selectedField === 'num_in_hh'
                        ? Object.entries(fieldStats.distribution)
                        : Object.entries(categoricalStats || {})
                      ).map(([val, count], i) => (
                        <div key={val} className="flex items-center gap-2 py-0.5">
                          <span
                            className="w-3.5 h-3.5 rounded-xs shrink-0"
                            style={{ backgroundColor: sliceColors[i % sliceColors.length] }}
                          />
                          <span className="text-slate-700 truncate font-mono text-xs">{val}:</span>
                          <span className="font-bold text-slate-900 tabular-nums">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-3 max-h-80 overflow-y-auto pr-2">
                    {(selectedField === 'num_in_hh'
                      ? Object.entries(fieldStats.distribution)
                      : Object.entries(categoricalStats || {})
                    ).map(([key, count], idx) => {
                      const maxCount = Math.max(...Object.values(fieldStats.distribution), 1);
                      const pct = Math.round(((count as number) / maxCount) * 100);
                      return (
                        <div key={key} className="flex items-center gap-3 text-xs">
                          <span className="w-28 text-slate-800 font-bold truncate font-mono">{key}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: sliceColors[idx % sliceColors.length],
                              }}
                            />
                          </div>
                          <span className="w-12 text-right font-bold text-slate-900 tabular-nums">{count as number}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: GPS Context Mini Map */}
            <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
              <LeafletSubmissionsMap
                submissions={submissions}
                selectedSubmission={selectedSubmission}
                onSelectSubmission={(sub) => setSelectedSubmission(sub)}
                filterWarningOnly={filterWarningOnly}
              />
            </div>
          </div>
        )}

        {/* ================= TAB 4: QUALITY AUDIT & WARNINGS ================= */}
        {monitorTab === 'quality' && (
          <div className="h-full bg-white rounded-xl border border-slate-200 p-6 overflow-y-auto space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Quality Assurance &middot; Automated Outlier Rules
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time field auditor flagging speed violations, geographic displacement, and roster constraints
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                {allWarnings.length} Active Warnings
              </span>
            </div>

            <div className="space-y-3">
              {allWarnings.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 text-sm">All submissions passed quality checks!</p>
                  <p className="text-xs text-slate-500 mt-1">No speed outliers, geofence breaches, or logic anomalies detected.</p>
                </div>
              ) : (
                allWarnings.map(({ sub, warning }) => (
                  <div
                    key={warning.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-black text-[#D71920]">{sub.id}</span>
                        <span className="text-slate-400">&middot;</span>
                        <span className="font-bold text-slate-900">Enumerator: {sub.enumerator_name}</span>
                        <span className="text-slate-400">&middot;</span>
                        <span className="text-slate-500">{new Date(sub.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-900 font-semibold text-xs">{warning.message}</p>
                      <p className="text-[11px] text-slate-600">
                        Respondent: <b>{sub.data?.respondent_name || 'N/A'}</b> &middot; Duration: <b>{sub.metadata?.duration_seconds}s</b>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#D71920]" />
                        <span>Inspect in Situation Room</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(sub.id, 'approved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(sub.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: SITUATION ROOM (ONE RECORD, ALL EVIDENCE) ================= */}
      {selectedSubmission && (
        <SituationRoomModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onStatusUpdated={(updated) => {
            setSelectedSubmission(updated);
            refreshData();
          }}
        />
      )}
    </div>
  );
};
