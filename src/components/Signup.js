import '../style/Signup.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NeonGradientCard from './NeonGradientCard';

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
        <NeonGradientCard>
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
          <h2>Track your finances and manage your budget with ease.</h2>
          <p>
            My Bucks is a simple and user-friendly budgeting app that helps you
            manage your finances and stay on top of your budget.
          </p>
          <p>
            Sign up now and start tracking your expenses and saving money. With
            rolling features and a user-friendly interface, My Bucks is the
            perfect tool for anyone looking to improve their financial
            management skills.
          </p>
        </NeonGradientCard>
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
