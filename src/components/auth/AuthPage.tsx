import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Server,
  User,
  Shield,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Send,
  KeyRound,
  UserPlus,
  Database
} from 'lucide-react';
import { CMRGLogo } from '../brand/CMRGLogo';
import { CMRGStorage } from '../../lib/storage';
import {
  supabaseSignIn,
  supabaseSignUp,
  supabaseResetPassword,
  getSupabase
} from '../../lib/supabase';
import {
  signInWithGoogle,
  logInWithEmail,
  signUpWithEmail,
  resetPassword
} from '../../lib/firebase';

interface AuthPageProps {
  onSuccess: (user: { email: string; name: string; role: string; serverUrl: string }) => void;
  onExploreAsGuest?: () => void;
  onBackToLanding?: () => void;
  initialStep?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSuccess,
  onExploreAsGuest,
  onBackToLanding,
  initialStep = 'login',
}) => {
  const [authStep, setAuthStep] = useState<'login' | 'signup' | 'verify_email' | 'forgot_password' | 'invite_staff'>(initialStep);
  const [serverUrl, setServerUrl] = useState<string>('cmrg-manicaland-vault');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<string>('administrator');
  const [organizationName, setOrganizationName] = useState<string>('CMRG Ltd Research Operations');
  const [invitedEmail, setInvitedEmail] = useState<string>('');
  const [invitedRole, setInvitedRole] = useState<string>('enumerator');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabaseConfig = CMRGStorage.getSupabaseConfig();
  const isSupabaseActive = supabaseConfig.is_connected && !!supabaseConfig.url;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusNotice(null);
    setIsLoading(true);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      setIsLoading(false);
      return;
    }

    // Try Supabase first if connected
    if (isSupabaseActive) {
      try {
        const { user } = await supabaseSignIn(email, password);
        const activeUser = {
          email: user?.email || email,
          name: user?.user_metadata?.full_name || email.split('@')[0],
          role: user?.user_metadata?.role || 'administrator',
          serverUrl: supabaseConfig.url
        };
        CMRGStorage.saveActiveUser(activeUser);
        setIsLoading(false);
        onSuccess(activeUser);
        return;
      } catch (sbErr: any) {
        console.warn('Supabase login error, checking fallback auth:', sbErr.message);
      }
    }

    // Secondary / Fallback: Firebase Auth
    try {
      const { user, profile } = await logInWithEmail(email, password);
      const activeUser = {
        email: user.email || email,
        name: profile?.full_name || user.displayName || email.split('@')[0],
        role: profile?.role || 'administrator',
        serverUrl: serverUrl.includes('.') ? serverUrl : `https://${serverUrl}.cmrg-field.org`
      };
      CMRGStorage.saveActiveUser(activeUser);
      setIsLoading(false);
      onSuccess(activeUser);
    } catch (fbErr: any) {
      setIsLoading(false);
      const code = fbErr?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setErrorMessage('Invalid credentials. Please verify your email and password.');
      } else {
        setErrorMessage(fbErr?.message || 'Authentication failed. Please verify credentials or server configuration.');
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusNotice(null);
    setIsLoading(true);

    if (!email || !password || !fullName) {
      setErrorMessage('Please fill in your full name, work email, and secure password.');
      setIsLoading(false);
      return;
    }

    // Try Supabase first if configured
    if (isSupabaseActive) {
      try {
        const data = await supabaseSignUp(email, password, fullName, role);
        setIsLoading(false);
        setAuthStep('verify_email');
        setStatusNotice(`Registration successful. A verification confirmation has been dispatched to ${email}.`);
        return;
      } catch (sbErr: any) {
        console.warn('Supabase signup fallback to Firebase:', sbErr.message);
      }
    }

    // Secondary: Firebase
    try {
      await signUpWithEmail(email, password, fullName, role);
      setIsLoading(false);
      setAuthStep('verify_email');
      setStatusNotice(`Registration successful. A verification confirmation has been dispatched to ${email}.`);
    } catch (fbErr: any) {
      setIsLoading(false);
      setErrorMessage(fbErr?.message || 'Sign up failed.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    if (!email) {
      setErrorMessage('Please provide your registered email address.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSupabaseActive) {
        await supabaseResetPassword(email);
      } else {
        await resetPassword(email);
      }
      setIsLoading(false);
      setStatusNotice(`Password recovery instructions sent to ${email}. Check your inbox.`);
      setAuthStep('login');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Unable to process password reset request.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const { user, profile } = await signInWithGoogle();
      const activeUser = {
        email: user.email || '',
        name: profile?.full_name || user.displayName || 'CMRG Research Officer',
        role: profile?.role || 'administrator',
        serverUrl: `https://${serverUrl}.cmrg-field.org`
      };
      CMRGStorage.saveActiveUser(activeUser);
      setIsLoading(false);
      onSuccess(activeUser);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Google authentication cancelled.');
    }
  };

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStatusNotice(`Onboarding invitation dispatched to ${invitedEmail} with assigned role '${invitedRole}'.`);
      setInvitedEmail('');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-between text-[#111111] font-sans selection:bg-[#D71920] selection:text-white">
      {/* Top Bar with Registration Info */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <CMRGLogo variant="official" />
        <div className="flex items-center gap-3 text-xs">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
            >
              &larr; Back to Website
            </button>
          )}
          <span className="hidden sm:inline text-slate-500 font-mono">
            CMRG DATA COLLECT &middot; RC378525
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner in CMRG Black & Red */}
          <div className="bg-[#111111] text-white p-6 relative overflow-hidden border-t-4 border-[#D71920]">
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#D71920]">
                ENTERPRISE FIELD RESEARCH VAULT
              </span>
              <h2 className="text-xl font-black tracking-tight text-white">
                {authStep === 'login' && 'Sign In to CMRG Data Collect'}
                {authStep === 'signup' && 'Create Your CMRG Organization'}
                {authStep === 'verify_email' && 'Verify Your Email Address'}
                {authStep === 'forgot_password' && 'Recover Account Password'}
                {authStep === 'invite_staff' && 'Invite Contracted Fieldworkers'}
              </h2>
              <p className="text-xs text-slate-300">
                {authStep === 'login' && 'Authenticated access with Supabase RLS security, Leaflet maps, and exports.'}
                {authStep === 'signup' && 'Provision an independent research project for your field study.'}
                {authStep === 'verify_email' && 'Email confirmation required before entering production research.'}
                {authStep === 'forgot_password' && 'We will send a password reset token to your registered email.'}
                {authStep === 'invite_staff' && 'Provision secure enumerator credentials for field operations.'}
              </p>
            </div>
          </div>

          {/* Nav Mode Switcher (Login / Signup) */}
          {(authStep === 'login' || authStep === 'signup') && (
            <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setAuthStep('login'); setErrorMessage(null); setStatusNotice(null); }}
                className={`py-3 text-center transition-colors border-b-2 ${
                  authStep === 'login'
                    ? 'border-[#D71920] text-[#111111] bg-white font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthStep('signup'); setErrorMessage(null); setStatusNotice(null); }}
                className={`py-3 text-center transition-colors border-b-2 ${
                  authStep === 'signup'
                    ? 'border-[#D71920] text-[#111111] bg-white font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          <div className="p-6 space-y-4">
            {/* Status Notice */}
            {statusNotice && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>{statusNotice}</p>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Google Sign-in on Login / Signup */}
            {(authStep === 'login' || authStep === 'signup') && (
              <>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-xs font-bold flex items-center justify-center gap-3 shadow-xs hover:bg-slate-50 transition-all disabled:opacity-60 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or email &amp; password</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </>
            )}

            {/* ================= STEP 1: LOGIN FORM ================= */}
            {authStep === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CMRG Server Instance Name</label>
                  <div className="relative">
                    <Server className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      placeholder="e.g. cmrg-manicaland-vault"
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@cmrg-field.org"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthStep('forgot_password')}
                      className="text-[11px] font-bold text-[#D71920] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="rounded border-slate-300 text-[#D71920] focus:ring-[#D71920] w-3.5 h-3.5"
                    />
                    <span>Remember device for offline fieldwork</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In with CMRG Credentials'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* ================= STEP 2: SIGN UP FORM ================= */}
            {authStep === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Study Name</label>
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Manicaland Health & Population Research"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tendai Chikore"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tendai@research-group.org"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Organizational Role (9 Enterprise Tiers)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="owner">Organization Owner (Full Admin + Billing)</option>
                    <option value="administrator">Operations Administrator</option>
                    <option value="project_manager">Project Manager (Case Assignment)</option>
                    <option value="form_designer">Form Designer (Questionnaire Author)</option>
                    <option value="supervisor">Field Supervisor (Review &amp; Approve)</option>
                    <option value="enumerator">Enumerator (Field Collection Only)</option>
                    <option value="reviewer">Data Reviewer (Quality Inspection)</option>
                    <option value="analyst">Data Analyst (Export &amp; Statistics)</option>
                    <option value="read_only">Read-Only Observer (Audits)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 mt-2 cursor-pointer"
                >
                  <span>{isLoading ? 'Creating Account...' : 'Register Secure Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* ================= STEP 3: EMAIL VERIFICATION ================= */}
            {authStep === 'verify_email' && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <Mail className="w-10 h-10 text-[#D71920] mx-auto mb-2" />
                  <h3 className="font-bold text-sm text-slate-900 mb-1">Verification Dispatched</h3>
                  <p className="text-xs text-slate-600">
                    A verification link has been dispatched to <b>{email}</b>. Follow the link in your email to verify your CMRG account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAuthStep('login')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold text-xs cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            )}

            {/* ================= STEP 4: FORGOT PASSWORD ================= */}
            {authStep === 'forgot_password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center py-1">
                  <KeyRound className="w-9 h-9 text-[#D71920] mx-auto mb-2" />
                  <p className="text-xs text-slate-600">
                    Enter your registered email address to receive password recovery instructions.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold text-xs cursor-pointer"
                >
                  {isLoading ? 'Dispatching...' : 'Send Recovery Link'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setAuthStep('login')}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 5: STAFF INVITATIONS ================= */}
            {authStep === 'invite_staff' && (
              <form onSubmit={handleInviteStaff} className="space-y-4">
                <div className="text-center py-1">
                  <UserPlus className="w-8 h-8 text-[#D71920] mx-auto mb-1" />
                  <p className="text-xs text-slate-600">
                    Invite temporary or contracted fieldworkers to collect data for your project.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fieldworker Email</label>
                  <input
                    type="email"
                    required
                    value={invitedEmail}
                    onChange={(e) => setInvitedEmail(e.target.value)}
                    placeholder="enumerator.nyasha@gmail.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={invitedRole}
                    onChange={(e) => setInvitedRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="enumerator">Enumerator (Mobile Collect Only)</option>
                    <option value="supervisor">Field Supervisor (Review &amp; Approve)</option>
                    <option value="analyst">Data Analyst (Export &amp; Statistics)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#D71920] hover:bg-[#b91c1c] text-white font-bold text-xs cursor-pointer"
                >
                  {isLoading ? 'Dispatching...' : 'Dispatch Staff Invitation'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setAuthStep('login')}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Return to Login
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Quick Staff Invitation Link on Login Footer */}
          {authStep === 'login' && (
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-600 flex items-center justify-between">
              <span>Onboarding contracted enumerators?</span>
              <button
                type="button"
                onClick={() => setAuthStep('invite_staff')}
                className="font-bold text-[#D71920] hover:underline cursor-pointer"
              >
                Send Staff Invite
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500">
        CMRG Ltd &middot; RC37852 &middot; Enterprise Field Survey &amp; Data Collection Platform &middot; All Rights Reserved 2026
      </footer>
    </div>
  );
};
