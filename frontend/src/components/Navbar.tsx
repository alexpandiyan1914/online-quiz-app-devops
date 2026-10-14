import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span>🎓</span>
          <span>QuizMaster</span>
        </Link>

        <div className="nav-links">
          {!user ? (
            <>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          ) : user.role === 'ADMIN' ? (
            <>
              <Link to="/admin" className="nav-link">Dashboard</Link>
              <Link to="/admin/quizzes" className="nav-link">Quizzes</Link>
              <Link to="/admin/quizzes/create" className="btn btn-primary btn-sm">+ Create Quiz</Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                <span className="badge badge-published">ADMIN</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--muted-text)' }}>{user.full_name}</span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link to="/student" className="nav-link">Dashboard</Link>
              <Link to="/quizzes" className="nav-link">Available Quizzes</Link>
              <Link to="/attempts/my" className="nav-link">My History</Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                <span className="badge badge-primary">STUDENT</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--muted-text)' }}>{user.full_name}</span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">Logout</button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
