import React, { useState } from 'react';
import {
  FileText,
  Smartphone,
  MapPin,
  Download,
  Settings,
  RefreshCw,
  Search,
  Grid,
  HelpCircle,
  Play,
  Edit2,
  Upload,
  Lock,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Activity,
  Server,
  ExternalLink,
  User,
  LogOut,
  Sliders,
  Laptop
} from 'lucide-react';
import { CMRGLogo } from '../brand/CMRGLogo';
import { DataExplorerMonitor } from '../monitor/DataExplorerMonitor';
import { FormStudio } from '../forms/FormStudio';
import { CaseManager } from '../cases/CaseManager';
import { ExportAndSupabaseHub } from '../export/ExportAndSupabaseHub';
import { CMRGDesktopApp } from '../desktop/CMRGDesktopApp';
import { FormDefinition } from '../../types/survey';
import { CMRGStorage } from '../../lib/storage';

interface ConsoleLayoutProps {
  onBackToLanding: () => void;
  onLaunchMobile: (formId?: string, caseId?: string) => void;
  onOpenQRModal: () => void;
  onLogout?: () => void;
  initialTab?: 'design' | 'collect' | 'monitor' | 'export' | 'configure';
}

export const ConsoleLayout: React.FC<ConsoleLayoutProps> = ({
  onBackToLanding,
  onLaunchMobile,
  onOpenQRModal,
  onLogout,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<'design' | 'collect' | 'monitor' | 'export' | 'configure'>(initialTab || 'design');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [designSubView, setDesignSubView] = useState<'forms_list' | 'editor'>('forms_list');
  const [selectedFormForEdit, setSelectedFormForEdit] = useState<string>('form_hh_round2');
  const [collectSubView, setCollectSubView] = useState<'desktop' | 'cases'>('desktop');
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeUser = CMRGStorage.getActiveUser() || {
    email: 'dammyblack88@gmail.com',
    name: 'Principal Field Officer',
    role: 'Administrator',
    serverUrl: 'https://cmrg.survey-vault.org'
  };

  const forms = CMRGStorage.getForms();

  return (
    <div className="h-full flex flex-col bg-[#eef2f6] text-slate-800 font-sans select-none overflow-hidden">
      {/* ================= TOP HEADER FROM IMAGE 4 ================= */}
      <header className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-6">
          {/* Official CMRG Logo and Back to Website */}
          <div className="flex items-center gap-3">
            <CMRGLogo variant="official" size="sm" />
            <button
              onClick={onBackToLanding}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-2 py-1 rounded transition-colors"
              title="Return to Marketing Website"
            >
              &larr; Website
            </button>
          </div>

          {/* 5 Main Tabs from Image 4 */}
          <nav className="flex items-center text-sm font-semibold">
            {/* 1. Design */}
            <button
              onClick={() => { setActiveTab('design'); setDesignSubView('forms_list'); }}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'design'
                  ? 'text-[#D71920] font-black border-b-2 border-[#D71920]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>1. Design</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* 2. Collect */}
            <button
              onClick={() => setActiveTab('collect')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'collect'
                  ? 'text-[#D71920] font-black border-b-2 border-[#D71920]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>2. Collect</span>
            </button>

            {/* 3. Monitor */}
            <button
              onClick={() => setActiveTab('monitor')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'monitor'
                  ? 'text-[#D71920] font-black border-b-2 border-[#D71920]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>3. Monitor</span>
            </button>

            {/* 4. Export */}
            <button
              onClick={() => setActiveTab('export')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'export'
                  ? 'text-[#D71920] font-black border-b-2 border-[#D71920]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>4. Export</span>
            </button>

            {/* Configure */}
            <button
              onClick={() => setActiveTab('configure')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'configure'
                  ? 'text-[#D71920] font-black border-b-2 border-[#D71920]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure</span>
            </button>
          </nav>
        </div>

        {/* Right Tools from Image 4 */}
        <div className="flex items-center gap-4 text-slate-500 text-xs">
          <span title="Server Health Check">
            <Activity className="w-4 h-4 cursor-pointer hover:text-slate-800" />
          </span>
          <span title="System Logs">
            <Server className="w-4 h-4 cursor-pointer hover:text-slate-800" />
          </span>
          <button
            onClick={onOpenQRModal}
            title="Pair Mobile Device"
            className="hover:text-slate-800"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* User Profile dropdown from Image 4 */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1 text-slate-700 font-semibold hover:text-slate-900 transition-colors"
            >
              <User className="w-4 h-4 text-[#D71920]" />
              <span className="truncate max-w-[180px]">{activeUser.email}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{activeUser.name}</p>
                  <p className="text-[11px] text-slate-500">{activeUser.role}</p>
                </div>
                <button
                  onClick={() => { setUserDropdownOpen(false); onOpenQRModal(); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#D71920]" />
                  <span>Pair Field Device QR</span>
                </button>
                <button
                  onClick={() => { setUserDropdownOpen(false); onBackToLanding(); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700"
                >
                  View Marketing Portal
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    CMRGStorage.logoutUser();
                    onLogout?.();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

          {/* "Your forms and datasets" Button from Image 4 */}
          <button
            onClick={() => { setActiveTab('design'); setDesignSubView('forms_list'); }}
            className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 font-semibold text-slate-800 transition-colors shadow-2xs"
          >
            Your forms and datasets
          </button>
        </div>
      </header>

      {/* ================= SECONDARY TOOLBAR FROM IMAGE 4 ================= */}
      {activeTab === 'design' && designSubView === 'forms_list' && (
        <div className="bg-[#f8fafc] border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setSelectedFormForEdit('form_hh_round2');
                setDesignSubView('editor');
              }}
              className="flex items-center gap-1.5 hover:text-slate-900 font-semibold"
            >
              <Plus className="w-3.5 h-3.5 text-red-600" />
              <span>Create New Form</span>
            </button>
            <button
              onClick={() => alert('Refreshing forms registry...')}
              className="flex items-center gap-1.5 hover:text-slate-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none"
              />
            </div>
            <button className="flex items-center gap-1.5 hover:text-slate-900">
              <Grid className="w-3.5 h-3.5" />
              <span>Organize</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-slate-900">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            {forms.length} Published Survey Forms &middot; AES-256 Vault Active
          </div>
        </div>
      )}

      {/* ================= TAB ROUTER ================= */}
      <main className="flex-1 overflow-hidden">
        {/* ================= TAB 1: DESIGN ================= */}
        {activeTab === 'design' && (
          designSubView === 'editor' ? (
            <FormStudio
              onOpenMobile={(formId) => onLaunchMobile(formId)}
              onClose={() => setDesignSubView('forms_list')}
            />
          ) : (
            /* Forms list matching Image 4 groups and cards */
            <div className="p-8 overflow-y-auto h-full max-w-5xl mx-auto space-y-6">
              {/* Group 1: Household Demographic & Living Conditions from Image 4 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                {/* Group Header from Image 4 */}
                <div className="bg-[#eceff1] px-4 py-2.5 flex items-center justify-between border-b border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <button className="w-4 h-4 rounded bg-slate-300 flex items-center justify-center text-slate-700">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-slate-800 text-sm">Household Surveys Cluster</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <button className="hover:text-slate-800">Rename</button>
                    <button className="hover:text-red-600">Delete</button>
                  </div>
                </div>

                {/* Form Card */}
                <div className="p-4 space-y-3">
                  {forms.map((form) => (
                    <div
                      key={form.id}
                      className="border border-slate-200 bg-white rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs hover:border-[#D71920]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#D71920]" />
                          <h4 className="font-bold text-slate-900 text-sm">{form.title}</h4>
                        </div>
                        <p className="text-xs text-slate-600 font-mono">
                          Form ID: <span className="font-bold text-slate-800">{form.id}</span>, Deployed version: <span className="font-bold text-slate-800">{form.version}</span>
                        </p>
                      </div>

                      {/* Action buttons: Test, Edit, Upload, Tools, Encryption, Download, Duplicate, Delete */}
                      <div className="flex items-center gap-3 text-xs text-slate-700 font-medium shrink-0">
                        <button
                          onClick={() => onLaunchMobile(form.id)}
                          className="flex items-center gap-1 hover:text-[#D71920]"
                          title="Test Form"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                          <span>Test</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFormForEdit(form.id);
                            setDesignSubView('editor');
                          }}
                          className="flex items-center gap-1 hover:text-[#D71920]"
                          title="Edit in Form Designer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#D71920]" />
                          <span>Edit</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-[#D71920]">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-[#D71920]">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Encryption</span>
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(form, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `${form.id}_schema_v${form.version}.json`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="flex items-center gap-1 hover:text-[#D71920] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Schema</span>
                        </button>
                        <button
                          onClick={() => {
                            const copyForm: FormDefinition = {
                              ...form,
                              id: `${form.id}_v2`,
                              title: `${form.title} (v2)`,
                              version: '2.0.0',
                              created_at: new Date().toISOString()
                            };
                            CMRGStorage.saveForm(copyForm);
                            window.location.reload();
                          }}
                          className="flex items-center gap-1 hover:text-[#D71920] cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          onClick={() => {
                            CMRGStorage.cleanLocalStorage([form.id], false);
                            window.location.reload();
                          }}
                          className="flex items-center gap-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Delete Form"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {/* ================= TAB 2: COLLECT ================= */}
        {activeTab === 'collect' && (
          <div className="h-full flex flex-col bg-white">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => setCollectSubView('desktop')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                  collectSubView === 'desktop'
                    ? 'bg-[#D71920] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>CMRG Desktop (Local Storage &amp; Offline Sync)</span>
              </button>

              <button
                onClick={() => setCollectSubView('cases')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                  collectSubView === 'cases'
                    ? 'bg-[#D71920] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Assigned Household Cases</span>
              </button>

              <button
                onClick={() => onLaunchMobile('form_hh_round2')}
                className="ml-auto px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Open Mobile Collector App</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {collectSubView === 'desktop' ? (
                <CMRGDesktopApp
                  onOpenFormDesigner={(id) => {
                    setSelectedFormForEdit(id);
                    setActiveTab('design');
                    setDesignSubView('editor');
                  }}
                  onOpenMonitor={() => setActiveTab('monitor')}
                />
              ) : (
                <CaseManager onStartCaseVisit={(caseId) => onLaunchMobile('form_hh_round2', caseId)} />
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: MONITOR (from previous turn) ================= */}
        {activeTab === 'monitor' && (
          <DataExplorerMonitor onOpenMobile={() => onLaunchMobile('form_hh_round2')} />
        )}

        {/* ================= TAB 4: EXPORT ================= */}
        {activeTab === 'export' && (
          <ExportAndSupabaseHub />
        )}

        {/* ================= TAB 5: CONFIGURE ================= */}
        {activeTab === 'configure' && (
          <div className="p-8 max-w-4xl mx-auto space-y-6 overflow-y-auto h-full">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">CMRG Server Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Server Organization</label>
                  <input
                    type="text"
                    defaultValue="CMRG Ltd (RC37852)"
                    readOnly
                    className="w-full p-2.5 border rounded bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Primary Research Cloud URL</label>
                  <input
                    type="text"
                    defaultValue="https://cmrg-manicaland-vault.cmrg-field.org"
                    readOnly
                    className="w-full p-2.5 border rounded bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Database &amp; Storage Backend</label>
                  <input
                    type="text"
                    defaultValue="PostgreSQL 15 + Supabase Vault (Row Level Security)"
                    readOnly
                    className="w-full p-2.5 border rounded bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Security Standard</label>
                  <input
                    type="text"
                    defaultValue="SOC2 Type II &middot; GDPR DPA &middot; Client-Side RSA 2048"
                    readOnly
                    className="w-full p-2.5 border rounded bg-slate-50 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
