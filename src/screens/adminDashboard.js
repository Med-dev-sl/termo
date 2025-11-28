import React, { useEffect, useState } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';
import TermsManager from '../admin/TermsManager';
import VocabularyCategoriesManager from '../admin/VocabularyCategoriesManager';
import PhotosManager from '../admin/PhotosManager';
import VideosManager from '../admin/VideosManager';
import QuizzesManager from '../admin/QuizzesManager';
import UsersManager from '../admin/UsersManager';
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
  const { user } = useAuth();
  const [stats, setStats] = useState({ videos: 0, photos: 0, terms: 0, categories: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (user && ADMIN_EMAILS.includes(user.email)) setAuthorized(true); else setAuthorized(false);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authorized) {
      fetchStatsAndLogs();
    }
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

  async function fetchStatsAndLogs() {
    setStatsLoading(true);
    setLogsLoading(true);
    try {
      const [vRes, pRes, tRes, cRes, aRes] = await Promise.all([
        supabase.from('videos').select('id', { count: 'exact', head: true }),
        supabase.from('photos').select('id', { count: 'exact', head: true }),
        supabase.from('terms').select('id', { count: 'exact', head: true }),
        supabase.from('vocabulary_categories').select('id', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
      ]);

      setStats({
        videos: vRes?.count || 0,
        photos: pRes?.count || 0,
        terms: tRes?.count || 0,
        categories: cRes?.count || 0,
      });

      if (aRes && !aRes.error && Array.isArray(aRes.data)) setAuditLogs(aRes.data);
      else setAuditLogs([]);
    } catch (err) {
      console.error('Fetch stats/logs error', err);
      setModal({ open: true, variant: 'error', title: 'Fetch error', message: String(err) });
    } finally {
      setStatsLoading(false);
      setLogsLoading(false);
    }
  }

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
        ) : view === 'users' ? (
          <UsersManager />
        ) : view === 'videos' ? (
          <VideosManager />
        ) : view === 'quizzes' ? (
          <QuizzesManager />
        ) : (
          <section style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, background: '#fff', padding: '1rem', borderRadius: 8 }}>
                <h4 style={{ margin: 0 }}>Total Videos</h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '.5rem' }}>{statsLoading ? '...' : stats.videos}</div>
              </div>
              <div style={{ flex: 1, background: '#fff', padding: '1rem', borderRadius: 8 }}>
                <h4 style={{ margin: 0 }}>Total Photos</h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '.5rem' }}>{statsLoading ? '...' : stats.photos}</div>
              </div>
              <div style={{ flex: 1, background: '#fff', padding: '1rem', borderRadius: 8 }}>
                <h4 style={{ margin: 0 }}>Total Terms</h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '.5rem' }}>{statsLoading ? '...' : stats.terms}</div>
              </div>
              <div style={{ flex: 1, background: '#fff', padding: '1rem', borderRadius: 8 }}>
                <h4 style={{ margin: 0 }}>Total Categories</h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '.5rem' }}>{statsLoading ? '...' : stats.categories}</div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '1rem', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>Recent Audit Logs</h3>
              {logsLoading ? (
                <div>Loading audit logs…</div>
              ) : auditLogs.length === 0 ? (
                <div style={{ color: '#666' }}>No audit logs found. To capture audit logs, create an `audit_logs` table and triggers in your database.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr><th>When</th><th>Table</th><th>Op</th><th>User</th><th>Details</th></tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(a => (
                      <tr key={a.id}><td>{new Date(a.created_at).toLocaleString()}</td><td>{a.table_name}</td><td>{a.operation}</td><td style={{ maxWidth: 180, wordBreak: 'break-all' }}>{a.changed_by || a.user || '-'}</td><td style={{ maxWidth: 540, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{JSON.stringify(a.details || a.new_data || a.payload || a.new_row || a)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </main>
      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={closeModal} variant={modal.variant} />
    </div>
  );
}

