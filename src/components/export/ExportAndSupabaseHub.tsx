import React, { useState } from 'react';
import {
  Download,
  Database,
  Shield,
  FileCode,
  Key,
  Check,
  Copy,
  Server,
  Lock,
  ExternalLink,
  Code2,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { generatePostgreSqlSchema, generateStataSyntax, generateSpssSyntax, testSupabaseConnection } from '../../lib/supabase';
import { CMRGStorage, SupabaseConfig } from '../../lib/storage';

export const ExportAndSupabaseHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exports' | 'supabase_sql' | 'cost_report'>('exports');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [copiedStata, setCopiedStata] = useState<boolean>(false);
  const [copiedSpss, setCopiedSpss] = useState<boolean>(false);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => CMRGStorage.getSupabaseConfig());
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string; latencyMs: number } | null>(null);

  const submissions = CMRGStorage.getSubmissions('form_hh_round2');

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    const result = await testSupabaseConnection(supabaseConfig.url, supabaseConfig.anon_key);
    setIsTestingConnection(false);
    setConnectionTestResult(result);
    setSupabaseConfig(CMRGStorage.getSupabaseConfig());
  };

  const handleDownloadCsv = () => {
    const headers = [
      'submission_id',
      'case_id',
      'form_id',
      'respondent_name',
      'dwelling_condition',
      'water_source',
      'water_distance_minutes',
      'num_in_hh',
      'primary_income',
      'duration_seconds',
      'gps_lat',
      'gps_lng',
      'gps_accuracy',
      'enumerator_name',
      'status',
      'created_at'
    ];

    const rows = submissions.map(s => [
      `"${s.id}"`,
      `"${s.case_id || ''}"`,
      `"${s.form_id}"`,
      `"${(s.data?.respondent_name || '').replace(/"/g, '""')}"`,
      `"${s.data?.dwelling_condition || ''}"`,
      `"${s.data?.water_source || ''}"`,
      s.data?.water_distance_minutes || 0,
      s.data?.num_in_hh || 0,
      `"${(s.data?.primary_income_source || '').replace(/"/g, '""')}"`,
      s.metadata?.duration_seconds || 0,
      s.gps_location?.lat || '',
      s.gps_location?.lng || '',
      s.gps_location?.accuracy || '',
      `"${(s.enumerator_name || '').replace(/"/g, '""')}"`,
      `"${s.status}"`,
      `"${s.created_at}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cmrg_field_survey_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadXlsx = () => {
    // SpreadsheetML (XML Excel workbook compatible with MS Excel, LibreOffice, and Google Sheets)
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#111111" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Submissions">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Submission ID</Data></Cell>
    <Cell><Data ss:Type="String">Case ID</Data></Cell>
    <Cell><Data ss:Type="String">Respondent Name</Data></Cell>
    <Cell><Data ss:Type="String">Dwelling Condition</Data></Cell>
    <Cell><Data ss:Type="String">Water Source</Data></Cell>
    <Cell><Data ss:Type="String">Minutes to Water</Data></Cell>
    <Cell><Data ss:Type="String">Household Size</Data></Cell>
    <Cell><Data ss:Type="String">Interview Duration (s)</Data></Cell>
    <Cell><Data ss:Type="String">GPS Latitude</Data></Cell>
    <Cell><Data ss:Type="String">GPS Longitude</Data></Cell>
    <Cell><Data ss:Type="String">GPS Accuracy (m)</Data></Cell>
    <Cell><Data ss:Type="String">Enumerator</Data></Cell>
    <Cell><Data ss:Type="String">Review Status</Data></Cell>
    <Cell><Data ss:Type="String">Submission Timestamp</Data></Cell>
   </Row>`;

    submissions.forEach(s => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${s.id}</Data></Cell>
    <Cell><Data ss:Type="String">${s.case_id || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${s.data?.respondent_name || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${s.data?.dwelling_condition || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${s.data?.water_source || ''}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.data?.water_distance_minutes || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.data?.num_in_hh || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.metadata?.duration_seconds || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.gps_location?.lat || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.gps_location?.lng || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.gps_location?.accuracy || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${s.enumerator_name}</Data></Cell>
    <Cell><Data ss:Type="String">${s.status}</Data></Cell>
    <Cell><Data ss:Type="String">${s.created_at}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cmrg_household_survey_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadGeoJson = () => {
    const withGps = submissions.filter(s => s.gps_location?.lat && s.gps_location?.lng);
    const geojson = {
      type: 'FeatureCollection',
      features: withGps.map(s => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [s.gps_location!.lng, s.gps_location!.lat]
        },
        properties: {
          id: s.id,
          case_id: s.case_id,
          respondent: s.data?.respondent_name,
          household_size: s.data?.num_in_hh,
          water_source: s.data?.water_source,
          enumerator: s.enumerator_name,
          status: s.status,
          accuracy_meters: s.gps_location?.accuracy,
          created_at: s.created_at
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cmrg_geopoints_${Date.now()}.geojson`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 select-none overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900">Export &amp; Supabase Vault Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical package exports, PostgreSQL RLS schema, live database connectivity, and CMRG cost optimization
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('exports')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'exports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data Exports ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('supabase_sql')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'supabase_sql' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Supabase Connection &amp; DDL
          </button>
          <button
            onClick={() => setActiveTab('cost_report')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'cost_report' ? 'bg-white text-[#D71920] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cost-Control Report</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* ================= TAB 1: DATA EXPORTS ================= */}
        {activeTab === 'exports' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CSV Export Card */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">CSV &amp; Flat Delimited</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Standard comma-separated table with clean column headers, verified types, and interview metadata.
                  </p>
                </div>
                <button
                  onClick={handleDownloadCsv}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV ({submissions.length} Records)</span>
                </button>
              </div>

              {/* XLSX Export Card */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Excel Workbook (.xls / .xlsx)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Formatted multi-column workbook with native numeric and date types for Microsoft Excel &amp; Google Sheets.
                  </p>
                </div>
                <button
                  onClick={handleDownloadXlsx}
                  className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel Workbook</span>
                </button>
              </div>

              {/* GeoJSON Map Export Card */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-[#D71920] flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">GeoJSON GIS Layer</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Geospatial Point features with attributes for direct import into QGIS, ArcGIS, or Mapbox.
                  </p>
                </div>
                <button
                  onClick={handleDownloadGeoJson}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#D71920] hover:bg-[#b91c1c] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download GeoJSON GIS Points</span>
                </button>
              </div>

              {/* Stata Syntax Script Card */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Stata Syntax Script (.do)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Stata command syntax with variable labels, value codes, outlier flags, and summary distributions.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const syntax = generateStataSyntax('Household listing - round 2');
                    navigator.clipboard.writeText(syntax);
                    setCopiedStata(true);
                    setTimeout(() => setCopiedStata(false), 2000);
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedStata ? 'Copied Stata Syntax!' : 'Copy Stata .do Syntax'}</span>
                </button>
              </div>

              {/* SPSS Syntax Script Card */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 md:col-span-2">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">SPSS Processing Syntax (.sps)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Standard IBM SPSS syntax with data type definitions, variable labels, and frequency tables.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const syntax = generateSpssSyntax('Household listing - round 2');
                    navigator.clipboard.writeText(syntax);
                    setCopiedSpss(true);
                    setTimeout(() => setCopiedSpss(false), 2000);
                  }}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer max-w-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSpss ? 'Copied SPSS Syntax!' : 'Copy SPSS .sps Syntax'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: SUPABASE SQL & CONFIG ================= */}
        {activeTab === 'supabase_sql' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Live Connection Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full ${supabaseConfig.is_connected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Supabase Primary Backend Connection
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enforces server-side authentication, Row-Level Security (RLS), and Postgres data storage
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  supabaseConfig.is_connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {supabaseConfig.is_connected ? 'VERIFIED CONNECTED' : 'UNVERIFIED / PENDING TEST'}
                </span>
              </div>

              <form onSubmit={handleTestConnection} className="space-y-3 text-xs pt-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supabase Project URL</label>
                  <input
                    type="url"
                    value={supabaseConfig.url}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:bg-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Public Anon Key (Client Safe)</label>
                  <input
                    type="text"
                    value={supabaseConfig.anon_key}
                    onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anon_key: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:bg-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    disabled={isTestingConnection}
                    className="px-4 py-2 bg-[#D71920] hover:bg-[#b91c1c] text-white rounded font-bold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                    <span>{isTestingConnection ? 'Verifying Network & API...' : 'Test & Verify Supabase Connection'}</span>
                  </button>

                  {supabaseConfig.last_tested_at && (
                    <span className="text-slate-400 text-[11px]">
                      Last tested: {new Date(supabaseConfig.last_tested_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </form>

              {connectionTestResult && (
                <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  connectionTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {connectionTestResult.success ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{connectionTestResult.message}</p>
                    {connectionTestResult.latencyMs > 0 && (
                      <p className="text-[11px] opacity-75">Round-trip latency: {connectionTestResult.latencyMs}ms</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DDL Schema View */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">PostgreSQL 15+ Schema &amp; RLS Policies</h3>
                  <p className="text-xs text-slate-500">
                    Includes 9 CMRG operational roles, multi-tenant organization isolation, and PostGIS geocoding
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatePostgreSqlSchema());
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSql ? 'Copied DDL!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-96">
                {generatePostgreSqlSchema()}
              </pre>
            </div>
          </div>
        )}

        {/* ================= TAB 3: CMRG COST-CONTROL REPORT ================= */}
        {activeTab === 'cost_report' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Executive Cost Summary Banner */}
            <div className="bg-[#111111] text-white p-6 rounded-2xl border-t-4 border-[#D71920] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D71920] font-bold">
                  CMRG FINANCIAL EFFICIENCY SPECIFICATION
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  100% Free-Tier Compatible
                </span>
              </div>
              <h3 className="text-lg font-black text-white">
                CMRG Data Collect &middot; Lowest Practical Running Cost Strategy
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                By selecting Supabase as the primary backend and optimizing client-side image compression,
                the platform runs at <b>$0.00 / ₦0</b> during all development, pilot testing, and small-to-medium field trials.
                No recurring server charges or database license fees are incurred.
              </p>
            </div>

            {/* Comparison Table: Pilot vs Scale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pilot Card */}
              <div className="bg-white p-5 rounded-xl border-2 border-emerald-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    STAGE 1: PILOT TESTING
                  </span>
                  <span className="text-base font-black text-emerald-700">$0.00 / ₦0</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Small Field Pilot (5–25 Enumerators)</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li><b>Volume:</b> Up to 10,000 completed household surveys</li>
                  <li><b>Database:</b> Supabase Free Tier (500 MB Postgres, 50,000 MAU)</li>
                  <li><b>File Storage:</b> 1 GB included (supports ~7,000 compressed photos)</li>
                  <li><b>Bandwidth:</b> 2 GB monthly egress included</li>
                  <li><b>Monthly Cost:</b> <b>$0.00 USD (₦0 NGN)</b></li>
                  <li><b>Annual Cost:</b> <b>$0.00 USD (₦0 NGN)</b></li>
                </ul>
              </div>

              {/* Large Scale Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    STAGE 2: NATIONWIDE ROLLOUT
                  </span>
                  <span className="text-base font-black text-slate-900">$25.00 / ₦38,750 /mo</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Large-Scale CMRG Research (100–500 Enumerators)</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li><b>Volume:</b> 100,000+ completed household surveys</li>
                  <li><b>Database:</b> Supabase Pro Tier (8 GB Postgres, auto-scaling)</li>
                  <li><b>File Storage:</b> 100 GB storage (~700,000 compressed survey photos)</li>
                  <li><b>Bandwidth:</b> 250 GB monthly egress with daily automatic backups</li>
                  <li><b>Monthly Cost:</b> <b>$25.00 USD (~₦38,750 NGN)</b></li>
                  <li><b>Annual Cost:</b> <b>$300.00 USD (~₦465,000 NGN)</b></li>
                </ul>
              </div>
            </div>

            {/* Architectural Cost-Saving Controls */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Built-in Technical Cost-Control Safeguards
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-900 mb-1">1. Client Image Compression</p>
                  <p className="text-slate-600 text-[11px]">
                    Downscales photos to max 1280px (~100KB instead of 6MB), reducing storage utilization by 98%.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-900 mb-1">2. Offline Queue Deduplication</p>
                  <p className="text-slate-600 text-[11px]">
                    Submissions use unique UUIDs and client idempotency to prevent repeated uploads and wasted bandwidth.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-900 mb-1">3. Zero Redundant Backends</p>
                  <p className="text-slate-600 text-[11px]">
                    No duplicate database writes or overlapping storage billing across multiple cloud providers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
