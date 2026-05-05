// =============================================================
// FILE: Login.jsx
// PURPOSE: Login page using Supabase Auth.
//          Replaces old fetch('/api/login') with supabase.auth.signInWithPassword().
//          After login, reads usertype from user_metadata and redirects
//          to the correct role dashboard (/admin, /doctor, /registrar, /lab, /pharmacy).
// =============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Route map: usertype code → dashboard path
const ROLE_ROUTES = {
  'a':  '/admin',
  'd':  '/doctor',
  'r':  '/registrar',
  'l':  '/lab',
  'ph': '/pharmacy',
};

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // ----------------------------------------------------------
  // handleLogin: called when the form is submitted
  // ----------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ----------------------------------

    // 1. Authenticate with Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    // 2. Fetch the role from the centralized profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const usertype = profile?.role || data.user?.user_metadata?.usertype;

    if (!usertype || !ROLE_ROUTES[usertype]) {
      setError('Account profile not found. Please contact the administrator.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // 3. Redirect to the correct dashboard
    navigate(ROLE_ROUTES[usertype]);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
    }}>
      {/* Glow orbs for depth */}
      <div style={{ position: 'fixed', top: '15%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 32,
        padding: '48px 40px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Hospital mark (Emergency Bypass: Click here to enter) */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #2563eb, #10b981)',
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 16px 40px rgba(37,99,235,0.4)',
          }}>
            <span style={{ fontSize: 32 }}>🏥</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 900, marginBottom: 6, letterSpacing: '-0.04em' }}>
            eDoc HMS
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            Hospital Management System
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10,
            color: '#fca5a5', fontSize: '0.875rem', fontWeight: 600,
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email field */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@hospital.com"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 14,
                color: 'white', fontSize: '1rem',
                outline: 'none',
                transition: '0.2s border-color',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(37,99,235,0.7)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>

          {/* Password field */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 48px 14px 16px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 14,
                  color: 'white', fontSize: '1rem',
                  outline: 'none',
                  transition: '0.2s border-color',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(37,99,235,0.7)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '16px',
              background: loading ? 'rgba(37,99,235,0.5)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              fontSize: '1rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
              transition: '0.2s all',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Authenticating…
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign In to HMS
              </>
            )}
          </button>
        </form>



        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 28 }}>
          Access restricted to authorised hospital staff only.
        </p>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
