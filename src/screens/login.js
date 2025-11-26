import React, { useState } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import { loginWithEmail, signInWithGoogle, auth } from '../firebase';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';

export default function Login({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  async function submit(e) {
    e.preventDefault();
    try {
      // set persistence based on remember checkbox
      try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      } catch (persErr) {
        console.warn('Persistence set failed', persErr);
      }

      const cred = await loginWithEmail(email, password);
      console.log('Logged in:', cred.user);
      setModal({ open: true, variant: 'success', title: 'Logged in', message: 'You have signed in successfully.' });
      // redirect admin users to /admin
      try {
        if (cred && cred.user && cred.user.email === 'mohamedsallu.sl@gmail.com') {
          window.location.pathname = '/admin';
        }
      } catch (e) { /* ignore */ }
      // if this user is the admin, redirect to /admin
      try {
        const userEmail = cred?.user?.email;
        if (userEmail && userEmail.toLowerCase() === 'mohamedsallu.sl@gmail.com') {
          // short delay so modal shows briefly
          setTimeout(() => { window.location.href = '/admin'; }, 600);
        }
      } catch (e) {
        console.warn('Redirect check failed', e);
      }
    } catch (err) {
      console.error(err);
      setModal({ open: true, variant: 'error', title: 'Login failed', message: err.message || String(err) });
    }
  }

  async function google() {
    try {
      try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      } catch (persErr) {
        console.warn('Persistence set failed', persErr);
      }
      const result = await signInWithGoogle();
      console.log('Google sign-in result', result.user);
      setModal({ open: true, variant: 'success', title: 'Signed in', message: 'Signed in with Google successfully.' });
      try {
        if (result && result.user && result.user.email === 'mohamedsallu.sl@gmail.com') {
          window.location.pathname = '/admin';
        }
      } catch (e) { /* ignore */ }
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
    <div className="auth-screen gradient-bg-full">
      <div className="auth-card">
        <div className="auth-card-bar top" />
        <div className="auth-card-body">
          <button className="link-back" onClick={onBack}>&larr; Back</button>
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
          </form>
        </div>
        <div className="auth-card-bar bottom" />
      </div>
      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={closeModal} variant={modal.variant} />
    </div>
  );
}
