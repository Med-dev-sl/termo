import React, { useState, useEffect } from 'react';
import Logo from '../components/logo';
import SplashTitle from '../components/splashtitle';
import Onboarding from './onboarding';
import Login from './login';
import Signup from './signup';
import '../App.css';

export default function Splash() {
  // Show splash initially, then navigate to onboarding or login depending on whether user already saw onboarding
  const [next, setNext] = useState('splash'); // 'splash' | 'onboarding' | 'login'

  useEffect(() => {
    const t = setTimeout(() => {
      let seen = false;
      try { seen = localStorage.getItem('seenOnboarding') === '1'; } catch (e) { seen = false; }
      setNext(seen ? 'login' : 'onboarding');
    }, 2500); // 2.5s
    return () => clearTimeout(t);
  }, []);

  if (next === 'onboarding') return <Onboarding />;
  if (next === 'login') return <Login onSignup={() => setNext('onboarding')} />;

  return (
    <div className="App black-screen splash">
      <Logo alt="TermoPhysics logo" width={180} className="splash-logo" />
      <SplashTitle>TermoPhysics</SplashTitle>
    </div>
  );
}
