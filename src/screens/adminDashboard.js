import React, { useEffect, useState } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';
import TermsManager from '../admin/TermsManager';
import VocabularyCategoriesManager from '../admin/VocabularyCategoriesManager';
import PhotosManager from '../admin/PhotosManager';
import VideosManager from '../admin/VideosManager';
import QuizzesManager from '../admin/QuizzesManager';
import { supabase, authSignIn, authSignOut } from '../supabaseClient';
import { useAuth } from '../AuthProvider';

const ADMIN_EMAILS = ['mohamedsallu.sl@gmail.com', 'mohamedsallu24@gmail.com'];
const ADMIN_DEFAULT_EMAIL = 'mohamedsallu24@gmail.com';
const ADMIN_DEFAULT_PASSWORD = 'P@$$w0rd';

export default function AdminDashboard() {
  const [email, setEmail] = useState(ADMIN_DEFAULT_EMAIL);
  const [password, setPassword] = useState(ADMIN_DEFAULT_PASSWORD);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });
  const [fsStatus, setFsStatus] = useState('unknown');
  const { user } = useAuth();

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email)) setAuthorized(true); else setAuthorized(false);
    setLoading(false);
  }, [user]);

  // when authorized, try a small Firestore read to check connectivity/permissions
  useEffect(() => {
    let mounted = true;
    async function checkFirestore() {
      if (!authorized) return;
      setFsStatus('checking');
      try {
        // attempt to read a small doc — adjust collection/doc to something that exists or is OK to read
        const d = doc(db, 'meta', 'status');
        const snap = await getDoc(d);
        if (!mounted) return;
        if (snap.exists()) {
          setFsStatus('ok');
        } else {
          // doc missing is still success — Firestore responded
          setFsStatus('ok');
        }
      } catch (err) {
        console.error('Firestore check failed', err);
        if (!mounted) return;
        // show actionable modal for permission error
        setFsStatus('error');
        setModal({ open: true, variant: 'error', title: 'Firestore access error', message: `Firestore read failed: ${err.message || err}.\nThis usually means your Firestore security rules prevent reads for this user. See the console for details.` });
      }
    }
    checkFirestore();
    return () => { mounted = false; };
  }, [authorized]);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authSignIn(email, password);
      if (res.error) throw res.error;
      const cred = res.data?.user;
      if (cred && ADMIN_EMAILS.includes(cred.email)) {
        setAuthorized(true);
        setModal({ open: true, variant: 'success', title: 'Welcome', message: `You are signed in as admin (${cred.email}).` });
      } else {
        setModal({ open: true, variant: 'error', title: 'Access denied', message: 'This account is not permitted to access the admin dashboard.' });
      }
    } catch (err) {
      console.error(err);
      setModal({ open: true, variant: 'error', title: 'Login failed', message: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await authSignOut();
      setAuthorized(false);
      setModal({ open: true, variant: 'info', title: 'Signed out', message: 'You have been signed out.' });
    } catch (err) {
      console.error(err);
      setModal({ open: true, variant: 'error', title: 'Logout failed', message: err.message || String(err) });
    }
  }

  function closeModal() { setModal(m => ({ ...m, open: false })); }

  // helper to show actionable firestore rules guidance in the modal
  function showRulesGuide() {
    const emails = ADMIN_EMAILS.map(e => `request.auth.token.email == '${e}'`).join(' || ');
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to any document for admin emails only
    match /{document=**} {
      allow read: if request.auth != null && (${emails});
      // allow write can be restricted further — be careful granting write
      allow write: if false;
    }
  }
}`;
    setModal({ open: true, variant: 'info', title: 'Firestore rules to allow admin read', message: `If you want these admin users to read Firestore from the client, add the following to your Firestore rules and deploy them:\n\n${rules}\n\nDeploy with: firebase deploy --only firestore:rules` });
  }

  if (loading) {
    return (
      <div className="auth-screen gradient-bg-full">
        <div className="auth-card">
          <div className="auth-card-body">
            <h3 className="auth-title">Checking credentials…</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="auth-screen gradient-bg-full">
        <div className="auth-card">
          <div className="auth-card-bar top" />
          <div className="auth-card-body">
            <h3 className="auth-title">Admin login</h3>
            <form className="auth-form" onSubmit={handleLogin}>
              <label className="field">
                <span>Email</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </label>
              <label className="field">
                <span>Password</span>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </label>
              <button className="btn primary block" type="submit">Sign in as admin</button>
            </form>
            <p style={{ marginTop: '1rem', color: '#666', fontSize: '.9rem' }}>
              Note: this page only allows the admin email address to access the dashboard.
            </p>
          </div>
          <div className="auth-card-bar bottom" />
        </div>
        <Modal open={modal.open} title={modal.title} message={modal.message} onClose={closeModal} variant={modal.variant} />
      </div>
    );
  }

  // authorized view with sidebar
  const view = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';

  return (
    <div className="auth-screen gradient-bg-full admin-layout">
      <Sidebar />
      <main className="admin-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Admin Dashboard</h2>
          <div>
            <button className="btn" onClick={handleLogout}>Sign out</button>
          </div>
        </div>

        {/* Render view based on hash */}
        {view === 'terms' ? (
          <TermsManager />
        ) : view === 'vocabulary_categories' ? (
          <VocabularyCategoriesManager />
        ) : view === 'photos' ? (
          <PhotosManager />
        ) : view === 'videos' ? (
          <VideosManager />
        ) : view === 'quizzes' ? (
          <QuizzesManager />
        ) : view === 'videos' ? (
          <VideosManager />
        ) : (
          <>
            <FirestoreStatus db={db} />
            <section style={{ marginTop: '1rem', background: '#fff', padding: '1rem', borderRadius: 8 }}>
              <h3>Admin controls</h3>
              <p>Welcome to the admin dashboard. Use the sidebar to navigate to different sections.</p>
              <div style={{ marginTop: '0.75rem' }}>
                <strong>Firestore status:</strong> {fsStatus}
                {fsStatus === 'error' && (
                  <div style={{ marginTop: '0.5rem', color: '#b93a3a' }}>
                    Permission denied when reading Firestore. To allow this admin user read access, you can update your Firestore rules.
                    <div style={{ marginTop: '0.5rem' }}>
                      <button className="btn" onClick={showRulesGuide}>Show rules to deploy</button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={closeModal} variant={modal.variant} />
    </div>
  );
}

function FirestoreStatus({ db }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        // try reading a small doc; it's ok if it doesn't exist
        const ref = doc(db, 'meta', 'status');
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (snap.exists()) {
          const data = snap.data();
          setStatus(`connected — ${data.message || 'ok'}`);
        } else {
          setStatus('connected — OK (no status doc)');
        }
      } catch (err) {
        console.error('Firestore check failed', err);
        if (mounted) setStatus('error: ' + (err.message || String(err)));
      }
    }
    check();
    return () => { mounted = false; };
  }, [db]);

  return (
    <div style={{ marginBottom: '0.6rem', color: '#444' }}>
      Firestore: <strong>{status}</strong>
    </div>
  );
}
