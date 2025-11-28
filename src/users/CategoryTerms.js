import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function CategoryTerms({ categoryId: propCategoryId }) {
  const [terms, setTerms] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photosByTerm, setPhotosByTerm] = useState({});
  const [videosByTerm, setVideosByTerm] = useState({});
  const [openTermId, setOpenTermId] = useState(null);

  // Determine categoryId from prop or window path
  const getCategoryId = () => {
    if (propCategoryId) return propCategoryId;
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'categories' && parts[1]) return decodeURIComponent(parts[1]);
    return null;
  };

  useEffect(() => {
    let mounted = true;
    const cid = getCategoryId();
    if (!cid) {
      if (mounted) setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        // fetch category name
        const cRes = await supabase.from('vocabulary_categories').select('id,name').eq('id', cid).single();
        if (cRes.error && cRes.error.code !== 'PGRST116') throw cRes.error; // ignore not found
        if (mounted) setCategory(cRes.data || { id: cid, name: cid });

        const tRes = await supabase.from('terms').select('*').eq('categoryId', cid).order('name', { ascending: true });
        if (tRes.error) throw tRes.error;
        const termList = tRes.data || [];
        if (mounted) setTerms(termList);

        // fetch photos and videos for these terms
        const termIds = termList.map(t => t.id).filter(Boolean);
        if (termIds.length) {
          const [pRes, vRes] = await Promise.all([
            supabase.from('photos').select('*').in('termId', termIds),
            supabase.from('videos').select('*').in('termId', termIds),
          ]);
          if (pRes.error) throw pRes.error;
          if (vRes.error) throw vRes.error;

          const photosMap = {};
          (pRes.data || []).forEach(p => {
            const key = p.termId || '';
            photosMap[key] = photosMap[key] || [];
            photosMap[key].push(p);
          });

          const videosMap = {};
          (vRes.data || []).forEach(v => {
            const key = v.termId || '';
            videosMap[key] = videosMap[key] || [];
            videosMap[key].push(v);
          });

          if (mounted) {
            setPhotosByTerm(photosMap);
            setVideosByTerm(videosMap);
          }
        } else {
          if (mounted) {
            setPhotosByTerm({});
            setVideosByTerm({});
          }
        }
      } catch (err) {
        console.error('Failed to load terms for category', err);
        if (mounted) setTerms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [propCategoryId]);

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.pathname = '/';
  };

  function renderVideoEmbed(url) {
    if (!url) return null;
    // Try to extract YouTube ID
    try {
      const ytMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
      const id = ytMatch ? ytMatch[1] : null;
      if (id) {
        return (
          <div style={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe title={`yt-${id}`} src={`https://www.youtube.com/embed/${id}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} allowFullScreen />
          </div>
        );
      }
    } catch (e) {
      // ignore
    }
    // fallback: link
    return (<a href={url} target="_blank" rel="noopener noreferrer">Open video</a>);
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button className="btn" onClick={goBack}>← Back</button>
        <h2 style={{ margin: 0 }}>{category ? category.name : 'Category'}</h2>
      </div>

      {loading ? (
        <div>Loading terms…</div>
      ) : (
        <div>
          {terms.length === 0 ? (
            <div style={{ color: '#64748b' }}>No terms found for this category.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {terms.map(t => (
                <li key={t.id} style={{ padding: 12, borderRadius: 8, background: '#fff', marginBottom: 8, boxShadow: '0 1px 2px rgba(2,6,23,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.name}</div>
                      {t.definition ? <div style={{ color: '#475569' }}>{t.definition}</div> : null}
                    </div>
                    <div>
                      <button className="btn" onClick={() => setOpenTermId(openTermId === t.id ? null : t.id)}>{openTermId === t.id ? 'Hide' : 'Show'}</button>
                    </div>
                  </div>

                  {openTermId === t.id && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ marginBottom: 8 }}><strong>Photos</strong></div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>
                        {(photosByTerm[t.id] || []).length === 0 ? (
                          <div style={{ color: '#64748b' }}>No photos for this term.</div>
                        ) : (
                          (photosByTerm[t.id] || []).map(p => (
                            <div key={p.id || p.docId} style={{ width: '100%' }}>
                              <img src={p.url} alt={t.name} loading="lazy" style={{ width: '100%', height: 'auto', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 6 }} />
                            </div>
                          ))
                        )}
                      </div>

                      <div style={{ marginBottom: 8 }}><strong>Videos</strong></div>
                      <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                        {(videosByTerm[t.id] || []).length === 0 ? (
                          <div style={{ color: '#64748b' }}>No videos for this term.</div>
                        ) : (
                          (videosByTerm[t.id] || []).map(v => (
                            <div key={v.id || v.docId} style={{ width: '100%' }}>
                              {renderVideoEmbed(v.url)}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
