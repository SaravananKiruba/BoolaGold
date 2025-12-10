'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionDebugPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkSession = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/session');
      const data = await response.json();
      setSessionData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const forceLogout = async () => {
    if (!confirm('Are you sure you want to logout? You will need to login again.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Logged out successfully! Click OK to go to login page.');
        router.push('/login');
      } else {
        alert('❌ Failed to logout: ' + data.message);
      }
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const hasShopId = sessionData?.session?.hasShopId;

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', fontFamily: 'system-ui' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ marginBottom: '30px' }}>🔧 Session Debug & Fix Tool</h1>
        
        <div style={{ margin: '20px 0', padding: '20px', background: '#f9f9f9', borderRadius: '5px' }}>
          <h2>Current Session Status</h2>
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ 
                border: '4px solid #f3f3f3', 
                borderTop: '4px solid #007bff',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
              <p>Checking session...</p>
            </div>
          )}

          {!loading && error && (
            <div style={{ background: '#fee', color: '#c33', padding: '15px', borderRadius: '5px', borderLeft: '4px solid #c33' }}>
              <strong>❌ Failed to check session</strong>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && sessionData && (
            <>
              {sessionData.success && sessionData.session ? (
                <>
                  <div style={{
                    background: hasShopId ? '#efe' : '#fee',
                    color: hasShopId ? '#3c3' : '#c33',
                    padding: '15px',
                    borderRadius: '5px',
                    borderLeft: `4px solid ${hasShopId ? '#3c3' : '#c33'}`,
                    marginBottom: '15px'
                  }}>
                    <strong>
                      {hasShopId 
                        ? '✅ Session is valid with shopId' 
                        : '❌ Session is missing shopId - This is the problem!'}
                    </strong>
                  </div>
                  <h3>Session Details:</h3>
                  <pre style={{ 
                    background: '#2d2d2d', 
                    color: '#f8f8f2', 
                    padding: '15px', 
                    borderRadius: '5px', 
                    overflowX: 'auto' 
                  }}>
                    {JSON.stringify(sessionData.session, null, 2)}
                  </pre>
                  {!hasShopId && (
                    <p style={{ marginTop: '15px', fontWeight: 'bold' }}>
                      ⚠️ You need to logout and login again to fix this issue!
                    </p>
                  )}
                </>
              ) : !sessionData.hasSession ? (
                <div style={{ background: '#ffc', color: '#c93', padding: '15px', borderRadius: '5px', borderLeft: '4px solid #c93' }}>
                  <strong>⚠️ No active session found</strong>
                  <p>You are not logged in. Please go to the login page.</p>
                </div>
              ) : (
                <div style={{ background: '#fee', color: '#c33', padding: '15px', borderRadius: '5px', borderLeft: '4px solid #c33' }}>
                  <strong>❌ Error checking session</strong>
                  <pre style={{ 
                    background: '#2d2d2d', 
                    color: '#f8f8f2', 
                    padding: '15px', 
                    borderRadius: '5px', 
                    overflowX: 'auto' 
                  }}>
                    {JSON.stringify(sessionData, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ margin: '20px 0', padding: '20px', background: '#f9f9f9', borderRadius: '5px' }}>
          <h2>Actions</h2>
          <button 
            onClick={checkSession}
            style={{ 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '5px', 
              cursor: 'pointer', 
              fontSize: '16px', 
              margin: '5px' 
            }}
          >
            🔍 Check Session
          </button>
          <button 
            onClick={forceLogout}
            style={{ 
              background: '#dc3545', 
              color: 'white', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '5px', 
              cursor: 'pointer', 
              fontSize: '16px', 
              margin: '5px' 
            }}
          >
            🚪 Force Logout
          </button>
          <button 
            onClick={() => router.push('/login')}
            style={{ 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '5px', 
              cursor: 'pointer', 
              fontSize: '16px', 
              margin: '5px' 
            }}
          >
            🔑 Go to Login
          </button>
        </div>

        <div style={{ margin: '20px 0', padding: '20px', background: '#f9f9f9', borderRadius: '5px' }}>
          <h2>Instructions</h2>
          <ol>
            <li>Click "Check Session" to see your current session details</li>
            <li>If shopId is missing, click "Force Logout"</li>
            <li>Click "Go to Login" and log in again</li>
            <li>Try recording payment again</li>
          </ol>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
