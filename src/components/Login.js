import '../style/Login.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(process.env.REACT_APP_API_URL + '/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (error) {
      setError(error.message || 'Server error');
    }
  };

  return (
    <div>
      <header>
        <div className="header-top">
          <div className="logo">
            <img
              src="/logo.png"
              alt="Money Tracker Logo"
              className="logo-img"
            />
            <span className="logo-text">My Bucks</span>
          </div>
        </div>
      </header>
      <h1>Welcome back!</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      <div className="auth-link">
        Don't have an account? <a href="/signup">Sign up here</a>
      </div>
    </div>
  );
}

export default Login;
