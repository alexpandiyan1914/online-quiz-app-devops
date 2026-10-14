import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '3.5rem 1rem 2.5rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '1rem', padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
          🎓 College DevOps Mini-Project
        </span>
        <h1 style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--dark-text)', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
          Interactive Online Quiz Platform
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--muted-text)', maxWidth: '650px', margin: '0 auto 2rem' }}>
          Evaluate engineering skills with timed assessments, server-side grading, instant reviews, and detailed answer explanations.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {user ? (
            user.role === 'ADMIN' ? (
              <Link to="/admin" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
                Go to Admin Dashboard &rarr;
              </Link>
            ) : (
              <Link to="/student" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
                Go to Student Portal &rarr;
              </Link>
            )
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
                Get Started as Student &rarr;
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
                Log In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Demo Credentials Box */}
      <div className="card" style={{ maxWidth: '750px', margin: '0 auto 3rem', borderLeft: '4px solid var(--primary)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔑</span> Quick Demo Credentials (Pre-seeded)
        </h3>
        <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Use these pre-configured accounts to test student quiz taking and administrative management:
        </p>
        <div className="grid grid-cols-2">
          <div style={{ padding: '0.75rem', background: 'var(--bg-color)', borderRadius: 'var(--radius)' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.25rem' }}>Student Account</span>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}><strong>Email:</strong> <code>student@example.com</code></p>
            <p style={{ fontSize: '0.9rem' }}><strong>Password:</strong> <code>Student123!</code></p>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-color)', borderRadius: 'var(--radius)' }}>
            <span className="badge badge-published" style={{ marginBottom: '0.25rem' }}>Admin Account</span>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}><strong>Email:</strong> <code>admin@example.com</code></p>
            <p style={{ fontSize: '0.9rem' }}><strong>Password:</strong> <code>Admin123!</code></p>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-3">
        <div className="card">
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏱️</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Timed Quizzes</h3>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.92rem' }}>
            Built-in countdown timers with automated submission prevent overtime submissions.
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛡️</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Server-Side Scoring</h3>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.92rem' }}>
            Answers and points are validated solely on the FastAPI backend, eliminating client-side tampering.
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💾</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pure JSON Storage</h3>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.92rem' }}>
            Zero database dependencies. Safe atomic file locks persist quizzes and attempts to disk.
          </p>
        </div>
      </div>
    </div>
  );
};
