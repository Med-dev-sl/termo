import React, { useEffect, useState } from 'react';
import '../App.css';

export default function Sidebar({ className }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebarCollapsed') === '1'; } catch (e) { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0'); } catch (e) {}
  }, [collapsed]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${className || ''}`} aria-label="Admin sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="sidebar-brand">TermoPhysics</div>
        <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>
      </div>
      <nav className="sidebar-nav">
        <a href="/admin" className="sidebar-link">Dashboard</a>
        <a href="/admin#terms" className="sidebar-link">Terms</a>
        <a href="/admin#vocabulary_categories" className="sidebar-link">Vocabulary Categories</a>
        <a href="/admin#videos" className="sidebar-link">Videos</a>
        <a href="/admin#photos" className="sidebar-link">Photos</a>
        <a href="/admin#quizzes" className="sidebar-link">Quizzes</a>
        <a href="/admin#reports" className="sidebar-link">Reports</a>
        <a href="/admin#settings" className="sidebar-link">Settings</a>
        <a href="/admin#users" className="sidebar-link">Users</a>
      </nav>
      <div style={{ marginTop: 'auto', padding: '1rem', fontSize: '.85rem', color:'#999' }}>
        <div>Signed in as</div>
        <div style={{ fontWeight: 600 }}>admin</div>
      </div>
    </aside>
  );
}
