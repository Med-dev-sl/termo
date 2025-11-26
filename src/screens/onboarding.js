import React, { useState } from 'react';
import Login from './login';
import Signup from './signup';
import '../App.css';

export default function Onboarding() {
  const bg = (process.env.PUBLIC_URL || '') + '/onboarding-bg.svg';
  const [view, setView] = useState('home'); // 'home' | 'login' | 'signup'

  if (view === 'login') return <Login onBack={() => setView('home')} />;
  if (view === 'signup') return <Signup onBack={() => setView('home')} />;

  return (
    <section className="onboarding gradient-bg" style={{ backgroundImage: `url('${bg}')` }}>
      <h2 className="onboarding-title">Learn Physics Visually &amp; Bilingually</h2>
      <div className="onboarding-cta" style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button className="btn primary" onClick={() => setView('login')}>Login</button>
        <button className="btn" onClick={() => setView('signup')}>Sign Up</button>
      </div>
    </section>
  );
}
