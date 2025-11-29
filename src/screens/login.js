import React, { useState } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import { authSignIn, authSignInWithProvider } from '../supabaseClient';

export default function Login({ onBack, onSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await authSignIn(email, password);
      if (res.error) throw res.error;
      console.log('Signed in:', res.data);
      setModal({ open: true, variant: 'success', title: 'Logged in', message: 'You have signed in successfully.' });
      const userEmail = res?.data?.user?.email?.toLowerCase();
      const adminEmail = 'mohamedsallu.sl@gmail.com';
      setTimeout(() => { window.location.href = (userEmail === adminEmail ? '/admin' : '/'); }, 600);
    } catch (err) {
      console.error(err);
      setModal({ open: true, variant: 'error', title: 'Login failed', message: err.message || String(err) });
    }
  }

  async function google() {
    try {
      const res = await authSignInWithProvider('google');
      if (res.error) throw res.error;
      // Supabase will redirect or return a url for OAuth flow depending on config.
      setModal({ open: true, variant: 'info', title: 'Redirecting', message: 'Proceeding to Google sign-in...' });
    } catch (err) {
      console.error(err);
      setModal({ open: true, variant: 'error', title: 'Google sign-in failed', message: err.message || String(err) });
    }
  }

  const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });

  function closeModal() {
    setModal(m => ({ ...m, open: false }));
  }

  return (
    <div className="auth-screen" style={{ backgroundColor: '#fff', minHeight: '100vh', paddingTop: 28 }}>
      <div className="auth-card">
        <div className="auth-card-bar top" />
        <div className="auth-card-body">
          <h3 className="auth-title">Welcome back</h3>
          <form className="auth-form" onSubmit={submit}>
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </label>
            <div className="row-between">
              <label className="checkbox"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember me</label>
              <button type="button" className="link-forgot">Forgot password?</button>
            </div>

            <button className="btn primary block" type="submit">Login</button>
            <div className="divider">or</div>
            <button type="button" className="btn google" onClick={google}>Login with Google</button>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <span style={{ color: '#555', marginRight: 6 }}>Don't have an account?</span>
              <button type="button" className="btn" onClick={() => { if (onSignup) onSignup(); else window.location.href = '/signup'; }}>Sign up</button>
            </div>
          </form>
        </div>
        <div className="auth-card-bar bottom" />
      </div>
      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={closeModal} variant={modal.variant} />
    </div>
  );
}
