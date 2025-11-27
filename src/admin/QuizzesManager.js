import React, { useEffect, useState } from 'react';
import '../App.css';
import Modal from '../components/Modal';
import { supabase } from '../supabaseClient';

export default function QuizzesManager() {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, title: '', message: '', variant: 'info' });
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [editing, setEditing] = useState(null);
  const blankForm = { id: '', categoryId: '', termId: '', question: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }], active: true };
  const [form, setForm] = useState(blankForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [qRes, cRes, tRes] = await Promise.all([
        supabase.from('quizzes').select('*').order('createdAt', { ascending: false }),
        supabase.from('vocabulary_categories').select('*').order('name', { ascending: true }),
        supabase.from('terms').select('*').order('name', { ascending: true }),
      ]);
      setQuizzes((qRes.data || []).map(d => ({ ...d, docId: d.id })));
      setCategories((cRes.data || []).map(d => ({ ...d, docId: d.id })));
      setTerms((tRes.data || []).map(d => ({ ...d, docId: d.id })));
    } catch (err) {
      console.error('Fetch quizzes error', err);
      setModal({ open: true, variant: 'error', title: 'Fetch error', message: String(err) });
    } finally { setLoading(false); }
  }

  function openAdd() { setForm(blankForm); setFormMode('add'); setEditing(null); setFormOpen(true); }
  function openEdit(q) { setForm({ id: q.id || '', categoryId: q.categoryId || '', termId: q.termId || '', question: q.question || '', options: q.options || [{ text:'', isCorrect:false }], active: !!q.active }); setEditing(q); setFormMode('edit'); setFormOpen(true); }
  function closeForm() { setForm(blankForm); setFormOpen(false); setEditing(null); }

  function addOption() { if (form.options.length >= 6) return; setForm({ ...form, options: [...form.options, { text: '', isCorrect: false }] }); }
  function removeOption(idx) { if (form.options.length <= 2) return; const opts = form.options.slice(); opts.splice(idx,1); setForm({ ...form, options: opts }); }
  function toggleCorrect(idx) { const opts = form.options.map((o,i) => ({ ...o, isCorrect: i === idx ? !o.isCorrect : o.isCorrect })); setForm({ ...form, options: opts }); }

  function validate() {
    if (!form.question || typeof form.question !== 'string' || form.question.trim().length < 3) { setModal({ open: true, variant: 'error', title: 'Validation', message: 'Please provide a question.' }); return false; }
    if (!Array.isArray(form.options) || form.options.length < 2) { setModal({ open: true, variant: 'error', title: 'Validation', message: 'Provide at least two options.' }); return false; }
    const hasText = form.options.every(o => typeof o.text === 'string' && o.text.trim().length > 0);
    if (!hasText) { setModal({ open: true, variant: 'error', title: 'Validation', message: 'All options must have text.' }); return false; }
    const oneCorrect = form.options.some(o => o.isCorrect === true);
    if (!oneCorrect) { setModal({ open: true, variant: 'error', title: 'Validation', message: 'Mark one option as the correct answer.' }); return false; }
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      const payload = {
        id: form.id || undefined,
        categoryId: form.categoryId || '',
        termId: form.termId || '',
        question: form.question.trim(),
        options: form.options.map(o => ({ text: o.text.trim(), isCorrect: !!o.isCorrect })),
        active: !!form.active,
      };
      let res;
      if (formMode === 'add') {
        payload.createdAt = new Date().toISOString();
        res = await supabase.from('quizzes').insert([payload]);
        if (res.error) throw res.error;
        setModal({ open: true, variant: 'success', title: 'Added', message: 'Quiz created' });
      } else if (editing) {
        payload.updatedAt = new Date().toISOString();
        res = await supabase.from('quizzes').update(payload).eq('id', form.id);
        if (res.error) throw res.error;
        setModal({ open: true, variant: 'success', title: 'Updated', message: 'Quiz updated' });
      }
      closeForm();
      fetchAll();
    } catch (err) {
      console.error('Save quiz error', err);
      setModal({ open: true, variant: 'error', title: 'Save error', message: String(err) });
    }
  }

  async function handleDelete(q) {
    try {
      const res = await supabase.from('quizzes').delete().eq('id', q.id);
      if (res.error) throw res.error;
      setDeleteConfirm(null);
      setModal({ open: true, variant: 'success', title: 'Deleted', message: 'Quiz deleted' });
      fetchAll();
    } catch (err) {
      console.error('Delete quiz error', err);
      setModal({ open: true, variant: 'error', title: 'Delete error', message: String(err) });
    }
  }

  const filteredTerms = form.categoryId ? terms.filter(t => t.categoryId === form.categoryId) : terms;

  if (loading) return <div style={{ padding: '1rem' }}>Loading quizzes...</div>;

  return (
    <div style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Quizzes</h3>
        <button className="btn primary" onClick={openAdd}>+ Add Quiz</button>
      </div>

      {quizzes.length === 0 ? (
        <div style={{ background: '#f5f7fb', padding: '2rem', borderRadius: 8, textAlign: 'center', color: '#666' }}>
          No quizzes yet. <button className="btn" onClick={openAdd} style={{ marginLeft: '0.5rem' }}>Create one</button>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Question</th><th>Category</th><th>Term</th><th>Options</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {quizzes.map(q => (
              <tr key={q.docId}><td>{q.id || '-'}</td><td style={{ maxWidth: 300 }}>{q.question}</td><td>{(categories.find(c => c.docId === q.categoryId) || {}).name || '-'}</td><td>{(terms.find(t => t.docId === q.termId) || {}).name || '-'}</td><td>{(q.options || []).length}</td><td>{q.active ? 'Yes' : 'No'}</td><td>
                <button className="btn-small" onClick={() => openEdit(q)}>Edit</button>
                <button className="btn-small delete" onClick={() => setDeleteConfirm(q)}>Delete</button>
              </td></tr>
            ))}
          </tbody>
        </table>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <header className="modal-header"><h3>{formMode === 'add' ? 'Add Quiz' : 'Edit Quiz'}</h3></header>
            <div className="modal-body">
              <label className="field"><span>ID (optional)</span><input type="text" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} /></label>
              <label className="field"><span>Category</span>
                <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value, termId: '' })}>
                  <option value="">-- none --</option>
                  {categories.map(c => <option key={c.docId} value={c.docId}>{c.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Term (optional)</span>
                <select value={form.termId} onChange={e => setForm({ ...form, termId: e.target.value })}>
                  <option value="">-- none --</option>
                  {filteredTerms.map(t => <option key={t.docId} value={t.docId}>{t.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Question *</span><input type="text" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} required /></label>
              <div style={{ marginTop: '.5rem' }}><strong>Options</strong></div>
              {form.options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.5rem' }}>
                  <input type="text" value={opt.text} onChange={e => { const arr = form.options.slice(); arr[idx].text = e.target.value; setForm({ ...form, options: arr }); }} style={{ flex: 1 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}><input type="checkbox" checked={!!opt.isCorrect} onChange={() => toggleCorrect(idx)} /> Correct</label>
                  <button className="btn-small" onClick={() => removeOption(idx)} disabled={form.options.length <= 2}>-</button>
                </div>
              ))}
              <div style={{ marginTop: '.5rem' }}><button className="btn" onClick={addOption} disabled={form.options.length >= 6}>Add Option</button></div>
              <label className="field"><span>Active</span><select value={form.active ? 'true' : 'false'} onChange={e => setForm({ ...form, active: e.target.value === 'true' })}><option value="true">Active</option><option value="false">Inactive</option></select></label>
            </div>
            <footer className="modal-footer"><button className="btn" onClick={closeForm}>Cancel</button><button className="btn primary" onClick={handleSave}>Save</button></footer>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <header className="modal-header"><h3>Confirm delete</h3></header>
            <div className="modal-body"><p>Are you sure you want to delete this quiz?</p></div>
            <footer className="modal-footer"><button className="btn" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="btn" style={{ background: '#e74c3c', color: '#fff' }} onClick={() => handleDelete(deleteConfirm)}>Delete</button></footer>
          </div>
        </div>
      )}

      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={() => setModal(m => ({ ...m, open: false }))} variant={modal.variant} />
    </div>
  );
}
