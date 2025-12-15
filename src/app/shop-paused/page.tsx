'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopPausedPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear session after 5 seconds and redirect to login
    const timer = setTimeout(() => {
      fetch('/api/auth/logout', { method: 'POST' })
        .then(() => router.push('/login'))
        .catch(() => router.push('/login'));
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>⏸️</div>
        
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#dc2626',
          marginBottom: '16px',
        }}>
          Shop Temporarily Paused
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          color: '#64748b',
          marginBottom: '32px',
          lineHeight: '1.6',
        }}>
          This shop has been temporarily paused by the Super Admin.
          Access to all features has been suspended.
        </p>

        <div style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: 600,
            color: '#991b1b',
            marginBottom: '12px',
          }}>
            🔄 Reactivation Process
          </h3>
          <ol style={{
            listStyle: 'decimal',
            paddingLeft: '20px',
            margin: 0,
            textAlign: 'left',
            color: '#7f1d1d',
          }}>
            <li style={{ padding: '8px 0', fontSize: '1rem' }}>
              Contact Super Admin to understand pause reason
            </li>
            <li style={{ padding: '8px 0', fontSize: '1rem' }}>
              Make payment of ₹40,000 via UPI for reactivation
            </li>
            <li style={{ padding: '8px 0', fontSize: '1rem' }}>
              Submit transaction ID for verification
            </li>
            <li style={{ padding: '8px 0', fontSize: '1rem' }}>
              Super Admin will reactivate your shop after verification
            </li>
          </ol>
        </div>

        <div style={{
          background: '#dbeafe',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <p style={{
            fontSize: '0.95rem',
            color: '#1e3a8a',
            margin: 0,
          }}>
            <strong>💼 Your Data is Safe</strong><br/>
            All your shop data remains intact and will be fully accessible once the shop is reactivated.
          </p>
        </div>

        <p style={{
          fontSize: '0.9rem',
          color: '#94a3b8',
          fontStyle: 'italic',
        }}>
          Redirecting to login page in 5 seconds...
        </p>

        <button
          onClick={() => router.push('/login')}
          style={{
            marginTop: '16px',
            padding: '12px 32px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#b91c1c'}
          onMouseOut={(e) => e.currentTarget.style.background = '#dc2626'}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
