import React, { useState } from 'react';
import {
  RefreshCw,
  Wifi,
  Key,
  CheckCircle2,
  FileCode,
  Sliders,
  Database,
  Trash2,
  Plus,
  HelpCircle,
  Settings,
  Info,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Laptop
} from 'lucide-react';
import { CMRGStorage } from '../../lib/storage';

interface CMRGDesktopAppProps {
  onOpenFormDesigner?: (formId: string) => void;
  onOpenMonitor?: () => void;
}

export const CMRGDesktopApp: React.FC<CMRGDesktopAppProps> = ({
  onOpenFormDesigner,
  onOpenMonitor
}) => {
  const [activeTab, setActiveTab] = useState<'local_storage' | 'wifi_sync' | 'encryption' | 'stata'>('local_storage');
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(true);
  const [selectedForms, setSelectedForms] = useState<string[]>(['form_hh_round2', 'form_wash_rapid']);
  const [cleanupAction, setCleanupAction] = useState<'definition_and_data' | 'data_only'>('definition_and_data');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const forms = CMRGStorage.getForms();

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedForms(forms.map(f => f.id));
    } else {
      setSelectedForms([]);
    }
  };

  const toggleSelectForm = (id: string) => {
    setSelectedForms(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCleanupNow = () => {
    if (selectedForms.length === 0) {
      setFeedbackNotice('Please select at least one form or dataset to clean up.');
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }

    CMRGStorage.cleanLocalStorage(selectedForms, cleanupAction === 'data_only');
    setFeedbackNotice(`Local storage clean up completed for ${selectedForms.length} item(s). (${cleanupAction === 'data_only' ? 'Data cleared' : 'Definition & Data deleted'})`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans select-none overflow-hidden">
      {/* Mac / Desktop Window Title Bar from Image 3 */}
      <div className="bg-[#e2e8f0] border-b border-slate-300 px-4 py-2 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2">
          {/* Mac Traffic Lights from Image 3 */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]"></span>
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]"></span>
            <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]"></span>
          </div>
          <span className="font-semibold text-slate-800 ml-3">CMRG Desktop | My Desktop</span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Server: https://cmrg-manicaland-vault.cmrg-field.org
        </div>
      </div>

      {/* Main Split Layout from Image 3 */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar from Image 3 */}
        <aside className="w-64 bg-[#f8fafc] border-r border-slate-200 flex flex-col justify-between overflow-y-auto text-xs">
          <div className="p-4 space-y-4">
            {/* User Avatar Card */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#D71920] to-[#991b1b] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                AK
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">My Desktop</h3>
                <p className="text-[11px] text-slate-400 font-mono">/Users/Guest</p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              <button
                onClick={() => {
                  alert('Syncing local forms and datasets with CMRG Cloud...');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-slate-700 hover:bg-slate-200/80 font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                <span>Sync</span>
              </button>

              {/* Offline form tools expandable menu */}
              <div className="pt-1">
                <button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded text-slate-700 hover:bg-slate-200/80 font-medium transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Laptop className="w-4 h-4 text-slate-500" />
                    <span>Offline form tools</span>
                  </div>
                  {isToolsOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {isToolsOpen && (
                  <div className="pl-6 space-y-0.5 pt-1 text-[11px] text-slate-600">
                    <button
                      onClick={() => alert('Local Wi-Fi server ready for peer device synchronization.')}
                      className="w-full text-left py-1.5 px-2 hover:bg-slate-200 rounded flex items-center gap-2"
                    >
                      <Wifi className="w-3.5 h-3.5 text-slate-500" />
                      <span>Local WiFi sync</span>
                    </button>
                    <button
                      onClick={() => alert('Public-Private key pair generated and stored locally in /Users/Guest/.cmrg/keys')}
                      className="w-full text-left py-1.5 px-2 hover:bg-slate-200 rounded flex items-center gap-2"
                    >
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                      <span>Create encryption key pair</span>
                    </button>
                    <button
                      onClick={() => alert('All XML and JSON form constraints validated: 0 syntax errors found.')}
                      className="w-full text-left py-1.5 px-2 hover:bg-slate-200 rounded flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Validate form</span>
                    </button>
                    <button
                      onClick={() => alert('CSV files re-encoded with UTF-8 BOM encoding for Excel.')}
                      className="w-full text-left py-1.5 px-2 hover:bg-slate-200 rounded flex items-center gap-2"
                    >
                      <FileCode className="w-3.5 h-3.5 text-slate-500" />
                      <span>Re-encode .csv</span>
                    </button>
                    <button
                      onClick={() => alert('Stata .do templates generated.')}
                      className="w-full text-left py-1.5 px-2 hover:bg-slate-200 rounded flex items-center gap-2"
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-500" />
                      <span>Generate Stata templates</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Local Storage link */}
              <button
                onClick={() => setActiveTab('local_storage')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded font-semibold transition-colors ${
                  activeTab === 'local_storage'
                    ? 'bg-red-50 text-[#D71920] border-l-3 border-[#D71920]'
                    : 'text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <Database className="w-4 h-4 text-[#D71920]" />
                <span>Local storage</span>
              </button>
            </nav>

            {/* SERVER SHORTCUTS from Image 3 */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase px-3 mb-1">
                <span>SERVER SHORTCUTS</span>
                <Plus className="w-3.5 h-3.5 cursor-pointer hover:text-slate-900" />
              </div>
              <div className="space-y-1 text-slate-700">
                <a
                  href="#monitor"
                  onClick={(e) => { e.preventDefault(); onOpenMonitor?.(); }}
                  className="block px-3 py-1.5 rounded hover:bg-slate-200/80 truncate font-mono text-[11px]"
                >
                  &gt; Monitor Explorer (173 subs)
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Settings & Help from Image 3 */}
          <div className="p-3 border-t border-slate-200 space-y-1 text-slate-600">
            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-200 rounded text-left">
              <Settings className="w-3.5 h-3.5" />
              <span>Desktop settings</span>
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-200 rounded text-left">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help and support</span>
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-200 rounded text-left">
              <Info className="w-3.5 h-3.5" />
              <span>About CMRG Desktop</span>
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-1.5 text-[#D71920] font-semibold hover:bg-slate-200 rounded text-left">
              <Plus className="w-3.5 h-3.5" />
              <span>Create a new desktop</span>
            </button>
          </div>
        </aside>

        {/* Right Content Pane: Local Storage */}
        <main className="flex-1 p-8 overflow-y-auto bg-white space-y-6">
          <div>
            <h2 className="text-2xl font-black text-[#111111] tracking-tight">
              Local storage
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-3xl">
              These are the forms and datasets currently stored in your local storage. You can use the <i>Clean up now...</i> button below to purge just the data, or delete the whole form/dataset from local storage.
            </p>
          </div>

          {feedbackNotice && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {feedbackNotice}
            </div>
          )}

          {/* Select all row */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={selectedForms.length === forms.length && forms.length > 0}
              className="rounded border-slate-300 text-[#D71920] focus:ring-[#D71920]"
            />
            <span>Select all</span>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3 w-10"></th>
                  <th className="p-3">Title</th>
                  <th className="p-3">ID</th>
                  <th className="p-3 text-right">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forms.map((f) => {
                  const isChecked = selectedForms.includes(f.id);
                  return (
                    <tr
                      key={f.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isChecked ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectForm(f.id)}
                          className="rounded border-slate-300 text-[#D71920] focus:ring-[#D71920]"
                        />
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        <button
                          onClick={() => onOpenFormDesigner?.(f.id)}
                          className="hover:text-[#D71920] text-left hover:underline font-semibold"
                        >
                          {f.title}
                        </button>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        <div>{f.id}</div>
                        <div className="text-[10px] text-slate-400">Version: {f.version}</div>
                      </td>
                      <td className="p-3 text-right font-mono text-[11px] font-bold text-slate-600 uppercase">
                        FORM
                      </td>
                    </tr>
                  );
                })}

                {/* Preloaded Dataset row */}
                <tr className="hover:bg-slate-50">
                  <td className="p-3">
                    <input type="checkbox" className="rounded border-slate-300 text-[#D71920] focus:ring-[#D71920]" />
                  </td>
                  <td className="p-3 font-medium text-slate-900">
                    Household Census Baseline 2026 Sampling Frame
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    <div>dataset_census_baseline</div>
                    <div className="text-[10px] text-slate-400">Version: 20261012</div>
                  </td>
                  <td className="p-3 text-right font-mono text-[11px] font-bold text-slate-600 uppercase">
                    DATASET
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Clean up local storage Card */}
          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-xs max-w-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Clean up local storage
            </h3>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="cleanup_opt"
                  checked={cleanupAction === 'definition_and_data'}
                  onChange={() => setCleanupAction('definition_and_data')}
                  className="text-[#D71920] focus:ring-[#D71920]"
                />
                <span>Delete definition and data</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="cleanup_opt"
                  checked={cleanupAction === 'data_only'}
                  onChange={() => setCleanupAction('data_only')}
                  className="text-[#D71920] focus:ring-[#D71920]"
                />
                <span>Delete data only</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCleanupNow}
                className="px-6 py-2.5 rounded bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
              >
                CLEAN UP NOW...
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
