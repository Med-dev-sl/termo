import React from 'react';

/**
 * SplashTitle
 * Renders a splash screen title using the global `.splash-title` class.
 * Props:
 *  - children: text or nodes to render (default: 'TermoPhysics')
 */
export default function SplashTitle({ children = 'TermoPhysics' }) {
  return <h1 className="splash-title">{children}</h1>;
}
