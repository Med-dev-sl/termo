import React, { useEffect, useState } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import { supabase } from '../supabaseClient';

// Note: Terms now reference categories by categoryId. We fetch categories to show in the
// term form as a dropdown and display the category name in the list.

export default function TermsManager() {
  const [terms, setTerms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });
  const [formModal, setFormModal] = useState({ open: false, mode: 'add', term: null });
  const [formData, setFormData] = useState({ id: '', name: '', definition: '', active: true });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch terms from Firestore on mount
  useEffect(() => {
    fetchCategories();
    fetchTerms();
  }, []);

  async function fetchCategories() {
    try {
      const res = await supabase.from('vocabulary_categories').select('*').order('name', { ascending: true });
      if (res.error) throw res.error;
      setCategories((res.data || []).map(d => ({ ...d, docId: d.id })));
    } catch (err) {
      console.error('Fetch categories error', err);
      setModal({ open: true, variant: 'error', title: 'Categories error', message: `Failed to load categories: ${err.message}` });
    }
  }

  async function fetchTerms() {
    setLoading(true);
    try {
      const res = await supabase.from('terms').select('*').order('name', { ascending: true });
      if (res.error) throw res.error;
      setTerms((res.data || []).map(d => ({ ...d, docId: d.id })));
    } catch (err) {
      console.error('Fetch terms error', err);
      setModal({ open: true, variant: 'error', title: 'Fetch error', message: `Failed to load terms: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setFormData({ id: '', name: '', definition: '', active: true, categoryId: '' });
    setFormModal({ open: true, mode: 'add', term: null });
  }

  function openEditForm(term) {
    setFormData({ id: term.id || '', name: term.name || '', definition: term.definition || '', active: term.active !== false, categoryId: term.categoryId || '' });
    setFormModal({ open: true, mode: 'edit', term });
  }

  function closeFormModal() {
    setFormModal({ open: false, mode: 'add', term: null });
    setFormData({ id: '', name: '', definition: '', active: true, categoryId: '' });
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.definition.trim()) {
      setModal({ open: true, variant: 'error', title: 'Validation error', message: 'Name and definition are required.' });
      return;
    }
    try {
      const payload = {
        id: formData.id || undefined,
        name: formData.name.trim(),
        definition: formData.definition.trim(),
        active: formData.active,
        categoryId: formData.categoryId || null,
      };
      let res;
      if (formModal.mode === 'add') {
        payload.createdAt = new Date().toISOString();
        res = await supabase.from('terms').insert([payload]);
        if (res.error) throw res.error;
        setModal({ open: true, variant: 'success', title: 'Term added', message: 'Term has been created successfully.' });
      } else {
        payload.updatedAt = new Date().toISOString();
        res = await supabase.from('terms').update(payload).eq('id', formData.id);
        if (res.error) throw res.error;
        setModal({ open: true, variant: 'success', title: 'Term updated', message: 'Term has been updated successfully.' });
      }
      closeFormModal();
      fetchTerms();
    } catch (err) {
      console.error('Save error', err);
      setModal({ open: true, variant: 'error', title: 'Save error', message: `Failed to save term: ${err.message}` });
    }
  }

  async function handleToggleStatus(term) {
    try {
      const res = await supabase.from('terms').update({ active: !term.active, updatedAt: new Date().toISOString() }).eq('id', term.id);
      if (res.error) throw res.error;
      setModal({ open: true, variant: 'success', title: 'Status updated', message: `Term is now ${!term.active ? 'active' : 'inactive'}.` });
      fetchTerms();
    } catch (err) {
      console.error('Toggle error', err);
      setModal({ open: true, variant: 'error', title: 'Toggle error', message: `Failed to toggle status: ${err.message}` });
    }
  }

  async function handleDelete(term) {
    try {
      const res = await supabase.from('terms').delete().eq('id', term.id);
      if (res.error) throw res.error;
      setDeleteConfirm(null);
      setModal({ open: true, variant: 'success', title: 'Term deleted', message: 'Term has been deleted.' });
      fetchTerms();
    } catch (err) {
      console.error('Delete error', err);
      setModal({ open: true, variant: 'error', title: 'Delete error', message: `Failed to delete term: ${err.message}` });
    }
  }

  function closeModal() {
    setModal(m => ({ ...m, open: false }));
  }

  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading terms...</div>;
  }

  return (
    <div style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Terms</h3>
        <button className="btn primary" onClick={openAddForm}>+ Add Term</button>
      </div>

      {terms.length === 0 ? (
        <div style={{ background: '#f5f7fb', padding: '2rem', borderRadius: 8, textAlign: 'center', color: '#666' }}>
          No terms yet. <button className="btn" onClick={openAddForm} style={{ marginLeft: '0.5rem' }}>Create one</button>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Definition</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {terms.map(term => (
              <tr key={term.docId}>
                <td>{term.id || '-'}</td>
                <td>{term.name}</td>
                <td>{(categories.find(c => c.docId === term.categoryId) || {}).name || '-'}</td>
                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{term.definition}</td>
                <td>
                  <span className={`status-badge ${term.active ? 'active' : 'inactive'}`}>
                    {term.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="btn-small" onClick={() => openEditForm(term)}>Edit</button>
                  <button className="btn-small" onClick={() => handleToggleStatus(term)}>
                    {term.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn-small delete" onClick={() => setDeleteConfirm(term)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Form Modal */}
      {formModal.open && (
        <div className="modal-backdrop" onClick={closeFormModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h3>{formModal.mode === 'add' ? 'Add Term' : 'Edit Term'}</h3>
            </header>
            <div className="modal-body">
              <label className="field">
                <span>ID (optional)</span>
                <input type="text" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder="e.g., term_001" />
              </label>
              <label className="field">
                <span>Name *</span>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Velocity" required />
              </label>
              <label className="field">
                <span>Definition *</span>
                <textarea value={formData.definition} onChange={e => setFormData({ ...formData, definition: e.target.value })} placeholder="Enter the definition..." required style={{ minHeight: '100px', fontFamily: 'inherit' }} />
              </label>
              <label className="field">
                <span>Category</span>
                <select value={formData.categoryId || ''} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}>
                  <option value="">-- None --</option>
                  {categories.map(cat => (
                    <option key={cat.docId} value={cat.docId}>{cat.name}</option>
                  ))}
                </select>
              </label>
              <label className="field checkbox">
                <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                Active
              </label>
            </div>
            <footer className="modal-footer">
              <button className="btn" onClick={closeFormModal}>Cancel</button>
              <button className="btn primary" onClick={handleSave}>Save</button>
            </footer>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <header className="modal-header">
              <h3>Confirm delete</h3>
            </header>
            <div className="modal-body">
              <p>Are you sure you want to delete this term? This action cannot be undone.</p>
            </div>
            <footer className="modal-footer">
              <button className="btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn" style={{ background: '#e74c3c', color: '#fff' }} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </footer>
          </div>
        </div>
      )}

      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={closeModal} variant={modal.variant} />
    </div>
  );
}
