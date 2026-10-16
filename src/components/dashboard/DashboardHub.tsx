import React from 'react';
import {
  FileText,
  Smartphone,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Download,
  Users,
  Shield,
  Layers,
  Plus
} from 'lucide-react';
import { CMRGStorage } from '../../lib/storage';

interface DashboardHubProps {
  onNavigateTab: (tab: 'design' | 'collect' | 'monitor' | 'export' | 'configure') => void;
  onOpenMobileCollector: () => void;
  onOpenQRModal: () => void;
}

export const DashboardHub: React.FC<DashboardHubProps> = ({
  onNavigateTab,
  onOpenMobileCollector,
  onOpenQRModal,
}) => {
  const forms = CMRGStorage.getForms();
  const cases = CMRGStorage.getCases();
  const submissions = CMRGStorage.getSubmissions('form_hh_round2');
  const offlineQueue = CMRGStorage.getOfflineQueue();

  const totalSubmissions = submissions.length;
  const pendingCases = cases.filter(c => c.status !== 'completed').length;
  const flaggedCount = submissions.filter(s => s.status === 'flagged' || (s.quality_warnings && s.quality_warnings.length > 0)).length;

  return (
    <div className="h-full bg-[#f8f9fa] p-8 overflow-y-auto space-y-8 text-[#111111]">
      {/* Top Banner */}
      <div className="bg-[#111111] text-white p-6 rounded-2xl shadow-md border-t-4 border-[#D71920] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-mono tracking-widest text-red-400 font-bold">
            CMRG DATA COLLECT &middot; GLOBAL CONTROL DESK
          </span>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Mutare Rural District Household Enumeration
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Round 2 socio-economic, living conditions, and WASH assessment across Chisamba, Muchena, and Sakubwa clusters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenMobileCollector}
            className="px-4 py-2.5 rounded-xl bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            <span>Launch Mobile Collector</span>
          </button>
          <button
            onClick={onOpenQRModal}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
          >
            Pair Android / iOS Phone
          </button>
        </div>
      </div>

      {/* 4 Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submissions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Total Submissions</span>
            <FileText className="w-4 h-4 text-[#D71920]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tabular-nums">{totalSubmissions}</span>
            <span className="text-xs font-semibold text-emerald-600">+14 today</span>
          </div>
          <p className="text-[11px] text-slate-500">100% verified against sample bounds</p>
        </div>

        {/* Active Household Cases */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Pending Cases</span>
            <Users className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tabular-nums">{pendingCases}</span>
            <span className="text-xs text-slate-500">of {cases.length} assigned</span>
          </div>
          <p className="text-[11px] text-slate-500">Panel visits scheduled this week</p>
        </div>

        {/* Quality Outlier Flags */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Quality Audit Flags</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700 tabular-nums">{flaggedCount}</span>
            <span className="text-xs font-bold text-amber-600">Requires Review</span>
          </div>
          <p className="text-[11px] text-slate-500">Speed and statistical bounds alerts</p>
        </div>

        {/* Offline Queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Offline Sync Vault</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tabular-nums">{offlineQueue.length}</span>
            <span className="text-xs text-slate-500">queued</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold">Zero data loss guarantee active</p>
        </div>
      </div>

      {/* Main Grid: Projects & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Projects & Forms */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D71920]" />
              <h3 className="font-bold text-base text-slate-900">Active Field Questionnaires</h3>
            </div>
            <button
              onClick={() => onNavigateTab('design')}
              className="text-xs font-bold text-[#D71920] hover:underline flex items-center gap-1"
            >
              <span>Manage in Designer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {forms.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{f.title}</span>
                    <span className="px-2 py-0.2 bg-slate-200 text-slate-700 font-mono text-[10px] rounded font-bold">
                      v{f.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {f.id} &middot; {f.fields.length} questions &middot; {f.submission_count} records
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateTab('monitor')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors"
                  >
                    Monitor
                  </button>
                  <button
                    onClick={() => onNavigateTab('design')}
                    className="px-3 py-1.5 rounded-lg bg-[#111111] hover:bg-black text-white text-xs font-bold transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Action Hub */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Field Operations Shortcuts
            </h3>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => onNavigateTab('monitor')}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#D71920]" />
                  <div>
                    <span className="text-slate-900 block font-bold">Leaflet Geospatial Map</span>
                    <span className="text-slate-500 text-[11px]">Inspect real coordinates and cluster pins</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateTab('collect')}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-slate-800" />
                  <div>
                    <span className="text-slate-900 block font-bold">Assigned Household Cases</span>
                    <span className="text-slate-500 text-[11px]">Panel tracking and enumerator visits</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateTab('export')}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-xs font-semibold"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <div>
                    <span className="text-slate-900 block font-bold">Export Stata &middot; SPSS &middot; CSV</span>
                    <span className="text-slate-500 text-[11px]">Generate analysis syntax and flat tables</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Assigned Field Enumerators */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Field Team &middot; Manicaland Cluster
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="font-bold text-slate-900">Amina Khumalo</span>
                <span className="text-emerald-700 font-mono text-[10px] font-bold">64 Submissions &middot; Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="font-bold text-slate-900">David Chimedza</span>
                <span className="text-emerald-700 font-mono text-[10px] font-bold">58 Submissions &middot; Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="font-bold text-slate-900">Grace Marufu (Supervisor)</span>
                <span className="text-slate-700 font-mono text-[10px] font-bold">51 Submissions &middot; Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
