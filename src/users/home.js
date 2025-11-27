
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { authSignOut } from '../supabaseClient';

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authSignOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

		const displayName = (user && ((user.user_metadata && (user.user_metadata.name || user.user_metadata.full_name)) || user.email)) || 'Guest';

	return (
		<div className="user-home" style={{ padding: 20, maxWidth: 960, margin: '0 auto' }}>
			<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<div>
					<h1 style={{ margin: 0 }}>Welcome to Termo</h1>
					<p style={{ margin: '4px 0 0', color: '#555' }}>A quick way to browse and learn terms.</p>
				</div>
				<div style={{ textAlign: 'right' }}>
					<div style={{ fontWeight: 600 }}>{displayName}</div>
					<button onClick={handleLogout} style={{ marginTop: 8 }} aria-label="Sign out">Sign out</button>
				</div>
			</header>

			<main style={{ marginTop: 24 }}>
				<section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
					<Link to="/vocabulary" style={cardStyle} aria-label="Browse vocabulary">
						<h3>Browse Vocabulary</h3>
						<p>Explore terms and their definitions.</p>
					</Link>

					<Link to="/categories" style={cardStyle} aria-label="Categories">
						<h3>Categories</h3>
						<p>Find terms grouped by subject.</p>
					</Link>

					<Link to="/learn" style={cardStyle} aria-label="Learn">
						<h3>Learn</h3>
						<p>Practice with quizzes and examples.</p>
					</Link>

					<Link to="/profile" style={cardStyle} aria-label="Profile">
						<h3>Profile</h3>
						<p>View and edit your account details.</p>
					</Link>
				</section>

				<section style={{ marginTop: 28 }}>
					<h2>Quick actions</h2>
					<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
						<Link to="/vocabulary/new" style={{ padding: '8px 12px', background: '#1976d2', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>Add new term</Link>
						<Link to="/search" style={{ padding: '8px 12px', background: '#eee', color: '#111', borderRadius: 4, textDecoration: 'none' }}>Search</Link>
					</div>
				</section>
			</main>
		</div>
	);
}

const cardStyle = {
	display: 'block',
	padding: 16,
	borderRadius: 8,
	background: '#fafafa',
	border: '1px solid #eee',
	textDecoration: 'none',
	color: 'inherit',
};

export default Home;

