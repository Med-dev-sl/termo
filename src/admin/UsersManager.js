import React, { useEffect, useState } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import { supabase } from '../supabaseClient';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      // Try to read from a public `users` table first
      const tableRes = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (!tableRes.error && Array.isArray(tableRes.data) && tableRes.data.length > 0) {
        setUsers(tableRes.data.map(u => ({ ...u, source: 'table' })));
        return;
      }

      // Fallback: use Supabase Auth admin API if available (note: may require service role or server context)
      if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.listUsers === 'function') {
        const list = await supabase.auth.admin.listUsers();
        if (list && !list.error && Array.isArray(list.data?.users || list.users || [])) {
          const got = list.data?.users || list.users || [];
          setUsers(got.map(u => ({ id: u.id, email: u.email || u.user_metadata?.email || '', role: u.role || '', created_at: u.created_at || u.createdAt || '', raw: u, source: 'auth' })));
          return;
        }
      }

      // If we reach here, show empty list but not an error
      setUsers([]);
    } catch (err) {
      console.error('Fetch users error', err);
      setModal({ open: true, variant: 'error', title: 'Fetch error', message: String(err) });
    } finally { setLoading(false); }
  }

  if (loading) return <div id="users" style={{ padding: '1rem' }}>Loading users...</div>;

  return (
    <div id="users" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Users</h3>
        <button className="btn" onClick={fetchAll}>Refresh</button>
      </div>

      {users.length === 0 ? (
        <div style={{ background: '#f5f7fb', padding: '2rem', borderRadius: 8, textAlign: 'center', color: '#666' }}>
          No users found via the `users` table or the Auth admin API.
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Email</th><th>Role</th><th>Created</th><th>Source</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id || u.email}><td style={{ maxWidth: 240, wordBreak: 'break-all' }}>{u.id || u.user_id || '-'}</td><td>{u.email || u.user_metadata?.email || '-'}</td><td>{u.role || (u.raw?.role) || '-'}</td><td>{u.created_at || u.createdAt || u.raw?.created_at || '-'}</td><td>{u.source}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={() => setModal(m => ({ ...m, open: false }))} variant={modal.variant} />
    </div>
  );
}
