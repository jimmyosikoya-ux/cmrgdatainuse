import React, { useState, useEffect } from 'react';
import {
  Shield,
  WifiOff,
  CheckCircle2,
  Layers,
  ArrowRight,
  Database,
  Smartphone,
  Cpu,
  BarChart2,
  FileCheck2,
  Sparkles,
  QrCode,
  Download,
  Lock,
  ChevronRight,
  Users,
  MapPin,
  TrendingUp,
  Sliders,
  Check,
  AlertCircle,
  FolderKanban,
  UserCheck,
  Activity
} from 'lucide-react';
import { CMRGLogo } from '../brand/CMRGLogo';
import { generateQRCodeDataUrl } from '../../lib/qr';

interface LandingPageProps {
  onOpenConsole: (initialTab?: 'design' | 'collect' | 'monitor' | 'export' | 'configure') => void;
  onLaunchMobile: () => void;
  onOpenQRModal: () => void;
  onLogin?: () => void;
  onSignUp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenConsole,
  onLaunchMobile,
  onOpenQRModal,
  onLogin,
  onSignUp,
}) => {
  const [heroQrUrl, setHeroQrUrl] = useState<string>('');
  const [activeTabFeature, setActiveTabFeature] = useState<'offline' | 'quality' | 'cases' | 'builder'>('offline');
  const [activeDropdown, setActiveDropdown] = useState<'product' | 'features' | 'solutions' | 'resources' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const directUrl = typeof window !== 'undefined'
      ? `${window.location.origin}?mode=mobile`
      : 'https://ais-dev-5qfwsip3f4ltmre5osmeqs-335003039437.europe-west3.run.app?mode=mobile';
    generateQRCodeDataUrl(directUrl).then(setHeroQrUrl);
  }, []);

  const handleGoToLogin = () => {
    if (onLogin) onLogin();
    else onOpenConsole();
  };

  const handleGoToSignUp = () => {
    if (onSignUp) onSignUp();
    else onOpenConsole();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-red-500 selection:text-white">
      {/* ================= 1. CMRG DATA COLLECT MARKETING NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-6">
          {/* Official CMRG Logo */}
          <div className="shrink-0 flex items-center">
            <CMRGLogo variant="official" size="md" />
          </div>

          {/* CMRG Main Navigation with Dropdowns */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700">
            {/* 1. Product Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('product')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-1 py-2 hover:text-[#D71920] transition-colors ${
                  activeDropdown === 'product' ? 'text-[#D71920] font-bold' : ''
                }`}
              >
                <span>Product</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'product' ? 'rotate-90 text-[#D71920]' : 'rotate-90 opacity-50'}`} />
              </button>

              {activeDropdown === 'product' && (
                <div className="absolute left-0 top-full pt-1 w-72 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1">
                    <a
                      href="#platform"
                      onClick={() => setActiveDropdown(null)}
                      className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-xs text-slate-900">Product Overview</div>
                      <div className="text-[11px] text-slate-500">End-to-end field data collection &amp; analytics</div>
                    </a>
                    <a
                      href="#how-it-works"
                      onClick={() => setActiveDropdown(null)}
                      className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-xs text-slate-900">How It Works</div>
                      <div className="text-[11px] text-slate-500">Design, collect, monitor, export &amp; configure</div>
                    </a>
                    <button
                      onClick={() => { setActiveDropdown(null); onLaunchMobile(); }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-xs text-slate-900">Mobile Survey App</div>
                      <div className="text-[11px] text-slate-500">Collect data anywhere, fully offline on Android &amp; iOS</div>
                    </button>
                    <a
                      href="#integrations"
                      onClick={() => setActiveDropdown(null)}
                      className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-xs text-slate-900">Integrations</div>
                      <div className="text-[11px] text-slate-500">Supabase, PostgreSQL, Stata, SPSS &amp; GeoJSON</div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Features Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('features')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-1 py-2 hover:text-[#D71920] transition-colors ${
                  activeDropdown === 'features' ? 'text-[#D71920] font-bold' : ''
                }`}
              >
                <span>Features</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'features' ? 'rotate-90 text-[#D71920]' : 'rotate-90 opacity-50'}`} />
              </button>

              {activeDropdown === 'features' && (
                <div className="absolute left-0 top-full pt-1 w-80 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1">
                    <a
                      href="#features"
                      onClick={() => setActiveDropdown(null)}
                      className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-xs text-slate-900">Features Overview</div>
                      <div className="text-[11px] text-slate-500">Complete enterprise field research toolset</div>
                    </a>
                    <a
                      href="#features"
                      onClick={() => { setActiveTabFeature('offline'); setActiveDropdown(null); }}
                      className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-xs text-slate-900">Advanced Offline</div>
                      <div className="text-[11px] text-slate-500">100% offline data collection without cellular signal</div>
                    </a>
                    <a
                      href="#features"
                      onClick={() => { setActiveTabFeature('builder'); setActiveDropdown(null); }}
                      className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-xs text-slate-900">AI at CMRG</div>
                      <div className="text-[11px] text-slate-500">Intelligent survey design &amp; XLSForm syntax generator</div>
                    </a>
                    <a
                      href="#case-management"
                      onClick={() => setActiveDropdown(null)}
                      className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-xs text-slate-900">Case Management</div>
                      <div className="text-[11px] text-slate-500">Longitudinal tracking, panel surveys &amp; visit assignments</div>
                    </a>
                    <a
                      href="#data-quality"
                      onClick={() => setActiveDropdown(null)}
                      className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-xs text-slate-900">Data Quality Tools</div>
                      <div className="text-[11px] text-slate-500">Automated Z-score outlier flags &amp; speed monitoring</div>
                    </a>
                    <a
                      href="#features"
                      onClick={() => setActiveDropdown(null)}
                      className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-xs text-slate-900">Survey Security</div>
                      <div className="text-[11px] text-slate-500">Client-side RSA 2048 encryption &amp; SOC2 standards</div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Solutions */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('solutions')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-1 py-2 hover:text-[#D71920] transition-colors ${
                  activeDropdown === 'solutions' ? 'text-[#D71920] font-bold' : ''
                }`}
              >
                <span>Solutions</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'solutions' ? 'rotate-90 text-[#D71920]' : 'rotate-90 opacity-50'}`} />
              </button>

              {activeDropdown === 'solutions' && (
                <div className="absolute left-0 top-full pt-1 w-72 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1">
                    <a href="#platform" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-lg hover:bg-slate-50">
                      <div className="font-bold text-xs text-slate-900">Global Academic Research</div>
                      <div className="text-[11px] text-slate-500">Universities, RCTs &amp; econometric evaluations</div>
                    </a>
                    <a href="#platform" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-lg hover:bg-slate-50">
                      <div className="font-bold text-xs text-slate-900">Remote Household Surveys</div>
                      <div className="text-[11px] text-slate-500">Census, living standards &amp; WASH modules</div>
                    </a>
                    <a href="#platform" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-lg hover:bg-slate-50">
                      <div className="font-bold text-xs text-slate-900">Health &amp; Population</div>
                      <div className="text-[11px] text-slate-500">Epidemiology, clinics &amp; longitudinal panels</div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Platform Access */}
            <a
              href="#platform-access"
              className="py-2 hover:text-[#D71920] transition-colors font-semibold"
            >
              Platform Access
            </a>

            {/* 5. Resources */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('resources')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-1 py-2 hover:text-[#D71920] transition-colors ${
                  activeDropdown === 'resources' ? 'text-[#D71920] font-bold' : ''
                }`}
              >
                <span>Resources</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'resources' ? 'rotate-90 text-[#D71920]' : 'rotate-90 opacity-50'}`} />
              </button>

              {activeDropdown === 'resources' && (
                <div className="absolute right-0 top-full pt-1 w-64 z-50">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1">
                    <button
                      onClick={() => { setActiveDropdown(null); onOpenQRModal(); }}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50"
                    >
                      <div className="font-bold text-xs text-slate-900">Pair Mobile Device (QR)</div>
                      <div className="text-[11px] text-slate-500">Scan code to open on any field phone</div>
                    </button>
                    <a href="#data-quality" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-lg hover:bg-slate-50">
                      <div className="font-bold text-xs text-slate-900">Leaflet Mapping Reference</div>
                      <div className="text-[11px] text-slate-500">GPS spatial cluster inspection</div>
                    </a>
                    <a href="#how-it-works" onClick={() => setActiveDropdown(null)} className="block p-2.5 rounded-lg hover:bg-slate-50">
                      <div className="font-bold text-xs text-slate-900">Stata &amp; SPSS Integration</div>
                      <div className="text-[11px] text-slate-500">Automated syntax scripts &amp; codebooks</div>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Buttons (Log In, Sign Up / Start Trial) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Mobile App launcher */}
            <button
              onClick={onLaunchMobile}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              title="Launch Mobile Collector Preview"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#D71920]" />
              <span>Collect App</span>
            </button>

            {/* LOG IN */}
            <button
              onClick={handleGoToLogin}
              className="px-3.5 py-2 text-xs font-bold text-slate-800 hover:text-[#D71920] uppercase tracking-wider transition-colors whitespace-nowrap"
            >
              Log In
            </button>

            {/* SIGN UP / START FREE TRIAL */}
            <button
              onClick={handleGoToSignUp}
              className="px-4 py-2 text-xs font-bold text-white bg-[#D71920] hover:bg-[#b91c1c] rounded-lg transition-colors shadow-sm whitespace-nowrap uppercase tracking-wider"
            >
              Sign Up
            </button>

            {/* Direct Console Access link */}
            <button
              onClick={() => onOpenConsole()}
              className="hidden xl:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-black bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              title="Enter Web Console & Monitor"
            >
              <span>Console</span>
              <ArrowRight className="w-3 h-3 text-[#D71920]" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= 2. HERO SECTION (MATCHING IMAGE 3) ================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-24 bg-gradient-to-b from-white via-slate-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content matching Image 3 */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.08] text-balance">
                  Every moment.<br />
                  <span className="text-red-600">Every response.</span><br />
                  Powerful decisions.
                </h1>
                <p className="text-sm font-bold tracking-wider text-slate-500 uppercase">
                  Phone Survey & Questionnaire Platform
                </p>
                <p className="text-base text-slate-600 leading-relaxed max-w-lg">
                  CMRG Ltd empowers research organizations, NGOs, and field teams to collect complex household survey data in remote areas with zero cell connectivity, automated statistical outlier checks, and secure PostgreSQL sync.
                </p>
              </div>

              {/* QR Code Scan Block matching Image 3 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm max-w-md">
                <div
                  onClick={onOpenQRModal}
                  className="cursor-pointer shrink-0 relative group p-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-red-500 transition-colors"
                >
                  {heroQrUrl ? (
                    <img
                      src={heroQrUrl}
                      alt="Scan QR code for CMRG Collect mobile app"
                      className="w-24 h-24 rounded-lg block"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-red-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Enlarge
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                    Scan QR Code
                  </span>
                  <p className="text-xs text-slate-500 leading-normal">
                    Scan with any smartphone camera to open the offline mobile survey collector instantly.
                  </p>
                  <button
                    onClick={onLaunchMobile}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                  >
                    <span>Or launch in-browser mobile simulator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onOpenConsole()}
                  className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <span>Launch CMRG Console</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onLaunchMobile}
                  className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4 text-red-600" />
                  <span>Test Collector Offline</span>
                </button>
              </div>
            </div>

            {/* Right Multi-Device Mockup Showcase matching Image 3 */}
            <div className="lg:col-span-7 relative flex items-center justify-center">
              {/* Desktop Screen Mockup */}
              <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden">
                {/* Window Chrome */}
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 ml-2">cmrg-cloud.vault/overview</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    RLS Active
                  </div>
                </div>

                {/* Dashboard Screen Content from Image 3 */}
                <div className="p-5 bg-slate-50/60 space-y-4">
                  {/* Top Stats Strip */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Projects</span>
                      <span className="text-xl font-bold text-slate-900 tabular-nums">24</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Active</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Responses</span>
                      <span className="text-xl font-bold text-slate-900 tabular-nums">6,782</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Total</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Completion Rate</span>
                      <span className="text-xl font-bold text-slate-900 tabular-nums">98%</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Average</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Devices</span>
                      <span className="text-xl font-bold text-slate-900 tabular-nums">3</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Registered</span>
                    </div>
                  </div>

                  {/* Trend chart representation matching Image 3 line graph */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Responses Over Time</span>
                      <span className="text-slate-400 font-mono text-[10px]">Oct 2026</span>
                    </div>
                    <div className="h-28 w-full flex items-end gap-2 pt-4">
                      {[40, 55, 35, 70, 85, 60, 95, 80, 110, 125, 90, 140, 160].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-red-500/80 rounded-t hover:bg-red-600 transition-colors"
                            style={{ height: `${(val / 160) * 80}px` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Mobile Phone Preview from Image 3 */}
              <div className="hidden sm:block absolute -bottom-8 -right-4 w-52 bg-slate-900 text-white rounded-3xl p-3 border-4 border-slate-800 shadow-2xl">
                <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-2.5" />
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-bold text-white">Household Survey</span>
                    <span className="text-emerald-400">● Offline</span>
                  </div>
                  <p className="text-slate-300 font-semibold leading-tight">
                    What is the main source of drinking water?
                  </p>
                  <div className="space-y-1">
                    {['Piped water', 'Borehole', 'Protected well', 'Rainwater'].map((src, i) => (
                      <div
                        key={src}
                        className={`p-1.5 rounded border text-[9px] ${
                          i === 1 ? 'border-red-500 bg-red-950/40 text-red-200' : 'border-slate-700 text-slate-400'
                        }`}
                      >
                        {src}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 pt-1">
                    <button className="flex-1 py-1 rounded bg-slate-800 text-slate-300 text-[9px]">Back</button>
                    <button className="flex-1 py-1 rounded bg-red-600 text-white text-[9px] font-bold">Next</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 3. FOUR PILLARS BANNER (MATCHING IMAGE 3 EXACTLY) ================= */}
      <section className="bg-slate-950 text-white py-12 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Pillar 1 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-900/40 text-red-400 flex items-center justify-center shrink-0 border border-red-800/50">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white">High-Quality Data</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Capture precise, consistent, and reliable data in any environment with automated statistical checks.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-900/40 text-red-400 flex items-center justify-center shrink-0 border border-red-800/50">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white">Custom Workflows</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Build tailored forms and intelligent workflows with dynamic skip logic that match your field process.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-900/40 text-red-400 flex items-center justify-center shrink-0 border border-red-800/50">
                <WifiOff className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white">Reach Everywhere</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Collect data offline or online—anytime, anywhere. Zero data loss in remote areas without signal.
                </p>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-900/40 text-red-400 flex items-center justify-center shrink-0 border border-red-800/50">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-white">All Devices. One Platform.</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Seamless experience across desktop console, field tablets, and mobile smartphones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. FEATURE SHOWCASES ================= */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              Enterprise Field Capabilities
            </span>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight text-balance">
              Built Specifically for Complex Rural Household Research
            </h2>
            <p className="text-sm text-slate-600">
              Everything required to author, deploy, verify, and analyze high-stakes field surveys without depending on expensive closed ecosystems.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTabFeature('offline')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTabFeature === 'offline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Advanced Offline
              </button>
              <button
                onClick={() => setActiveTabFeature('quality')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTabFeature === 'quality' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Data Quality & Auditing
              </button>
              <button
                onClick={() => setActiveTabFeature('cases')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTabFeature === 'cases' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Longitudinal Case Management
              </button>
              <button
                onClick={() => setActiveTabFeature('builder')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTabFeature === 'builder' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Visual Studio & AI
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
            {activeTabFeature === 'offline' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                    Zero-Connectivity Guarantee
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">
                    True Offline-First Field Execution
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    CMRG Collect operates completely independent of cellular networks. Complete entire multi-hour household interviews, capture high-accuracy GPS coordinates, store dwelling photos, and gather digital signatures directly in local encrypted device memory.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Automatic differential sync queue when connectivity returns</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>PWA installability on any Android or iOS device</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Zero lost surveys even if phone battery dies mid-interview</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-900 rounded-xl p-6 text-white space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                    <span>CMRG-STORAGE-REPLICA</span>
                    <span className="text-emerald-400">● 100% STORED LOCALLY</span>
                  </div>
                  <p className="text-slate-300">
                    &gt; Geolocation fix: lat -18.9721, lng 32.6519 (± 3.8m)<br />
                    &gt; Dwelling photo: captured (1.2 MB compressed)<br />
                    &gt; Digital signature token: SHA-256 verified<br />
                    &gt; Submissions pending background sync: 0 (Synced to Vault)
                  </p>
                </div>
              </div>
            )}

            {activeTabFeature === 'quality' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                    Live Anomaly Detection
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">
                    Catch Field Errors in Real Time
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Prevent bad data from contaminating your research. Automated statistical outlier filters immediately detect unrealistic responses (such as household member counts &gt; 20), surveyor speed anomalies (&lt; 60 seconds), and GPS drift beyond village cluster borders.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Automated Z-score outlier flagging on continuous metrics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Speed audit timers to identify enumerator guessing or rush-throughs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Supervisor Approve / Reject / Re-visit workflow</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>Active Monitor Outlier Alert</span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium bg-white p-3 rounded-lg border border-amber-200">
                    &quot;The value &apos;23&apos; for the submission with ID sub-cmrg-8f12-001 is an outlier in the field num_in_hh (Mean: 5.62, SD: 3.76)&quot;
                  </p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-semibold">Approve</button>
                    <button className="px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-semibold">Flag for Re-visit</button>
                  </div>
                </div>
              </div>
            )}

            {activeTabFeature === 'cases' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                    Longitudinal Tracking
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">
                    Panel Survey & Case Management
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Track individual households across multiple enumeration rounds. Field enumerators can filter by their assigned cases on mobile, review baseline family members, and update visit histories even while in remote valleys.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Case status workflows: Unvisited, In Progress, Completed, Follow-up</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Preload baseline census IDs, head names, and phone numbers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Assign cases dynamically to specific field teams</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                    <span>HH-2026-081 · Tendai Mutasa</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">Completed</span>
                  </div>
                  <p className="text-xs text-slate-600">Village: Muchena · Assigned to: Amina Khumalo</p>
                  <p className="text-xs text-slate-500 font-mono">Target: 2026-10-14 · Baseline members: 6</p>
                </div>
              </div>
            )}

            {activeTabFeature === 'builder' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                    Form Studio & Intelligence
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">
                    Visual Form Studio & AI Questionnaire Generator
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Design complex logic without writing complicated XML. Use our AI Assistant to generate questionnaire modules with standardized variable names, validation constraints, and household roster repeat groups.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Drag-and-drop question builder with real-time mobile preview</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Household member rosters (repeat groups)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Export to ODK / XLSForm / JSON formats</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-900 rounded-xl p-5 text-white space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-red-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Assistant Module Generator</span>
                  </div>
                  <p className="text-slate-300">
                    Topic: &quot;Rural Water Quality & Sanitation (WASH)&quot;<br />
                    Generated: 7 Questions with GPS geopoint, skip logic on water source, and verbal consent audio clip.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= 5. CMRG COLLECT PLATFORM ACCESS ================= */}
      <section id="platform-access" className="py-20 bg-slate-50 border-t border-slate-200 relative scroll-mt-20">
        {/* Anchor alias to ensure existing links/bookmarks to #pricing scroll cleanly */}
        <div id="pricing" className="absolute -top-20 left-0 w-0 h-0 opacity-0 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-[#D71920] text-xs font-bold tracking-wide uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>CMRG Collect Platform Access</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              CMRG Collect — One Platform. Every Research Project.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              A centralized data collection platform designed to support CMRG research projects, field enumerators, and administrators through secure project management, offline-first mobile data collection, and centralized fieldwork monitoring.
            </p>
          </div>

          {/* Four Enterprise Platform Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Project Management */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D71920] flex items-center justify-center font-bold">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Core Capability
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Project Management
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Create and manage research projects, build and organize questionnaires, assign field enumerators, and oversee project activities from one central dashboard.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Visual Form Studio with skip logic &amp; validation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Multi-round survey &amp; questionnaire catalog</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Field cluster &amp; enumerator roster assignments</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenConsole('design')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Open Project Console</span>
                  <ArrowRight className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>

            {/* Card 2: Offline Field Data Collection */}
            <div className="bg-white rounded-2xl p-6 border-2 border-red-500/80 shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between space-y-6 relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                    Offline-First
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Offline Field Data Collection
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Collect survey responses on mobile devices, save drafts locally, and synchronize queued submissions when internet connectivity becomes available. Preserve existing QR-code installation and project-access workflows.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>100% offline data capture without mobile signal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Hardware GPS geopoint, audio audit &amp; photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Automatic background sync when connectivity resumes</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={onLaunchMobile}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile Survey App</span>
                </button>
                <button
                  onClick={onOpenQRModal}
                  className="w-full py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 border border-slate-200"
                >
                  <QrCode className="w-3 h-3 text-red-600" />
                  <span>Pair Device via QR Code</span>
                </button>
              </div>
            </div>

            {/* Card 3: Staff & Access Management */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5 text-[#D71920]" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Role-Based Access
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Staff &amp; Access Management
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Provide role-based access for administrators, supervisors, and authorized enumerators. Support staff approval, project assignments, and appropriate permissions according to the existing backend implementation.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Administrator, Supervisor &amp; Enumerator tiers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Enumerators approval &amp; device identity verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Secure tokenized project assignment keys</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenConsole('configure')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>Staff &amp; Permissions</span>
                </button>
              </div>
            </div>

            {/* Card 4: Research Monitoring & Data Management */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D71920] flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Field Intelligence
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Research Monitoring &amp; Data Management
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Give authorized project managers visibility into submission activity, synchronization status, project progress, and available survey data with options to review, inspect, and export collected records.
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Interactive Leaflet GIS map with rooftop verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Statistical outlier flags &amp; interview speed tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Export to Stata, SPSS, CSV &amp; PostgreSQL/Supabase</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenConsole('monitor')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Research Monitoring</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enterprise Institutional Platform Notice */}
          <div className="mt-12 bg-white p-5 rounded-2xl border border-slate-200/90 max-w-4xl mx-auto shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D71920] flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-xs">
                  Dedicated Institutional Field Research Infrastructure
                </div>
                <div className="text-[11px] text-slate-500">
                  Platform access is provisioned for CMRG project personnel, authorized enumerators, and research supervisors.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenConsole('design')}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                Project Console
              </button>
              <button
                onClick={onLaunchMobile}
                className="px-3.5 py-2 rounded-lg bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile App</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 6. QUIET FOOTER ================= */}
      <footer className="bg-white border-t border-slate-200 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <CMRGLogo variant="official" />
            <p className="max-w-xs text-[11px] text-slate-500">
              Enterprise Field Data Collection Platform for high-precision remote surveys and longitudinal research.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <span>SOC2 Type II Certified</span>
            <span>·</span>
            <span>GDPR DPA Compliant</span>
            <span>·</span>
            <span>End-to-End RSA 2048-bit</span>
            <span>·</span>
            <span>© 2026 CMRG Ltd. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
