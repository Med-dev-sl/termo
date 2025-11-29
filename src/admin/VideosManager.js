import React, { useEffect, useState, useMemo } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import { supabase } from '../supabaseClient';

export default function VideosManager() {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [terms, setTerms] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });
  const [formModal, setFormModal] = useState({ open: false, mode: 'add', video: null });
  const [formData, setFormData] = useState({ id: '', url: '', categoryId: '', termId: '', photoIds: [], active: true });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  // UI state: search / filters / sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterTermId, setFilterTermId] = useState('');
  const [filterActive, setFilterActive] = useState('any'); // 'any' | 'true' | 'false'
  const [sortBy, setSortBy] = useState('createdAt'); // createdAt | url | active
  const [sortDir, setSortDir] = useState('desc'); // asc | desc

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [vRes, cRes, tRes, pRes] = await Promise.all([
        supabase.from('videos').select('*').order('createdAt', { ascending: false }),
        supabase.from('vocabulary_categories').select('*').order('name', { ascending: true }),
        supabase.from('terms').select('*').order('name', { ascending: true }),
        supabase.from('photos').select('*').order('createdAt', { ascending: false }),
      ]);

      if (vRes.error) throw vRes.error;
      if (cRes.error) throw cRes.error;
      if (tRes.error) throw tRes.error;
      if (pRes.error) throw pRes.error;

      setVideos((vRes.data || []).map(d => ({ ...d, docId: d.id })));
      setCategories((cRes.data || []).map(d => ({ ...d, docId: d.id })));
      setTerms((tRes.data || []).map(d => ({ ...d, docId: d.id })));
      setPhotos((pRes.data || []).map(d => ({ ...d, docId: d.id })));
    } catch (err) {
      console.error('Fetch videos error', err);
      setModal({ open: true, variant: 'error', title: 'Fetch error', message: `Failed to load data: ${err.message}` });
    } finally { setLoading(false); }
  }

  function openAdd() { setFormData({ id: '', url: '', categoryId: '', termId: '', photoIds: [], active: true }); setFormModal({ open: true, mode: 'add', video: null }); }
  function openEdit(v) { setFormData({ id: v.id || '', url: v.url || '', categoryId: v.categoryId || '', termId: v.termId || '', photoIds: Array.isArray(v.photoIds) ? v.photoIds : (v.photoIds || []), active: !!v.active }); setFormModal({ open: true, mode: 'edit', video: v }); }
  function closeForm() { setFormModal({ open: false, mode: 'add', video: null }); setFormData({ id: '', url: '', categoryId: '', photoIds: [], active: true }); }

  function validate() {
    if (!formData.url || typeof formData.url !== 'string' || !formData.url.match(/^https?:\/\//)) {
      setModal({ open: true, variant: 'error', title: 'Validation', message: 'Please provide a valid video URL (http/https).'});
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      const payload = {
        url: formData.url.trim(),
        categoryId: formData.categoryId || null,
        termId: formData.termId || null,
        photoIds: Array.isArray(formData.photoIds) ? formData.photoIds : (formData.photoIds ? [formData.photoIds] : []),
        active: !!formData.active,
      };
      let res;
      if (formModal.mode === 'add') {
        // Do not send `id` on insert — allow Postgres to generate a UUID id
        payload.createdAt = new Date().toISOString();
        res = await supabase.from('videos').insert([payload]);
        if (res.error) throw res.error;
        setModal({ open: true, variant: 'success', title: 'Added', message: 'Video created' });
      } else {
        // Edit mode: require an id to update
        const idToUpdate = formData.id;
        if (!idToUpdate) {
          setModal({ open: true, variant: 'error', title: 'Validation', message: 'Missing video id for update.' });
          return;
        }
        payload.updatedAt = new Date().toISOString();
        res = await supabase.from('videos').update(payload).eq('id', idToUpdate);
        if (res.error) throw res.error;
        setModal({ open: true, variant: 'success', title: 'Updated', message: 'Video updated' });
      }
      closeForm();
      fetchAll();
    } catch (err) {
      console.error('Save video error:', err);
      setModal({ open: true, variant: 'error', title: 'Save error', message: err.message });
    }
  }

  async function handleDelete(v) {
    try {
      const res = await supabase.from('videos').delete().eq('id', v.id);
      if (res.error) throw res.error;
      setDeleteConfirm(null);
      setModal({ open: true, variant: 'success', title: 'Deleted', message: 'Video deleted' });
      fetchAll();
    } catch (err) {
      console.error('Delete video error', err);
      setModal({ open: true, variant: 'error', title: 'Delete error', message: err.message });
    }
  }

  // derive filtered + sorted list
  const filteredVideos = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    let list = Array.isArray(videos) ? videos.slice() : [];
    if (q) {
      list = list.filter(v => ((v.url || '').toLowerCase().includes(q) || (String(v.id || '')).toLowerCase().includes(q)));
    }
    if (filterCategoryId) list = list.filter(v => v.categoryId === filterCategoryId);
    if (filterTermId) list = list.filter(v => v.termId === filterTermId);
    if (filterActive === 'true') list = list.filter(v => !!v.active);
    if (filterActive === 'false') list = list.filter(v => !v.active);

    // sorting
    list.sort((a, b) => {
      let av = a[sortBy];
      let bv = b[sortBy];
      if (sortBy === 'createdAt') {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      }
      if (sortBy === 'url' || sortBy === 'active') {
        av = av || '';
        bv = bv || '';
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [videos, searchQuery, filterCategoryId, filterTermId, filterActive, sortBy, sortDir]);

  if (loading) return <div style={{ padding: '1rem' }}>Loading videos...</div>;

  return (
    <div style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Videos</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn primary" onClick={openAdd}>+ Add Video</button>
        </div>
      </div>

      {/* Filters & search */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input placeholder="Search URL or ID" className="field" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ minWidth: 220 }} />

        <select value={filterCategoryId} onChange={e => { setFilterCategoryId(e.target.value); setFilterTermId(''); }}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.docId} value={c.docId}>{c.name}</option>)}
        </select>

        <select value={filterTermId} onChange={e => setFilterTermId(e.target.value)}>
          <option value="">All terms</option>
          {terms.filter(t => !filterCategoryId || t.categoryId === filterCategoryId).map(t => <option key={t.docId} value={t.docId}>{t.name}</option>)}
        </select>

        <select value={filterActive} onChange={e => setFilterActive(e.target.value)}>
          <option value="any">Any</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          Sort:
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="createdAt">Created</option>
            <option value="url">URL</option>
            <option value="active">Active</option>
          </select>
        </label>

        <select value={sortDir} onChange={e => setSortDir(e.target.value)}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      {filteredVideos.length === 0 ? (
        <div style={{ background: '#f5f7fb', padding: '2rem', borderRadius: 8, textAlign: 'center', color: '#666' }}>
          No videos match your filters. <button className="btn" onClick={openAdd} style={{ marginLeft: '0.5rem' }}>Create one</button>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Video URL</th><th>Category</th><th>Term</th><th>Photos</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredVideos.map(v => (
              <tr key={v.docId}><td>{v.id || '-'}</td><td><a href={v.url} target="_blank" rel="noopener noreferrer">{(v.url || '').slice(0, 60)}...</a></td><td>{(categories.find(c => c.docId === v.categoryId) || {}).name || '-'}</td><td>{(terms.find(t => t.docId === v.termId) || {}).name || '-'}</td><td>{(v.photoIds || []).length}</td><td>{v.active ? 'Yes' : 'No'}</td><td>
                <button className="btn-small" onClick={() => openEdit(v)}>Edit</button>
                <button className="btn-small delete" onClick={() => setDeleteConfirm(v)}>Delete</button>
              </td></tr>
            ))}
          </tbody>
        </table>
      )}

      {formModal.open && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <header className="modal-header"><h3>{formModal.mode === 'add' ? 'Add Video' : 'Edit Video'}</h3></header>
            <div className="modal-body">
              {formModal.mode === 'edit' && (
                <label className="field"><span>ID</span><input type="text" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} readOnly /></label>
              )}
              <label className="field"><span>Video URL *</span><input type="text" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} required placeholder="https://www.youtube.com/watch?v=VIDEO_ID" /></label>
              <label className="field"><span>Category</span>
                <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value, termId: '' })}>
                  <option value="">-- none --</option>
                  {categories.map(c => <option key={c.docId} value={c.docId}>{c.name}</option>)}
                </select>
              </label>
              {formData.categoryId && (
                <label className="field"><span>Term</span>
                  <select value={formData.termId} onChange={e => setFormData({ ...formData, termId: e.target.value })}>
                    <option value="">-- none --</option>
                    {terms.filter(t => t.categoryId === formData.categoryId).map(t => <option key={t.docId} value={t.docId}>{t.name}</option>)}
                  </select>
                </label>
              )}
              <label className="field"><span>Attach Photos</span>
                <select multiple value={formData.photoIds} onChange={e => setFormData({ ...formData, photoIds: Array.from(e.target.selectedOptions).map(o => o.value) })} style={{ minHeight: 80 }}>
                  {photos.map(p => <option key={p.docId} value={p.docId}>{(p.id || p.docId) + ' — ' + (p.url || '').slice(0, 60)}</option>)}
                </select>
              </label>
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
            <div className="modal-body"><p>Are you sure you want to delete this video?</p></div>
            <footer className="modal-footer"><button className="btn" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="btn" style={{ background: '#e74c3c', color: '#fff' }} onClick={() => handleDelete(deleteConfirm)}>Delete</button></footer>
          </div>
        </div>
      )}

      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={() => setModal(m => ({ ...m, open: false }))} variant={modal.variant} />
    </div>
  );
}
