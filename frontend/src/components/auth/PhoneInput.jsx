import React, { useState, useRef, useEffect } from 'react';
import countries from '../../data/countries';

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

function applyMask(value, pattern) {
  if (!pattern) return value;
  let digits = value.replace(/\D/g, '');
  let result = '';
  let di = 0;
  for (let i = 0; i < pattern.length && di < digits.length; i++) {
    if (pattern[i] === '#') { result += digits[di]; di++; }
    else { result += pattern[i]; if (digits[di] === pattern[i]) di++; }
  }
  return result;
}

export default function PhoneInput({ id, value, onChange, onBlur, error }) {
  const [country, setCountry] = useState(countries.find(c => c.code === 'IN'));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = countries.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dialCode.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, country.maxLen);
    onChange(raw);
  };

  return (
    <div className="auth-field" ref={dropRef}>
      <label htmlFor={id}>Mobile Number</label>
      <div className="auth-phone-row">
        <button type="button" className={`auth-country-btn${open ? ' open' : ''}`} onClick={() => setOpen(!open)} aria-haspopup="listbox" aria-expanded={open}>
          <span>{country.flag}</span>
          <span>{country.dialCode}</span>
          <ChevronDown />
        </button>
        <div className="auth-input-wrap" style={{flex:1}}>
          <input
            id={id}
            type="tel"
            className={`auth-input${error ? ' error' : ''}`}
            value={applyMask(value, country.pattern)}
            onChange={handleInput}
            onBlur={onBlur}
            placeholder={country.pattern.replace(/#/g, '0')}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </div>
      </div>
      {open && (
        <div className="auth-country-dropdown" role="listbox">
          <input ref={searchRef} className="auth-country-search" placeholder="Search country..." value={search} onChange={e => setSearch(e.target.value)} />
          {filtered.map(c => (
            <div key={c.code} className="auth-country-item" role="option" aria-selected={c.code === country.code} onClick={() => { setCountry(c); setOpen(false); setSearch(''); onChange(''); }}>
              <span className="flag">{c.flag}</span>
              <span>{c.name}</span>
              <span className="dial">{c.dialCode}</span>
            </div>
          ))}
        </div>
      )}
      {error && <p className="auth-error-msg" id={`${id}-error`} role="alert"><svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>{error}</p>}
    </div>
  );
}
