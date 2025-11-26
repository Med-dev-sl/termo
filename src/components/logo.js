import React from 'react';

/**
 * Logo component
 * Renders the project's logo (served from public/logo.png).
 * Usage: <Logo alt="My app" width={120} className="my-class" />
 */
export default function Logo({ alt = 'Logo', width = 120, height = 'auto', className = '' }) {
	// The logo is placed in the public folder, reference via PUBLIC_URL so webpack
	// doesn't try to bundle it.
	const src = (process.env.PUBLIC_URL || '') + '/logo.png';

	return (
		<img
			src={src}
			alt={alt}
			width={width}
			height={height}
			className={("app-logo " + className).trim()}
			style={{ display: 'block' }}
		/>
	);
}
