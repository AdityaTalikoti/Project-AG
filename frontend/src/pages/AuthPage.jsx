import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from '../store/authSlice';
import PasswordInput from '../components/auth/PasswordInput';
import PhoneInput from '../components/auth/PhoneInput';
import OtpInput from '../components/auth/OtpInput';
import GoogleButton from '../components/auth/GoogleButton';
import './Auth.css';

// ── Validation helpers ──
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pwRegex = /^(?=.*[A-Z])(?=.*[$@!%*?&]).{8,}$/;
const isPhone = (v) => /^\+?\d[\d\s\-()]{6,}$/.test(v);

function BrandPanel() {
  return (
    <div className="auth-brand-panel">
      <div className="auth-brand-circles"><span /><span /><span /></div>
      <div className="auth-brand-overlay">
        <h1>ScholarSync</h1>
        <p>Your intelligent academic companion. Track progress, journal insights, and achieve your scholarly goals.</p>
      </div>
    </div>
  );
}

function AuthLogo() {
  return (
    <div className="auth-logo">
      <div className="auth-logo-icon">S</div>
      <span className="auth-logo-text">ScholarSync</span>
    </div>
  );
}

function AuthFooter() {
  return (
    <footer className="auth-footer">
      By continuing you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
    </footer>
  );
}

// ── Error icon for inline msgs ──
const ErrIcon = () => <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
const BackArrow = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;

// ═══════════════════════════════════
//  SIGN UP VIEW
// ═══════════════════════════════════
function SignUpView({ onSwitch, initialEmail = '' }) {
  const [form, setForm] = useState({ first: '', last: '', email: initialEmail, phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [banner, setBanner] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: typeof e === 'string' ? e : e.target.value }));
  const touch = (k) => () => { setTouched(p => ({ ...p, [k]: true })); validate(k, form[k]); };

  const validate = useCallback((field, val) => {
    setErrors(prev => {
      const e = { ...prev };
      if (field === 'first') e.first = val.trim() ? '' : 'First name is required';
      if (field === 'last') e.last = val.trim() ? '' : 'Last name is required';
      if (field === 'email') e.email = !val.trim() ? 'Email is required' : !emailRegex.test(val) ? 'Enter a valid email' : '';
      if (field === 'phone') e.phone = !val ? 'Phone number is required' : val.replace(/\D/g, '').length < 7 ? 'Enter a valid number' : '';
      if (field === 'password') e.password = !val ? 'Password is required' : !pwRegex.test(val) ? '8+ chars, 1 uppercase & 1 special ($@!%*?&)' : '';
      return e;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    ['first', 'last', 'email', 'phone', 'password'].forEach(k => validate(k, form[k]));
    setTouched({ first: true, last: true, email: true, phone: true, password: true });
    const hasErr = !form.first.trim() || !form.last.trim() || !emailRegex.test(form.email) || form.phone.replace(/\D/g, '').length < 7 || !pwRegex.test(form.password);
    if (hasErr) return;

    setLoading(true);
    setBanner('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `${form.first.trim()} ${form.last.trim()}`,
          email: form.email.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner(data.message || 'Signup failed');
        setLoading(false);
        return;
      }
      // Success — refresh auth state and navigate
      await dispatch(fetchCurrentUser());
      navigate('/dashboard');
    } catch (err) {
      setBanner('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {banner && <div className="auth-error-banner" role="alert" aria-live="assertive"><ErrIcon />{banner}</div>}
      <div className="auth-row">
        <div className="auth-field" style={{ flex: 1 }}>
          <label htmlFor="signup-first">First Name</label>
          <input id="signup-first" className={`auth-input${touched.first && errors.first ? ' error' : ''}`} value={form.first} onChange={set('first')} onBlur={touch('first')} placeholder="Jane" aria-invalid={!!(touched.first && errors.first)} aria-describedby={touched.first && errors.first ? 'signup-first-error' : undefined} />
          {touched.first && errors.first && <p className="auth-error-msg" id="signup-first-error" role="alert"><ErrIcon />{errors.first}</p>}
        </div>
        <div className="auth-field" style={{ flex: 1 }}>
          <label htmlFor="signup-last">Last Name</label>
          <input id="signup-last" className={`auth-input${touched.last && errors.last ? ' error' : ''}`} value={form.last} onChange={set('last')} onBlur={touch('last')} placeholder="Doe" aria-invalid={!!(touched.last && errors.last)} aria-describedby={touched.last && errors.last ? 'signup-last-error' : undefined} />
          {touched.last && errors.last && <p className="auth-error-msg" id="signup-last-error" role="alert"><ErrIcon />{errors.last}</p>}
        </div>
      </div>
      <div className="auth-field">
        <label htmlFor="signup-email">Email Address</label>
        <input id="signup-email" type="email" className={`auth-input${touched.email && errors.email ? ' error' : ''}`} value={form.email} onChange={set('email')} onBlur={touch('email')} placeholder="jane@example.com" autoComplete="email" aria-invalid={!!(touched.email && errors.email)} aria-describedby={touched.email && errors.email ? 'signup-email-error' : undefined} />
        {touched.email && errors.email && <p className="auth-error-msg" id="signup-email-error" role="alert"><ErrIcon />{errors.email}</p>}
      </div>
      <PhoneInput id="signup-phone" value={form.phone} onChange={(v) => { setForm(p => ({ ...p, phone: v })); if (touched.phone) validate('phone', v); }} onBlur={touch('phone')} error={touched.phone ? errors.phone : ''} />
      <PasswordInput id="signup-password" label="Password" value={form.password} onChange={set('password')} onBlur={touch('password')} error={touched.password ? errors.password : ''} showMeter />
      <button type="submit" className="auth-submit" disabled={loading} id="signup-submit-btn">
        {loading ? <span className="auth-spinner" /> : 'Create Account'}
      </button>
      <GoogleButton />
      <div className="auth-switch">Already have an account? <button type="button" onClick={onSwitch}>Sign In</button></div>
      <AuthFooter />
    </form>
  );
}

// ═══════════════════════════════════
//  SIGN IN VIEW
// ═══════════════════════════════════
function SignInView({ onSwitch, onForgot, onNeedPassword }) {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const touch = (k) => () => {
    setTouched(p => ({ ...p, [k]: true }));
    setErrors(prev => {
      const e = { ...prev };
      if (k === 'email') e.email = !form.email.trim() ? 'Email is required' : !emailRegex.test(form.email) ? 'Enter a valid email' : '';
      if (k === 'password') e.password = !form.password ? 'Password is required' : '';
      return e;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const emailErr = !form.email.trim() ? 'Email is required' : !emailRegex.test(form.email) ? 'Enter a valid email' : '';
    const pwErr = !form.password ? 'Password is required' : '';
    setErrors({ email: emailErr, password: pwErr });
    if (emailErr || pwErr) return;

    setLoading(true);
    setBanner('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If user has no password set (Google-only account), switch to signup
        if (data.code === 'NO_PASSWORD_SET') {
          onNeedPassword(form.email.trim());
          return;
        }
        setBanner(data.message || 'Invalid credentials. Please try again.');
        setLoading(false);
        return;
      }
      // Success — refresh auth state and navigate
      await dispatch(fetchCurrentUser());
      navigate('/dashboard');
    } catch (err) {
      setBanner('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {banner && <div className="auth-error-banner" role="alert" aria-live="assertive"><ErrIcon />{banner}</div>}
      <div className="auth-field">
        <label htmlFor="signin-email">Email Address</label>
        <input id="signin-email" type="email" className={`auth-input${touched.email && errors.email ? ' error' : ''}`} value={form.email} onChange={set('email')} onBlur={touch('email')} placeholder="jane@example.com" autoComplete="email" aria-invalid={!!(touched.email && errors.email)} aria-describedby={touched.email && errors.email ? 'signin-email-error' : undefined} />
        {touched.email && errors.email && <p className="auth-error-msg" id="signin-email-error" role="alert"><ErrIcon />{errors.email}</p>}
      </div>
      <PasswordInput id="signin-password" label="Password" value={form.password} onChange={set('password')} onBlur={touch('password')} error={touched.password ? errors.password : ''} showMeter={false} />
      <div className="auth-options">
        <label className="auth-remember"><input type="checkbox" checked={form.remember} onChange={set('remember')} id="remember-me" />Remember me</label>
        <button type="button" className="auth-forgot-link" onClick={onForgot} id="forgot-password-link">Forgot password?</button>
      </div>
      <button type="submit" className="auth-submit" disabled={loading} id="signin-submit-btn">
        {loading ? <span className="auth-spinner" /> : 'Sign In'}
      </button>
      <GoogleButton />
      <div className="auth-switch">Don&apos;t have an account? <button type="button" onClick={onSwitch}>Sign Up</button></div>
      <AuthFooter />
    </form>
  );
}

// ═══════════════════════════════════
//  FORGOT PASSWORD VIEW
// ═══════════════════════════════════
function ForgotView({ onBack }) {
  const [step, setStep] = useState(1); // 1=input, 2=otp, 3=done
  const [identity, setIdentity] = useState('');
  const [identityError, setIdentityError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [success, setSuccess] = useState('');

  // Resend cooldown
  React.useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const detectType = (v) => isPhone(v) ? 'phone' : 'email';

  const handleSend = (e) => {
    e.preventDefault();
    const t = detectType(identity);
    if (t === 'email' && !emailRegex.test(identity)) { setIdentityError('Enter a valid email address'); return; }
    if (t === 'phone' && identity.replace(/\D/g, '').length < 7) { setIdentityError('Enter a valid phone number'); return; }
    setIdentityError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); setTimer(60); }, 1200);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (otp.join('').length < 6) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(3); setSuccess('Verification successful! A password reset link has been sent.'); }, 1200);
  };

  const handleResend = () => {
    if (timer > 0) return;
    setTimer(60);
    // simulate resend
  };

  return (
    <div>
      <button type="button" className="auth-back-btn" onClick={onBack}><BackArrow />Back to Sign In</button>
      <h2>Reset Password</h2>
      <p className="auth-subtitle">{step === 1 ? 'Enter your email or phone number to receive a verification code.' : step === 2 ? `We sent a 6-digit code to ${identity}` : ''}</p>
      {step === 3 && success && <div className="auth-success" role="status"><svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>{success}</div>}
      {step === 1 && (
        <form onSubmit={handleSend} noValidate>
          <div className="auth-field">
            <label htmlFor="forgot-identity">Email or Phone</label>
            <input id="forgot-identity" className={`auth-input${identityError ? ' error' : ''}`} value={identity} onChange={e => setIdentity(e.target.value)} onBlur={() => { if (!identity.trim()) setIdentityError('This field is required'); }} placeholder="jane@example.com or +1 555..." aria-invalid={!!identityError} aria-describedby={identityError ? 'forgot-id-error' : undefined} />
            {identityError && <p className="auth-error-msg" id="forgot-id-error" role="alert"><ErrIcon />{identityError}</p>}
          </div>
          <button type="submit" className="auth-submit" disabled={loading} id="forgot-send-btn">{loading ? <span className="auth-spinner" /> : 'Send Verification Code'}</button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleVerify} noValidate>
          <OtpInput value={otp} onChange={setOtp} />
          <button type="submit" className="auth-submit" disabled={loading || otp.join('').length < 6} id="otp-verify-btn">{loading ? <span className="auth-spinner" /> : 'Verify Code'}</button>
          <div className="auth-resend" aria-live="polite">
            {timer > 0 ? `Resend code in ${timer}s` : <button type="button" onClick={handleResend}>Resend Code</button>}
          </div>
        </form>
      )}
      {step === 3 && <button type="button" className="auth-submit" onClick={onBack}>Back to Sign In</button>}
    </div>
  );
}

// ═══════════════════════════════════
//  MAIN AUTH PAGE
// ═══════════════════════════════════
export default function AuthPage() {
  const [view, setView] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [prefillEmail, setPrefillEmail] = useState('');

  // Called when a Google-only user tries manual login — switch to signup with their email
  const handleNeedPassword = (email) => {
    setPrefillEmail(email);
    setView('signup');
  };

  return (
    <div className="auth-page">
      <BrandPanel />
      <div className="auth-form-panel">
        <div className="auth-card">
          <AuthLogo />
          {view !== 'forgot' && (
            <>
              <h2>{view === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
              <p className="auth-subtitle">{view === 'signin' ? 'Sign in to continue your journey' : 'Start your academic journey today'}</p>
              <div className="auth-tabs" role="tablist">
                <button role="tab" aria-selected={view === 'signin'} className={`auth-tab${view === 'signin' ? ' active' : ''}`} onClick={() => { setView('signin'); setPrefillEmail(''); }} id="tab-signin">Sign In</button>
                <button role="tab" aria-selected={view === 'signup'} className={`auth-tab${view === 'signup' ? ' active' : ''}`} onClick={() => setView('signup')} id="tab-signup">Sign Up</button>
              </div>
            </>
          )}
          <div aria-live="polite">
            {view === 'signin' && <SignInView onSwitch={() => setView('signup')} onForgot={() => setView('forgot')} onNeedPassword={handleNeedPassword} />}
            {view === 'signup' && <SignUpView onSwitch={() => setView('signin')} initialEmail={prefillEmail} />}
            {view === 'forgot' && <ForgotView onBack={() => setView('signin')} />}
          </div>
        </div>
      </div>
    </div>
  );
}
