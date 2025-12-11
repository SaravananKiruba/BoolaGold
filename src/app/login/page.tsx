'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Trim values to remove any whitespace
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect based on role
        const userRole = data.user?.role;
        
        if (userRole === 'SUPER_ADMIN') {
          router.push('/super-admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        setError(data.message || 'Invalid username or password');
        setLoading(false);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          padding: '48px',
          maxWidth: '440px',
          width: '100%',
        }}
      >
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>💎</div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '2rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-gold))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}
          >
            BoolaGold
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Jewelry Store Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'var(--transition)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'var(--transition)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                background: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: 600,
              background: loading
                ? 'var(--color-border)'
                : 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'var(--transition)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Info */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: 'var(--color-background)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
          }}
        >
          <strong>Demo Credentials:</strong>
          <br />
          Username: admin | Password: admin
        </div>
      </div>
    </div>
  );
}
