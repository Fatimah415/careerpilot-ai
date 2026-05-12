import React, { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Test backend connection when page loads
    fetch('http://127.0.0.1:5001/api/ping')
      .then(response => response.json())
      .then(data => {
        console.log('Backend response:', data);
        if (data.message === 'pong') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      })
      .catch(error => {
        console.error('Backend error:', error);
        setBackendStatus('error');
      });
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('Registering...');
    
    try {
      const response = await fetch('http://127.0.0.1:5001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          full_name: fullName
        })
      });
      
      const data = await response.json();
      console.log('Registration response:', data);
      
      if (response.ok) {
        setMessage(`✅ Registration successful! Token: ${data.token.substring(0, 50)}...`);
        localStorage.setItem('token', data.token);
      } else {
        setMessage(`❌ Error: ${data.error || 'Something went wrong'}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(`❌ Error: ${error.message}. Make sure backend is running on port 5000`);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#4CAF50' }}>🚀 CareerPilot AI</h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>System Status</h3>
        <p>✅ Frontend: Running</p>
        <p>
          Backend: {backendStatus === 'connected' && '✅ Connected'}
          {backendStatus === 'error' && '❌ Not Connected'}
          {backendStatus === 'checking' && '⏳ Checking...'}
        </p>
      </div>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '10px' }}>
        <h3 style={{ marginTop: 0 }}>Test Registration</h3>
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Full Name:</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Register
          </button>
        </form>
        {message && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: message.includes('✅') ? '#e8f5e9' : '#ffebee',
            borderRadius: '5px'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;