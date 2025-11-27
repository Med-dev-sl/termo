import React, { useState } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import { authSignUp, authSignInWithProvider } from '../supabaseClient';

export default function Signup({ onBack }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setModal({ open: true, variant: 'error', title: 'Validation', message: 'Passwords do not match' });
      return;
    }
    try {
      const res = await authSignUp(email, password, { data: { name } });
      if (res.error) throw res.error;
      setModal({ open: true, variant: 'success', title: 'Account created', message: 'Your account was created successfully. Please check your email to confirm.' });
      const userEmail = res?.data?.user?.email?.toLowerCase();
      const adminEmail = 'mohamedsallu.sl@gmail.com';
      setTimeout(() => { window.location.href = (userEmail === adminEmail ? '/admin' : '/'); }, 900);
    } catch (err) {
      console.error(err);
      setModal({ open: true, variant: 'error', title: 'Signup failed', message: err.message || String(err) });
    }
  }

  async function google() {
    try {
      const res = await authSignInWithProvider('google');
      if (res.error) throw res.error;
      setModal({ open: true, variant: 'info', title: 'Redirecting', message: 'Proceeding to Google sign-in...' });
    } catch (err) {
      console.error(err);
      setModal({ open: true, variant: 'error', title: 'Google signup failed', message: err.message || String(err) });
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
          <button className="link-back" onClick={onBack}>&larr; Back</button>
          <h3 className="auth-title">Create an account</h3>
          <form className="auth-form" onSubmit={submit}>
            <label className="field">
              <span>Full name</span>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </label>

            <button className="btn primary block" type="submit">Sign up</button>
            <div className="divider">or</div>
            <button type="button" className="btn google" onClick={google}>Sign up with Google</button>
          </form>
        </div>
        <div className="auth-card-bar bottom" />
      </div>
      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={closeModal} variant={modal.variant} />
    </div>
  );
}
