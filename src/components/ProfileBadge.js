import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

export default function ProfileBadge() {
  const { user } = useAuth() || {};
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/profile');
  };

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

  return (
    <div style={wrapper} aria-hidden={false}>
      <div title={String(displayName)} style={circle} onClick={handleClick}>
        {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (displayName ? String(displayName).charAt(0).toUpperCase() : '?')}
      </div>
      <div style={nameStyle}>{displayName}</div>
    </div>
  );
}
