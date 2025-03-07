"use client"

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminDebugPage() {
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function checkEnv() {
      try {
        const response = await fetch('/api/test-env');
        const data = await response.json();
        setEnvStatus(data.data);
      } catch (error) {
        console.error('Error checking environment:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkEnv();
  }, []);

  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    
    setTesting(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.data.success) {
        toast.success('Test email sent successfully');
      } else {
        toast.error(`Failed to send test email: ${data.data.error}`);
      }
    } catch (error) {
      console.error('Error testing email:', error);
      toast.error('Error sending test email');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Email System Debug</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        
        {loading ? (
          <div className="animate-pulse">Loading environment status...</div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium mr-2">EMAIL_USER:</span>
              <span className={envStatus?.emailUserExists ? "text-green-600" : "text-red-600"}>
                {envStatus?.emailUserExists ? `Exists (${envStatus?.emailUser})` : "Missing"}
              </span>
            </div>
            
            <div className="flex items-center">
              <span className="font-medium mr-2">EMAIL_PASSWORD:</span>
              <span className={envStatus?.emailPasswordExists ? "text-green-600" : "text-red-600"}>
                {envStatus?.emailPasswordExists 
                  ? `Exists (${envStatus?.emailPasswordLength} characters)` 
                  : "Missing"}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Test Email Sending</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <button
            onClick={handleTestEmail}
            disabled={testing || !testEmail.includes('@')}
            className={`${
              testing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            } text-white px-4 py-2 rounded-md transition-colors`}
          >
            {testing ? 'Sending...' : 'Send Test Email'}
          </button>
          
          {result && (
            <div className="mt-4 border rounded-md p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 