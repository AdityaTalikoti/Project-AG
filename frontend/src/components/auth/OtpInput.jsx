import React, { useRef, useEffect } from 'react';

export default function OtpInput({ value, onChange }) {
  const inputs = useRef([]);

  useEffect(() => {
    if (inputs.current[0]) inputs.current[0].focus();
  }, []);

  // Support auto-paste of full OTP
  useEffect(() => {
    const handlePaste = (e) => {
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      if (paste.length > 0) {
        e.preventDefault();
        onChange(paste.padEnd(6, '').split('').map((c, i) => paste[i] || ''));
        const focus = Math.min(paste.length, 5);
        if (inputs.current[focus]) inputs.current[focus].focus();
      }
    };
    const first = inputs.current[0];
    if (first) first.addEventListener('paste', handlePaste);
    return () => { if (first) first.removeEventListener('paste', handlePaste); };
  }, [onChange]);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const newOtp = [...value];
    newOtp[idx] = val[val.length - 1];
    onChange(newOtp);
    if (idx < 5 && inputs.current[idx + 1]) inputs.current[idx + 1].focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      const newOtp = [...value];
      if (newOtp[idx]) {
        newOtp[idx] = '';
        onChange(newOtp);
      } else if (idx > 0) {
        newOtp[idx - 1] = '';
        onChange(newOtp);
        inputs.current[idx - 1].focus();
      }
    }
  };

  return (
    <div className="auth-otp-row" role="group" aria-label="One-time password">
      {value.map((digit, idx) => (
        <input
          key={idx}
          ref={el => inputs.current[idx] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`auth-otp-input${digit ? ' filled' : ''}`}
          value={digit}
          onChange={e => handleChange(e, idx)}
          onKeyDown={e => handleKeyDown(e, idx)}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
}
