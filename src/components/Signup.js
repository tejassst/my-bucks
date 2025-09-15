import '../style/Signup.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      navigate('/login');
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
      <h1>Sign up now!</h1>
      {error && <div className="error-message">{error}</div>}
      <form className="form" onSubmit={handleSubmit}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Signup</button>
      </form>
      <div className="auth-link">
        Already have an account? <a href="/login">Login here</a>
      </div>
    </div>
  );
}

export default Signup;
