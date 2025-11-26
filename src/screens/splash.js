import React, { useState, useEffect } from 'react';
import Logo from '../components/logo';
import SplashTitle from '../components/splashtitle';
import Onboarding from './onboarding';
import '../App.css';

export default function Splash() {
  // Show splash initially, then navigate to onboarding after a short delay
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowOnboarding(true), 2500); // 2.5s
    return () => clearTimeout(t);
  }, []);

  if (showOnboarding) {
    return <Onboarding />;
  }

  return (
    <div className="App black-screen splash">
      <Logo alt="TermoPhysics logo" width={180} className="splash-logo" />
      <SplashTitle>TermoPhysics</SplashTitle>
    </div>
  );
}
