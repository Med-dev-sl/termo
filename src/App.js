import React from 'react';
import './App.css';
import Splash from './screens/splash';
import AdminDashboard from './screens/adminDashboard';
import Home from './users/home';
import CategoryTerms from './users/CategoryTerms';
import { AuthProvider, useAuth } from './AuthProvider';

function InnerApp() {
  const { user } = useAuth();

  // Quick in-app routing: if path starts with /admin, show AdminDashboard
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (path && path.startsWith('/admin')) return <AdminDashboard />;

  // If viewing a category's terms (e.g. /categories/:id) render CategoryTerms
  if (user && path && path.startsWith('/categories/')) {
    const parts = path.split('/').filter(Boolean);
    const cid = parts[1] ? decodeURIComponent(parts[1]) : null;
    return <CategoryTerms categoryId={cid} />;
  }

  if (user) return <Home />;

  return <Splash />;
}

export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}
