import '../style/Dashboard.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Stats from './Stats';

const API_URL = process.env.REACT_APP_API_URL;

function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [sort, setSort] = useState('latest');
  const [currency, setCurrency] = useState('$');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchTransactions = async () => {
      const data = await getTransactions(sort || 'latest');
      setTransactions(data);
    };

    fetchTransactions();
  }, [sort, navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  async function getTransactions(sortType = sort) {
    const url = `${API_URL}/api/transactions?sort=${sortType}`;
    try {
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();

      // Handle new API response format with transactions array
      if (json.transactions && Array.isArray(json.transactions)) {
        return json.transactions;
      }
      // Fallback for old format or ensure we always return an array
      return Array.isArray(json) ? json : [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return []; // Return empty array on error
    }
  }

  function addTransaction(ev) {
    ev.preventDefault();

    // Basic validation
    if (!name.trim()) {
      alert('Please enter an amount and item name');
      return;
    }

    const url = `${API_URL}/api/transaction`;
    const price = name.split(' ')[0];

    // Convert datetime-local format to ISO string or use current time
    let finalDatetime;
    if (date && time) {
      try {
        // datetime-local gives us YYYY-MM-DDTHH:mm format, convert to ISO
        const dateObj = new Date(`${date}T${time}`);
        if (isNaN(dateObj.getTime())) {
          alert('Please enter a valid date and time');
          return;
        }
        finalDatetime = dateObj.toISOString();
      } catch (error) {
        console.error('Date conversion error:', error);
        alert('Please enter a valid date and time');
        return;
      }
    } else {
      // Use current datetime if none provided
      finalDatetime = new Date().toISOString();
    }

    console.log('Submitting:', {
      price,
      name: name.substring(price.length + 1),
      description,
      datetime: finalDatetime,
    });

    fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        price,
        name: name.substring(price.length + 1),
        description,
        datetime: finalDatetime,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        setName('');
        setDate('');
        setTime('');
        setDescription('');

        console.log('result', json);
        getTransactions().then(setTransactions);
      })
      .catch((error) => {
        console.error('Error adding transaction:', error);
        alert('Error adding transaction. Please try again.');
      });
  }
  function deleteTransaction(id) {
    const url = `${API_URL}/api/transaction/${id}`;

    fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        getTransactions().then(setTransactions); // Refresh list
      })
      .catch((err) => {
        console.error('Error deleting transaction:', err);
        alert('Error deleting transaction. Please try again.');
      });
  }
  let balance = 0;
  // Ensure transactions is an array before processing
  const validTransactions = Array.isArray(transactions) ? transactions : [];
  for (const transaction of validTransactions) {
    balance = balance + transaction.price;
  }
  balance = balance.toFixed(2);
  const fraction = balance.split('.')[1];
  balance = balance.split('.')[0];
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="navbar-left">
          <div className="logo">
            <img
              src="/logo.png"
              alt="Money Tracker Logo"
              className="logo-img"
            />
            <span className="logo-text">My Bucks</span>
          </div>
        </div>
        <div className="navbar-center">
          <div className="balance-display">
            <span className="balance-label">Balance</span>
            <h1 className="balance-amount">
              {currency}
              {balance}
              <span className="fraction">.{fraction}</span>
            </h1>
          </div>
        </div>
        <div className="navbar-right">
          <div className="controls">
            <select
              className="currency-select"
              value={currency}
              onChange={(ev) => setCurrency(ev.target.value)}
              title="Select your currency"
            >
              <option value="$">🇺🇸 USD</option>
              <option value="₹">🇮🇳 INR</option>
            </select>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* Stats Cards Section */}
        <div className="stats-section">
          <Stats transactions={validTransactions} currency={currency} />
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Add Transaction Form */}
          <div className="dashboard-card form-card">
            <h2 className="card-title">Add Transaction</h2>
            <form onSubmit={addTransaction}>
              <div className="form-row">
                <div className="field-group">
                  <label className="field-label">Amount & Item</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                    placeholder="+200 samsung tv"
                    required
                  />
                </div>
              </div>
              <div className="form-row two-col">
                <div className="field-group">
                  <label className="field-label">Date</label>
                  <input
                    value={date}
                    onChange={(ev) => setDate(ev.target.value)}
                    type="date"
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Time</label>
                  <input
                    value={time}
                    onChange={(ev) => setTime(ev.target.value)}
                    type="time"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field-group">
                  <label className="field-label">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(ev) => setDescription(ev.target.value)}
                    placeholder="Additional details"
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn">
                Add Transaction
              </button>
            </form>
          </div>

          {/* Transactions List */}
          <div className="dashboard-card transactions-card">
            <div className="card-header">
              <h2 className="card-title">Recent Transactions</h2>
              <select
                className="sort-select"
                value={sort}
                onChange={(ev) => setSort(ev.target.value)}
                title="Sort transactions"
              >
                <option value="latest">⏳ Latest</option>
                <option value="oldest">🕒 Oldest</option>
                <option value="highest">💰 Highest</option>
                <option value="lowest">💸 Lowest</option>
              </select>
            </div>
            <div className="transactions-list">
              {validTransactions.length > 0 ? (
                validTransactions.map((transaction, index) => (
                  <div
                    key={transaction._id || index}
                    className="transaction-item"
                  >
                    <div className="transaction-info">
                      <div className="transaction-name">{transaction.name}</div>
                      <div className="transaction-desc">
                        {transaction.description}
                      </div>
                      <div className="transaction-date">
                        {new Date(transaction.datetime).toLocaleString()}
                      </div>
                    </div>
                    <div className="transaction-actions">
                      <div
                        className={`transaction-amount ${
                          transaction.price < 0 ? 'negative' : 'positive'
                        }`}
                      >
                        {transaction.price < 0 ? '-' : '+'}
                        {currency}
                        {Math.abs(transaction.price)}
                      </div>
                      <button
                        onClick={() => deleteTransaction(transaction._id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-transactions">No transactions yet</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
