import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { AdminDashboardStats, QuizAdminDetail } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [quizzes, setQuizzes] = useState<QuizAdminDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, quizzesData] = await Promise.all([
          api.getAdminDashboard(),
          api.getAdminQuizzes(),
        ]);
        setStats(statsData);
        setQuizzes(quizzesData);
      } catch (err: any) {
        setError(err.message || 'Failed to load admin dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-text)' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '1rem' }}>
            System overview, quiz management, and student participation metrics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/quizzes" className="btn btn-secondary">
            Manage Quizzes
          </Link>
          <Link to="/admin/quizzes/create" className="btn btn-primary">
            + Create New Quiz
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats Metric Cards */}
      {stats && (
        <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <span className="stat-label">Total Quizzes</span>
            <span className="stat-value">
              {stats.total_quizzes}{' '}
              <span style={{ fontSize: '0.95rem', color: 'var(--success)', fontWeight: 600 }}>
                ({stats.published_quizzes} Published)
              </span>
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Total Questions Bank</span>
            <span className="stat-value">{stats.total_questions}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Registered Students</span>
            <span className="stat-value">{stats.total_students}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Total Attempts Submitted</span>
            <span className="stat-value">{stats.total_attempts}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Average Student Score</span>
            <span className="stat-value">{stats.average_score_percentage}%</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Persistent Storage</span>
            <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--primary)', marginTop: '0.4rem' }}>
              JSON File Store
            </span>
          </div>
        </div>
      )}

      {/* Quizzes Overview Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Quizzes</h2>
          <Link to="/admin/quizzes" className="btn btn-outline btn-sm">
            View All ({quizzes.length}) &rarr;
          </Link>
        </div>

        {quizzes.length === 0 ? (
          <p style={{ color: 'var(--muted-text)' }}>No quizzes created yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Passing %</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.slice(0, 5).map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600 }}>{q.title}</td>
                    <td>{q.question_count}</td>
                    <td>{q.duration_minutes} min</td>
                    <td>{q.passing_percentage}%</td>
                    <td>
                      <span className={`badge ${q.is_published ? 'badge-published' : 'badge-draft'}`}>
                        {q.is_published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/admin/quizzes/${q.id}/questions`} className="btn btn-secondary btn-sm" style={{ marginRight: '0.5rem' }}>
                        Questions ({q.question_count})
                      </Link>
                      <Link to={`/admin/quizzes/${q.id}/edit`} className="btn btn-outline btn-sm">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
