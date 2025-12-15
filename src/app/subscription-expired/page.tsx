'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscriptionExpiredPage() {
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>⏰</div>
        
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#dc2626',
          marginBottom: '16px',
        }}>
          Subscription Expired
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          color: '#64748b',
          marginBottom: '32px',
          lineHeight: '1.6',
        }}>
          Your subscription has expired. Please contact your shop owner to renew the subscription
          and continue using the system.
        </p>

        <div style={{
          background: '#fef3c7',
          border: '2px solid #fbbf24',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: 600,
            color: '#92400e',
            marginBottom: '12px',
          }}>
            💰 Renewal Options
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            textAlign: 'left',
            color: '#78350f',
          }}>
            <li style={{ padding: '8px 0', fontSize: '1rem' }}>
              <strong>Annual Subscription:</strong> ₹40,000/year
            </li>
            <li style={{ padding: '8px 0', fontSize: '1rem' }}>
              <strong>AMC Renewal:</strong> ₹10,000/year
            </li>
          </ul>
        </div>

        <div style={{
          background: '#e0e7ff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <p style={{
            fontSize: '0.95rem',
            color: '#3730a3',
            margin: 0,
          }}>
            <strong>📞 Contact Super Admin</strong><br/>
            To renew your subscription, please submit payment via UPI and contact the platform administrator for verification.
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
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#5568d3'}
          onMouseOut={(e) => e.currentTarget.style.background = '#667eea'}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
