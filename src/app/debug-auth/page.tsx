'use client';

import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Get session
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      setSession(sessionData);

      // Test Purchase Orders API
      const poRes = await fetch('/api/purchase-orders?page=1&pageSize=5');
      const poData = await poRes.json();
      setApiTest({
        status: poRes.status,
        data: poData
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Authentication Debug Panel</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>📋 Session Data:</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '5px',
          overflow: 'auto'
        }}>
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>🔌 Purchase Orders API Test:</h2>
        <div>
          <strong>Status:</strong> {apiTest?.status}
        </div>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '5px',
          overflow: 'auto',
          marginTop: '10px'
        }}>
          {JSON.stringify(apiTest?.data, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>✅ Expected Values:</h2>
        <ul>
          <li><strong>Role:</strong> Should be "OWNER"</li>
          <li><strong>API Status:</strong> Should be 200</li>
          <li><strong>API Success:</strong> Should be true</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>🔧 Permissions Check:</h2>
        <ul>
          <li>OWNER can access Purchase Orders: <strong>{['OWNER', 'ACCOUNTS'].includes(session?.data?.user?.role) ? '✅ YES' : '❌ NO'}</strong></li>
          <li>Current Role: <strong>{session?.data?.user?.role || 'UNKNOWN'}</strong></li>
          <li>Shop ID: <strong>{session?.data?.user?.shopId || 'NULL'}</strong></li>
        </ul>
      </div>
    </div>
  );
}
