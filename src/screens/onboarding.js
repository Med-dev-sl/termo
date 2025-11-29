import React, { useEffect, useState, useRef } from 'react';
import Login from './login';
import Signup from './signup';
import '../App.css';

// Two-slide onboarding with typing animation and bilingual quotes.
export default function Onboarding() {
  const [view, setView] = useState('slides'); // 'slides' | 'login' | 'signup'
  const slides = [
    {
      bg: (process.env.PUBLIC_URL || '') + '/onboarding1.jpg',
      en: '"The important thing is to not stop questioning. Curiosity has its own reason for existing." — Albert Einstein',
      ru: '«Важно не переставать задавать вопросы. Любопытство имеет свою собственную причину существования.» — Альберт Эйнштейн'
    },
    {
      bg: (process.env.PUBLIC_URL || '') + '/onboarding2.jpg',
      en: '"Science is a way of trying not to fool yourself. The first principle is that you must not fool yourself." — Richard Feynman',
      ru: '«Наука — это способ не обманывать себя. Первый принцип: не обманывать себя.» — Ричард Фейнман'
    }
  ];

  const [index, setIndex] = useState(0);
  const [typedEn, setTypedEn] = useState('');
  const [typedRu, setTypedRu] = useState('');
  const [phase, setPhase] = useState('typingEn'); // typingEn | pause | typingRu | done
  const typingInterval = useRef(null);

  useEffect(() => {
    if (view !== 'slides') return;

    const slide = slides[index];
    setTypedEn('');
    setTypedRu('');
    setPhase('typingEn');

    // type English
    let i = 0;
    clearInterval(typingInterval.current);
    typingInterval.current = setInterval(() => {
      i += 1;
      setTypedEn(slide.en.slice(0, i));
      if (i >= slide.en.length) {
        clearInterval(typingInterval.current);
        setPhase('pause');
        // small pause then type Russian
        setTimeout(() => {
          setPhase('typingRu');
          let j = 0;
          typingInterval.current = setInterval(() => {
            j += 1;
            setTypedRu(slide.ru.slice(0, j));
            if (j >= slide.ru.length) {
              clearInterval(typingInterval.current);
              setPhase('done');
              // after pause, advance
              setTimeout(() => {
                if (index < slides.length - 1) setIndex(idx => idx + 1);
                else setView('login');
              }, 1500);
            }
          }, 25);
        }, 900);
      }
    }, 28);

    return () => clearInterval(typingInterval.current);
  }, [index, view]);

  const skip = () => setView('login');

  if (view === 'login') return <Login onBack={() => setView('slides')} onSignup={() => setView('signup')} />;
  if (view === 'signup') return <Signup onBack={() => setView('slides')} onLogin={() => setView('login')} />;

  const slide = slides[index];

  return (
    <section className="onboarding" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundImage: `url('${slide.bg}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* black overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55))' }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, padding: '1.25rem', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '1.25rem', marginBottom: 12, opacity: 0.95 }}>Learn Physics Visually & Bilingually</div>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem 1.25rem', borderRadius: 10, display: 'inline-block', minWidth: 320 }}>
          <div className="quote" style={{ fontSize: '1rem', lineHeight: 1.4, minHeight: 60 }}>{typedEn}</div>
          <div className="quote" style={{ marginTop: 10, fontSize: '0.95rem', color: '#dbe7ff', minHeight: 60 }}>{typedRu}</div>
        </div>

        {/* Fixed bottom controls: Skip (bottom-left) and Continue/Next (bottom-right) pinned to viewport */}
        <div style={{ position: 'fixed', left: 16, bottom: 16, zIndex: 9999 }}>
          <button className="btn" onClick={skip}>Skip</button>
        </div>
        <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
          <button className="btn primary" onClick={() => { if (phase === 'done') { if (index < slides.length - 1) setIndex(idx => idx + 1); else setView('login'); } else { setView('login'); } }}>{phase === 'done' ? (index < slides.length - 1 ? 'Next' : 'Continue to Login') : 'Continue to Login'}</button>
        </div>
      </div>
    </section>
  );
}
