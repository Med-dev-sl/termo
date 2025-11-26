import React from 'react';
import '../App.css';

export default function Sidebar({ className }) {
  return (
    <aside className={`sidebar ${className || ''}`} aria-label="Admin sidebar">
      <div className="sidebar-brand">TermoPhysics</div>
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
