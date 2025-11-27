import React, { useEffect, useState } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import { supabase } from '../supabaseClient';

export default function PhotosManager() {
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });
  const [formModal, setFormModal] = useState({ open: false, mode: 'add', photo: null });
  const [formData, setFormData] = useState({ id: '', url: '', active: true });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchPhotos(); }, []);

  async function fetchPhotos() {
    setLoading(true);
    try {
      const [photosRes, categoriesRes, termsRes] = await Promise.all([
        supabase.from('photos').select('*').order('createdAt', { ascending: false }),
        supabase.from('vocabulary_categories').select('*').order('name', { ascending: true }),
        supabase.from('terms').select('*').order('createdAt', { ascending: false }),
      ]);
      if (photosRes.error || categoriesRes.error || termsRes.error) {
        throw new Error(photosRes.error?.message || categoriesRes.error?.message || termsRes.error?.message);
      }
      setPhotos((photosRes.data || []).map(d => ({ ...d, docId: d.id })));
      setCategories((categoriesRes.data || []).map(d => ({ ...d, docId: d.id })));
      setTerms((termsRes.data || []).map(d => ({ ...d, docId: d.id })));
    } catch (err) {
      console.error('Fetch photos error', err);
      setModal({ open: true, variant: 'error', title: 'Fetch error', message: `Failed to load photos: ${err.message}` });
    } finally { setLoading(false); }
  }

  function openAdd() { setFormData({ id: '', url: '', categoryId: '', termId: '', videoUrl: '', active: true }); setFormModal({ open: true, mode: 'add', photo: null }); }
  function openEdit(p) { setFormData({ id: p.id || '', url: p.url || '', categoryId: p.categoryId || '', termId: p.termId || '', videoUrl: p.videoUrl || '', active: !!p.active }); setFormModal({ open: true, mode: 'edit', photo: p }); }
  function closeForm() { setFormModal({ open: false, mode: 'add', photo: null }); setFormData({ id: '', url: '', categoryId: '', termId: '', videoUrl: '', active: true }); }

  function validate() {
    if (!formData.url || typeof formData.url !== 'string' || !formData.url.match(/^https?:\/\/.+/)) {
      setModal({ open: true, variant: 'error', title: 'Validation', message: 'Please provide a valid http/https URL.' });
      return false;
    }
    if (formData.videoUrl && typeof formData.videoUrl === 'string' && !formData.videoUrl.match(/^https?:\/\//)) {
      setModal({ open: true, variant: 'error', title: 'Validation', message: 'Please provide a valid video URL (http/https) or leave empty.' });
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      const payload = {
        url: formData.url.trim(),
        categoryId: formData.categoryId || '',
        termId: formData.termId || '',
        videoUrl: formData.videoUrl || '',
        active: !!formData.active,
        id: formData.id && typeof formData.id === 'string' && formData.id.trim().length > 0 ? formData.id.trim() : undefined,
      };
      let res;
      if (formModal.mode === 'add') {
        payload.createdAt = new Date().toISOString();
        res = await supabase.from('photos').insert([payload]);
        if (res.error) throw res.error;
        setModal({ open: true, variant: 'success', title: 'Added', message: 'Photo created' });
      } else {
        payload.updatedAt = new Date().toISOString();
        res = await supabase.from('photos').update(payload).eq('id', formData.id);
        if (res.error) throw res.error;
        setModal({ open: true, variant: 'success', title: 'Updated', message: 'Photo updated' });
      }
      closeForm();
      fetchPhotos();
    } catch (err) {
      console.error('Save photo error:', err);
      setModal({ open: true, variant: 'error', title: 'Save error', message: err.message });
    }
  }

  async function handleDelete(p) {
    try {
      const res = await supabase.from('photos').delete().eq('id', p.id);
      if (res.error) throw res.error;
      setDeleteConfirm(null);
      setModal({ open: true, variant: 'success', title: 'Deleted', message: 'Photo deleted' });
      fetchPhotos();
    } catch (err) {
      console.error('Delete photo error', err);
      setModal({ open: true, variant: 'error', title: 'Delete error', message: err.message });
    }
  }

  if (loading) return <div style={{ padding: '1rem' }}>Loading photos...</div>;

  const filteredTerms = formData.categoryId ? terms.filter(t => t.categoryId === formData.categoryId) : [];

  return (
    <div style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Photos (Works)</h3>
        <button className="btn primary" onClick={openAdd}>+ Add Photo</button>
      </div>

      {photos.length === 0 ? (
        <div style={{ background: '#f5f7fb', padding: '2rem', borderRadius: 8, textAlign: 'center', color: '#666' }}>
          No photos yet. <button className="btn" onClick={openAdd} style={{ marginLeft: '0.5rem' }}>Create one</button>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>URL</th><th>Category</th><th>Term</th><th>Video</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {photos.map(p => (
              <tr key={p.docId}>
                <td>{p.id || '-'}</td>
                <td style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.url}</td>
                <td>{(categories.find(c => c.docId === p.categoryId) || {}).name || '-'}</td>
                <td>{(terms.find(t => t.docId === p.termId) || {}).name || '-'}</td>
                <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.videoUrl ? <a href={p.videoUrl} target="_blank" rel="noopener noreferrer">{(p.videoUrl || '').slice(0, 60)}</a> : '-'}</td>
                <td>{p.active ? 'Yes' : 'No'}</td>
                <td>
                  <button className="btn-small" onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn-small" onClick={() => setFormData(prev => ({ ...prev, active: !p.active })) || openEdit(p)}>{p.active ? 'Deactivate' : 'Activate'}</button>
                  <button className="btn-small delete" onClick={() => setDeleteConfirm(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formModal.open && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <header className="modal-header"><h3>{formModal.mode === 'add' ? 'Add Photo' : 'Edit Photo'}</h3></header>
            <div className="modal-body">
              <label className="field"><span>ID (optional)</span><input type="text" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} /></label>
              <label className="field"><span>URL *</span><input type="text" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} required /></label>
              <label className="field"><span>Category</span>
                <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value, termId: '' })}>
                  <option value="">-- none --</option>
                  {categories.map(c => <option key={c.docId} value={c.docId}>{c.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Term</span>
                <select value={formData.termId} onChange={e => setFormData({ ...formData, termId: e.target.value })}>
                  <option value="">-- none --</option>
                  {filteredTerms.map(t => <option key={t.docId} value={t.docId}>{t.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Video URL (optional)</span><input type="text" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} placeholder="https://..." /></label>
              <label className="field"><span>Active</span><select value={formData.active ? 'true' : 'false'} onChange={e => setFormData({ ...formData, active: e.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select></label>
            </div>
            <footer className="modal-footer"><button className="btn" onClick={closeForm}>Cancel</button><button className="btn primary" onClick={handleSave}>Save</button></footer>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <header className="modal-header"><h3>Confirm delete</h3></header>
            <div className="modal-body"><p>Are you sure you want to delete this photo?</p></div>
            <footer className="modal-footer"><button className="btn" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="btn" style={{ background: '#e74c3c', color: '#fff' }} onClick={() => handleDelete(deleteConfirm)}>Delete</button></footer>
          </div>
        </div>
      )}

      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={() => setModal(m => ({ ...m, open: false }))} variant={modal.variant} />
    </div>
  );
}
