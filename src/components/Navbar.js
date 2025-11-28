import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const wrapper = {
    position: 'absolute',
    left: 12,
    top: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 30,
  };

  const brand = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer'
  };

  const logo = {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
  };

  const label = { display: 'none' };

  return (
    <div style={wrapper}>
      <div style={brand} onClick={() => navigate('/') } aria-label="Home">
        <div style={logo}>T</div>
        <div style={label}>Termo</div>
      </div>
    </div>
  );
}
