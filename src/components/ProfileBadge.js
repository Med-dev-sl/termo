import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { t, setLang, getLang } from '../i18n';

export default function ProfileBadge() {
  const { user, supabase } = useAuth() || {};
  const navigate = useNavigate();

  const avatar = (user && (user.user_metadata?.avatar_url || user.user_metadata?.avatar || null)) || null;
  const displayName = (user && (user.user_metadata?.name || user.user_metadata?.full_name || user.email)) || 'Guest';

  const wrapper = {
    position: 'absolute',
    right: 12,
    top: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 30,
  };

  const circle = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#3730a3',
    cursor: 'pointer'
  };

  const nameStyle = {
    display: 'none',
    fontSize: '.95rem',
    color: '#111827'
  };

  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(avatar || '');
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [lang, setLangState] = useState(getLang());

  const openProfile = () => {
    setAvatarUrl(avatar || '');
    setEmail(user?.email || '');
    setMessage('');
    setOpen(true);
  };

  const closeProfile = () => { setOpen(false); setFile(null); setPassword(''); setConfirmPassword(''); };

  async function handleSignOut() {
    try {
      if (supabase && supabase.auth && typeof supabase.auth.signOut === 'function') {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out error', err);
    } finally {
      navigate('/');
    }
  }

  async function handleSaveProfile() {
    setMessage('');
    try {
      let avatarToSet = avatarUrl;

      // If a file was chosen and storage is available, try upload
      if (file && supabase && supabase.storage && typeof supabase.storage.from === 'function') {
        try {
          const bucket = 'avatars';
          const path = `${user?.id || 'anon'}-${Date.now()}-${file.name}`;
          const up = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
          if (up.error) throw up.error;
          const publicUrl = supabase.storage.from(bucket).getPublicUrl(up.data.path).publicURL;
          avatarToSet = publicUrl;
        } catch (err) {
          console.warn('Avatar upload failed', err);
          // fall back to URL field
        }
      }

      // Prepare attributes for update
      const attrs = {};
      if (avatarToSet) attrs.data = { ...(user?.user_metadata || {}), avatar_url: avatarToSet };
      if (email && email !== user?.email) attrs.email = email;
      if (password) {
        if (password !== confirmPassword) {
          setMessage('Passwords do not match');
          return;
        }
        attrs.password = password;
      }

      // call supabase auth update
      if (supabase && supabase.auth) {
        if (typeof supabase.auth.updateUser === 'function') {
          const res = await supabase.auth.updateUser(attrs);
          if (res.error) throw res.error;
        } else if (typeof supabase.auth.update === 'function') {
          const res = await supabase.auth.update(attrs);
          if (res.error) throw res.error;
        } else {
          throw new Error('Auth update not available');
        }
      }

      setMessage('Saved');
      setTimeout(() => { closeProfile(); }, 800);
    } catch (err) {
      console.error('Profile save error', err);
      setMessage(err.message || String(err));
    }
  }

  function handleLangChange(e) {
    const v = e.target.value === 'ru' ? 'ru' : 'en';
    try { setLang(v); } catch (e) {}
    setLangState(v);
    // reload to update strings across app
    window.location.reload();
  }

  return (
    <div style={wrapper} aria-hidden={false}>
      <div title={String(displayName)} style={circle} onClick={openProfile}>
        {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (displayName ? String(displayName).charAt(0).toUpperCase() : '?')}
      </div>
      <div style={nameStyle}>{displayName}</div>

      {open && (
        <div className="modal-backdrop" onClick={closeProfile}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <header className="modal-header"><h3>{displayName}</h3></header>
            <div className="modal-body">
              <label className="field"><span>{t('uploadAvatar')}</span>
                <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
                <div style={{ marginTop: 8 }}>
                  <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
              </label>

              <label className="field"><span>{t('email')}</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
              <label className="field"><span>{t('password')}</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
              <label className="field"><span>{t('confirmPassword')}</span><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label>

              <label className="field"><span>{t('language')}</span>
                <select value={lang} onChange={handleLangChange}>
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                </select>
              </label>

              {message ? <div style={{ marginTop: 8, color: message === 'Saved' ? 'green' : 'red' }}>{message}</div> : null}
            </div>
            <footer className="modal-footer">
              <button className="btn" onClick={closeProfile}>Cancel</button>
              <button className="btn" onClick={handleSignOut} style={{ marginLeft: 8 }}>{t('logout')}</button>
              <button className="btn primary" onClick={handleSaveProfile} style={{ marginLeft: 8 }}>{t('save')}</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
