import React, { useState } from 'react';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
);

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[$@!%*?&]/.test(pw)) s++;
  return s;
}

export default function PasswordInput({ id, label, value, onChange, onBlur, error, showMeter }) {
  const [show, setShow] = useState(false);
  const strength = showMeter ? getStrength(value) : 0;

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={`auth-input${error ? ' error' : ''}`}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="••••••••"
          autoComplete={id === 'signup-password' ? 'new-password' : 'current-password'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="button" className="auth-pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <p className="auth-error-msg" id={`${id}-error`} role="alert"><svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>{error}</p>}
      {showMeter && value && (
        <div className="auth-strength">
          <div className="auth-strength-bars">
            {[1,2,3,4].map(i => <div key={i} className={`auth-strength-bar${strength >= i ? ` s${strength}` : ''}`} />)}
          </div>
          <span className={`auth-strength-label s${strength}`}>{strengthLabels[strength]}</span>
        </div>
      )}
    </div>
  );
}
