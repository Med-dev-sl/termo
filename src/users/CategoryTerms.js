import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { t, localize, getLang } from '../i18n';

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

  function speakText(text) {
    if (!text) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      // stop any existing speech
      window.speechSynthesis.cancel();
    } catch (e) {}
    const utter = new SpeechSynthesisUtterance(String(text));
    const lang = getLang();
    utter.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
    try {
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('Speech synthesis failed', e);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button className="btn" onClick={goBack} aria-label={t('back')} title={t('back')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px', color: '#0f172a' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 style={{ margin: 0 }}>{category ? category.name : t('vocabularyCategories')}</h2>
      </div>

      {loading ? (
        <div>{t('loadingTerms')}</div>
      ) : (
        <div>
          {terms.length === 0 ? (
            <div style={{ color: '#64748b' }}>{t('noTermsForCategory')}</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {terms.map(term => (
                <li key={term.id} style={{ padding: 12, borderRadius: 8, background: '#fff', marginBottom: 8, boxShadow: '0 1px 2px rgba(2,6,23,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{localize(term, 'name')}</div>
                      {localize(term, 'definition') ? (
                        <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1 }}>{localize(term, 'definition')}</div>
                          <button className="btn" onClick={() => speakText(localize(term, 'definition'))} title={t('readAloud')} aria-label={t('readAloud')} style={{ padding: 6, minWidth: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0f172a' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                              <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" />
                              <path d="M16.5 12c0-1.77-.77-3.37-2-4.47v8.94c1.23-1.1 2-2.7 2-4.47z" fill="currentColor" />
                            </svg>
                            <span style={{ display: 'none' }}>{t('readAloud')}</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <button className="btn" onClick={() => setOpenTermId(openTermId === term.id ? null : term.id)}>{openTermId === term.id ? t('hide') : t('show')}</button>
                    </div>
                  </div>

                  {openTermId === term.id && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ marginBottom: 8 }}><strong>{t('photos')}</strong></div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 12 }}>
                        {(photosByTerm[term.id] || []).length === 0 ? (
                          <div style={{ color: '#64748b' }}>{t('noTermsForCategory')}</div>
                        ) : (
                          (photosByTerm[term.id] || []).map(p => (
                            <div key={p.id || p.docId} style={{ width: '100%' }}>
                              <img src={p.url} alt={localize(term, 'name')} loading="lazy" style={{ width: '100%', height: 'auto', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 6 }} />
                            </div>
                          ))
                        )}
                      </div>

                      <div style={{ marginBottom: 8 }}><strong>{t('videos')}</strong></div>
                      <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                        {(videosByTerm[term.id] || []).length === 0 ? (
                          <div style={{ color: '#64748b' }}>{t('noTermsForCategory')}</div>
                        ) : (
                          (videosByTerm[term.id] || []).map(v => (
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
