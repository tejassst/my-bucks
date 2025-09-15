import '../style/Home.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div className="App">
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
        <div className="Sort">
          <label className="field-label" htmlFor="sort">
            Sort by:{' '}
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(ev) => {
              const newSort = ev.target.value;

              // Add changing class for animation
              ev.target.classList.add('changing');
              setTimeout(() => {
                ev.target.classList.remove('changing');
              }, 600);

              setSort(newSort);
            }}
            title="Select how to sort your transactions"
          >
            <option value="">🔄 Choose sorting</option>
            <option value="latest">⏳ Latest First</option>
            <option value="oldest">🕒 Oldest First</option>
            <option value="highest">💰 Highest Amount</option>
            <option value="lowest">💸 Lowest Amount</option>
          </select>
        </div>
        <div className="currency">
          <label className="field-label" htmlFor="currency">
            Currency:{' '}
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(ev) => setCurrency(ev.target.value)}
            title="Select your currency"
          >
            <option value="$">🇺🇸 USD</option>
            <option value="₹">🇮🇳 INR</option>
          </select>
        </div>
      </header>
      <main>
        <h1>
          {currency}
          {balance}
          <span className="fraction">{fraction}</span>
        </h1>
        <form onSubmit={addTransaction}>
          <div className="basic">
            <div className="field-group">
              <label className="field-label">Amount & Item</label>
              <input
                type="text"
                className="Amount"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder={'+200 samsung tv'}
                required
              />
            </div>
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
          <div className="field-group">
            <label className="field-label">Description</label>
            <input
              type="text"
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              placeholder={'Additional details'}
            />
          </div>
          <button type="submit">Add new transaction</button>
        </form>
        <div className="transactions">
          {validTransactions.length > 0 &&
            validTransactions.map((transaction, index) => (
              <div key={transaction._id || index} className="transaction">
                <div className="left">
                  <div className="name">{transaction.name}</div>
                  <div className="description">{transaction.description}</div>
                </div>
                <div className="right">
                  <div
                    className={
                      'price ' + (transaction.price < 0 ? 'red' : 'green')
                    }
                  >
                    ${Math.abs(transaction.price)}
                  </div>
                  <div className="datetime">
                    {new Date(transaction.datetime).toLocaleString()}
                  </div>
                  <div className="delete">
                    <button onClick={() => deleteTransaction(transaction._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </main>
      <footer className="footer">
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </footer>
    </div>
  );
}

export default Home;
