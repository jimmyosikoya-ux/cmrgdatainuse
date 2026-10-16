import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  LayoutDashboard,
  Globe,
  QrCode,
  Maximize2,
  Minimize2,
  Lock,
  ArrowLeft,
  Layers,
  ChevronUp,
  X
} from 'lucide-react';
import { LandingPage } from './components/landing/LandingPage';
import { ConsoleLayout } from './components/console/ConsoleLayout';
import { MobileCollectorApp } from './components/mobile/MobileCollectorApp';
import { AuthPage } from './components/auth/AuthPage';
import { QRScannerModal } from './components/qr/QRScannerModal';
import { CMRGStorage } from './lib/storage';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'console' | 'mobile' | 'auth'>('landing');
  const [authInitialStep, setAuthInitialStep] = useState<'login' | 'signup'>('login');
  const [mobileFormId, setMobileFormId] = useState<string>('form_hh_round2');
  const [mobileCaseId, setMobileCaseId] = useState<string | undefined>(undefined);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [activeUser, setActiveUser] = useState(() => CMRGStorage.getActiveUser());
  const [showQuickNav, setShowQuickNav] = useState<boolean>(false);
  const [consoleTab, setConsoleTab] = useState<'design' | 'collect' | 'monitor' | 'export' | 'configure'>('design');

  const handleOpenConsole = (tab?: 'design' | 'collect' | 'monitor' | 'export' | 'configure') => {
    if (tab) setConsoleTab(tab);
    setCurrentView('console');
  };

  useEffect(() => {
    CMRGStorage.initialize();
    setActiveUser(CMRGStorage.getActiveUser());

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'mobile') {
      setCurrentView('mobile');
      setIsPhoneFrame(false);
      if (params.get('form')) {
        setMobileFormId(params.get('form')!);
      }
      if (params.get('case')) {
        setMobileCaseId(params.get('case')!);
      }
    } else if (params.get('mode') === 'console') {
      setCurrentView('console');
    } else if (params.get('mode') === 'auth' || params.get('mode') === 'login') {
      setAuthInitialStep('login');
      setCurrentView('auth');
    } else if (params.get('mode') === 'signup') {
      setAuthInitialStep('signup');
      setCurrentView('auth');
    } else {
      setCurrentView('landing');
    }
  }, []);

  const handleLaunchMobile = (formId: string = 'form_hh_round2', caseId?: string) => {
    setMobileFormId(formId);
    setMobileCaseId(caseId);
    setCurrentView('mobile');
  };

  const handleOpenAuth = (step: 'login' | 'signup') => {
    setAuthInitialStep(step);
    setCurrentView('auth');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#111111] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ================= PRIMARY SCREEN ROUTER ================= */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 1. MARKETING WEBSITE FRONTEND (CMRG Data Collect Primary Public Experience) */}
        {currentView === 'landing' && (
          <div className="flex-1 overflow-y-auto bg-white text-slate-900">
            <LandingPage
              onOpenConsole={(tab) => handleOpenConsole(tab)}
              onLaunchMobile={() => handleLaunchMobile('form_hh_round2')}
              onOpenQRModal={() => setIsQRModalOpen(true)}
              onLogin={() => handleOpenAuth('login')}
              onSignUp={() => handleOpenAuth('signup')}
            />
          </div>
        )}

        {/* 2. AUTHENTICATION FRONTEND (Dedicated Login / Sign Up Experience) */}
        {currentView === 'auth' && (
          <div className="flex-1 overflow-y-auto bg-[#f8f9fa]">
            <AuthPage
              initialStep={authInitialStep}
              onBackToLanding={() => setCurrentView('landing')}
              onSuccess={(user) => {
                setActiveUser(user);
                setCurrentView('console');
              }}
              onExploreAsGuest={() => setCurrentView('console')}
            />
          </div>
        )}

        {/* 3. WEB SERVER CONSOLE & MONITOR FRONTEND */}
        {currentView === 'console' && (
          <div className="flex-1 overflow-hidden bg-slate-100 text-slate-900">
            <ConsoleLayout
              onBackToLanding={() => setCurrentView('landing')}
              onLaunchMobile={(formId, caseId) => handleLaunchMobile(formId, caseId)}
              onOpenQRModal={() => setIsQRModalOpen(true)}
              onLogout={() => handleOpenAuth('login')}
              initialTab={consoleTab}
            />
          </div>
        )}

        {/* 4. MOBILE SURVEY COLLECTOR FRONTEND (Fieldworker App) */}
        {currentView === 'mobile' && (
          <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-4 overflow-y-auto relative">
            {/* Top Minimal Field Device Bar */}
            <div className="w-full max-w-[420px] px-3 py-2 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <button
                onClick={() => setCurrentView('console')}
                className="flex items-center gap-1.5 hover:text-white transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Console</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPhoneFrame(!isPhoneFrame)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
                  title="Toggle Phone Frame Bezel"
                >
                  {isPhoneFrame ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                  <span className="text-[11px]">{isPhoneFrame ? 'Full' : 'Frame'}</span>
                </button>

                <button
                  onClick={() => setIsQRModalOpen(true)}
                  className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition-colors flex items-center gap-1 text-[11px]"
                >
                  <QrCode className="w-3 h-3" />
                  <span>Pair</span>
                </button>
              </div>
            </div>

            {isPhoneFrame ? (
              /* Realistic Smartphone Bezel Mockup on Desktop */
              <div className="w-full max-w-[390px] h-[780px] max-h-[90vh] bg-black rounded-[42px] p-2.5 shadow-2xl border-4 border-slate-700 relative flex flex-col shrink-0 my-auto">
                {/* Dynamic Island / Notch */}
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-1.5 shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
                  <div className="w-8 h-1 rounded-full bg-slate-700" />
                </div>

                {/* Inner Screen */}
                <div className="flex-1 rounded-[30px] overflow-hidden flex flex-col bg-[#f0f4f8]">
                  <MobileCollectorApp
                    initialFormId={mobileFormId}
                    initialCaseId={mobileCaseId}
                    onExit={() => setCurrentView('console')}
                    isEmbedded={true}
                  />
                </div>

                {/* Bottom Home Indicator */}
                <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-2 shrink-0" />
              </div>
            ) : (
              /* Full Screen Collector */
              <div className="w-full h-full flex flex-col">
                <MobileCollectorApp
                  initialFormId={mobileFormId}
                  initialCaseId={mobileCaseId}
                  onExit={() => setCurrentView('console')}
                  isEmbedded={false}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= SUBTLE FLOATING QUICK NAVIGATOR ================= */}
      {/* Discreet floating pill at bottom-right for instant switching during evaluation without cluttering the UI */}
      <div className="fixed bottom-4 right-4 z-50 select-none">
        {showQuickNav ? (
          <div className="bg-[#111111] text-white rounded-2xl shadow-2xl border border-slate-800 p-3 w-64 space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-500">
                CMRG Quick Switcher
              </span>
              <button
                onClick={() => setShowQuickNav(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <button
                onClick={() => { setCurrentView('landing'); setShowQuickNav(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                  currentView === 'landing' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Marketing Website</span>
                </div>
                {currentView === 'landing' && <span className="text-[10px]">Active</span>}
              </button>

              <button
                onClick={() => { setCurrentView('console'); setShowQuickNav(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                  currentView === 'console' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Web Console &amp; Monitor</span>
                </div>
                {currentView === 'console' && <span className="text-[10px]">Active</span>}
              </button>

              <button
                onClick={() => { handleLaunchMobile(); setShowQuickNav(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                  currentView === 'mobile' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Collect Mobile App</span>
                </div>
                {currentView === 'mobile' && <span className="text-[10px]">Active</span>}
              </button>

              <button
                onClick={() => { handleOpenAuth('login'); setShowQuickNav(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                  currentView === 'auth' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In / Sign Up</span>
                </div>
                {currentView === 'auth' && <span className="text-[10px]">Active</span>}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowQuickNav(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111111]/90 hover:bg-black text-white text-xs font-semibold shadow-lg border border-slate-700/60 backdrop-blur-sm transition-transform hover:scale-105"
            title="Switch frontend view (Marketing, Console, Mobile, Auth)"
          >
            <Layers className="w-3.5 h-3.5 text-[#D71920]" />
            <span className="text-[11px] tracking-wide">Frontend Switcher</span>
            <ChevronUp className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {/* Scannable Pairing QR Code Modal */}
      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onLaunchMobile={() => handleLaunchMobile('form_hh_round2')}
        formId={mobileFormId}
        caseId={mobileCaseId}
      />
    </div>
  );
}
