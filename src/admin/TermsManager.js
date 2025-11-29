import React, { useEffect, useState, useMemo } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import { supabase } from '../supabaseClient';

// Note: Terms now reference categories by categoryId. We fetch categories to show in the
// term form as a dropdown and display the category name in the list.

export default function TermsManager() {
  const [terms, setTerms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  // filters / search / sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterActive, setFilterActive] = useState('any');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });
  const [formModal, setFormModal] = useState({ open: false, mode: 'add', term: null });
  const [formData, setFormData] = useState({ id: '', name: '', definition: '', active: true });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  

  // memoized filtered list - ensure hooks run unconditionally before any early returns
  const filteredTerms = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    let list = Array.isArray(terms) ? terms.slice() : [];
    if (q) list = list.filter(t => ((t.name || '').toLowerCase().includes(q) || (t.definition || '').toLowerCase().includes(q) || (String(t.id || '')).toLowerCase().includes(q)));
    if (filterCategoryId) list = list.filter(t => t.categoryId === filterCategoryId);
    if (filterActive === 'true') list = list.filter(t => !!t.active);
    if (filterActive === 'false') list = list.filter(t => !t.active);
    list.sort((a, b) => {
      let av = a[sortBy] || '';
      let bv = b[sortBy] || '';
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') { av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [terms, searchQuery, filterCategoryId, filterActive, sortBy, sortDir]);

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
    if (!formData.id.trim() || !formData.name.trim() || !formData.definition.trim()) {
      setModal({ open: true, variant: 'error', title: 'Validation error', message: 'ID, Name, and Definition are required.' });
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

      {/* Filters */}
      <div className="filters-bar" style={{ marginBottom: 12 }}>
        <input placeholder="Search name, id or definition" className="field" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ minWidth: 260 }} />
        <select value={filterCategoryId} onChange={e => setFilterCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.docId} value={c.docId}>{c.name}</option>)}
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)}>
          <option value="any">Any</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>Sort:
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
          </select>
        </label>
        <select value={sortDir} onChange={e => setSortDir(e.target.value)}>
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
      </div>

      {filteredTerms.length === 0 ? (
        <div style={{ background: '#f5f7fb', padding: '2rem', borderRadius: 8, textAlign: 'center', color: '#666' }}>
          No terms match your filters. <button className="btn" onClick={openAddForm} style={{ marginLeft: '0.5rem' }}>Create one</button>
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
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTerms.map(term => (
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
                <td>{term.createdAt ? new Date(term.createdAt).toLocaleString() : '-'}</td>
                <td>{term.updatedAt ? new Date(term.updatedAt).toLocaleString() : '-'}</td>
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
                <span>ID *</span>
                <input type="text" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder="e.g., term_001" required />
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
