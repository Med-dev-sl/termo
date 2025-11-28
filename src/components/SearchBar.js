import React from 'react';

export default function SearchBar({ placeholder = 'Search terms, categories, videos...', onSearch, onChange }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && typeof onSearch === 'function') {
      onSearch(e.target.value);
    }
  };

  const handleChange = (e) => {
    if (typeof onChange === 'function') onChange(e.target.value);
  };

  const wrapperStyle = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '0 16px',
    // leave room for top-right profile badge on small screens
    paddingRight: 96
  };

  const boxStyle = {
    width: '100%',
    maxWidth: '1100px',
    // no minimum width so the input can shrink on very small screens
    boxSizing: 'border-box',
    position: 'relative'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 44px',
    borderRadius: 9999,
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(16,24,40,0.04)',
    fontSize: '1rem',
    outline: 'none',
    background: '#fff'
  };

  const iconStyle = {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 20,
    height: 20,
    pointerEvents: 'none',
    fill: '#6b7280'
  };

  return (
    <div style={wrapperStyle} aria-hidden="false">
      <div style={boxStyle}>
        <svg style={iconStyle} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21.71 20.29l-3.4-3.39A8 8 0 1 0 18 18l3.39 3.4a1 1 0 0 0 1.32-1.48zM4 10a6 6 0 1 1 6 6 6 6 0 0 1-6-6z" />
        </svg>
        <input
          type="search"
          aria-label="Search"
          placeholder={placeholder}
          style={inputStyle}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
