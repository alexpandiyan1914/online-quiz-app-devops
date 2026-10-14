import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p style={{ fontWeight: 600, color: 'var(--dark-text)', marginBottom: '0.25rem' }}>
          Online Quiz Application — DevOps College Mini-Project
        </p>
        <p>
          FastAPI Backend &bull; React + TypeScript Frontend &bull; JSON Storage &bull; Docker &amp; Cloud Run Ready
        </p>
      </div>
    </footer>
  );
};
