
import React, { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import ProfileBadge from '../components/ProfileBadge';
import { t, localize } from '../i18n';
import { getAllCategories } from '../admin/VocabularyCategoriesManager';
import { supabase } from '../supabaseClient';

export default function Home() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; }
  });

  useEffect(() => {
    try { localStorage.setItem('theme', theme); } catch (e) {}
    // apply class to root container
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getAllCategories();
        if (mounted) setCategories(data || []);
      } catch (err) {
        console.error('Failed to load categories', err.message || err);
        if (mounted) setCategories([]);
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      // Try the shared loader first
      const data = await getAllCategories();
      if (Array.isArray(data) && data.length) {
        setCategories(data);
        return;
      }
      // Fallback: direct select * (helps if column names differ)
      const res = await supabase.from('vocabulary_categories').select('*').order('name', { ascending: true });
      if (res.error) throw res.error;
      setCategories(res.data || []);
    } catch (err) {
      console.error('Reload failed', err);
      setError(err.message || String(err));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (name, icon) => {
    if (icon) {
      return <img src={icon} alt="icon" style={{ width: 28, height: 28, objectFit: 'contain' }} />;
    }
    if (String(name).toLowerCase().includes('electric')) {
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" fill="#fff" />
        </svg>
      );
    }
    return (
      <div style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.2)' }} />
    );
  };

  return (
    <div className={`page-root ${theme} home`} style={{ minHeight: '100vh', minWidth: '100%', position: 'relative', paddingBottom: 32 }}>
      <div style={{ position: 'relative', paddingTop: 24, paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <SearchBar onChange={setSearchQuery} onSearch={q => setSearchQuery(q)} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="control-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} aria-label="Toggle theme">{theme === 'dark' ? '🌞' : '🌙'}</button>
          </div>
        </div>
        <div style={{ position: 'absolute', right: 12, top: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <ProfileBadge />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '18px auto 0', padding: '0 16px' }}>
        <h2 style={{ margin: '8px 0 16px', color: '#0f172a' }}>{t('vocabularyCategories')}</h2>

        {loading ? (
          <div style={{ color: 'var(--muted)' }}>{t('loadingCategories')}</div>
        ) : (
          <div>
              <div style={{ marginBottom: 12, color: '#334155' }}>
                <strong>{t('searchLabel')}:</strong> "{searchQuery || 'all'}"
                <button onClick={() => { setSearchQuery(''); }} style={{ marginLeft: 12 }} className="btn">{t('clear')}</button>
              </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {(categories || []).filter(cat => {
                if (!searchQuery) return true;
                return String(localize(cat, 'name') || '').toLowerCase().includes(searchQuery.toLowerCase());
              }).map((c) => (
                <div key={c.id} onClick={() => { window.location.pathname = `/categories/${encodeURIComponent(c.id)}`; }} style={{ background: '#0b3d91', color: '#fff', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12, minHeight: 84, cursor: 'pointer' }}>
                  <div style={{ flexShrink: 0 }}>
                    {renderIcon(localize(c, 'name'))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{localize(c, 'name')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

