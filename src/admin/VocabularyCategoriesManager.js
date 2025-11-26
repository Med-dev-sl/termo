import React, { useEffect, useState } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';

export default function VocabularyCategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });
  const [formModal, setFormModal] = useState({ open: false, mode: 'add', category: null });
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const q = query(collection(db, 'vocabulary_categories'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
      setCategories(data);
    } catch (err) {
      console.error('Fetch categories error', err);
      setModal({ open: true, variant: 'error', title: 'Fetch error', message: `Failed to load categories: ${err.message}` });
    } finally { setLoading(false); }
  }

  function openAdd() { setFormData({ id: '', name: '' }); setFormModal({ open: true, mode: 'add', category: null }); }
  function openEdit(cat) { setFormData({ id: cat.id || '', name: cat.name || '' }); setFormModal({ open: true, mode: 'edit', category: cat }); }
  function closeForm() { setFormModal({ open: false, mode: 'add', category: null }); setFormData({ id: '', name: '' }); }

  async function handleSave() {
    if (!formData.name.trim()) { setModal({ open: true, variant: 'error', title: 'Validation', message: 'Name is required' }); return; }
    try {
      if (formModal.mode === 'add') {
        await addDoc(collection(db, 'vocabulary_categories'), { id: formData.id || undefined, name: formData.name.trim(), createdAt: new Date() });
        setModal({ open: true, variant: 'success', title: 'Added', message: 'Category created' });
      } else {
        const docRef = doc(db, 'vocabulary_categories', formModal.category.docId);
        await updateDoc(docRef, { id: formData.id || undefined, name: formData.name.trim(), updatedAt: new Date() });
        setModal({ open: true, variant: 'success', title: 'Updated', message: 'Category updated' });
      }
      closeForm();
      fetchCategories();
    } catch (err) { console.error('Save category error', err); setModal({ open: true, variant: 'error', title: 'Save error', message: err.message }); }
  }

  async function handleDelete(cat) {
    try {
      const docRef = doc(db, 'vocabulary_categories', cat.docId);
      await deleteDoc(docRef);
      setDeleteConfirm(null);
      setModal({ open: true, variant: 'success', title: 'Deleted', message: 'Category deleted' });
      fetchCategories();
    } catch (err) { console.error('Delete category error', err); setModal({ open: true, variant: 'error', title: 'Delete error', message: err.message }); }
  }

  if (loading) return <div style={{ padding: '1rem' }}>Loading categories...</div>;

  return (
    <div style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Vocabulary Categories</h3>
        <button className="btn primary" onClick={openAdd}>+ Add Category</button>
      </div>

      {categories.length === 0 ? (
        <div style={{ background: '#f5f7fb', padding: '2rem', borderRadius: 8, textAlign: 'center', color: '#666' }}>
          No categories yet. <button className="btn" onClick={openAdd} style={{ marginLeft: '0.5rem' }}>Create one</button>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.docId}><td>{cat.id || '-'}</td><td>{cat.name}</td><td>
                <button className="btn-small" onClick={() => openEdit(cat)}>Edit</button>
                <button className="btn-small delete" onClick={() => setDeleteConfirm(cat)}>Delete</button>
              </td></tr>
            ))}
          </tbody>
        </table>
      )}

      {formModal.open && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <header className="modal-header"><h3>{formModal.mode === 'add' ? 'Add Category' : 'Edit Category'}</h3></header>
            <div className="modal-body">
              <label className="field"><span>ID (optional)</span><input type="text" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} /></label>
              <label className="field"><span>Name *</span><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></label>
            </div>
            <footer className="modal-footer"><button className="btn" onClick={closeForm}>Cancel</button><button className="btn primary" onClick={handleSave}>Save</button></footer>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <header className="modal-header"><h3>Confirm delete</h3></header>
            <div className="modal-body"><p>Are you sure you want to delete this category?</p></div>
            <footer className="modal-footer"><button className="btn" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="btn" style={{ background: '#e74c3c', color: '#fff' }} onClick={() => handleDelete(deleteConfirm)}>Delete</button></footer>
          </div>
        </div>
      )}

      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={() => setModal(m => ({ ...m, open: false }))} variant={modal.variant} />
    </div>
  );
}
