import './App.css';
import { useEffect, useState } from 'react';

function App() {
  //const initialState = ''
  const [name, setName] = useState('');
  const [datetime, setDatetime] = useState('');
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    getTransactions().then(setTransactions);
  }, []);

  async function getTransactions() {
    const url = process.env.REACT_APP_API_URL + '/transactions';
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }

  function addTransaction(ev) {
    ev.preventDefault();
    const url = process.env.REACT_APP_API_URL + '/transaction';
    const price = name.split(' ')[0];
    fetch(url, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({
        price,
        name: name.substring(price.length + 1),
        description,
        datetime,
      }),
    }).then((response) => {
      response.json().then((json) => {
        setName('');
        setDatetime('');
        setDescription('');

        console.log('result', json);
        getTransactions().then(setTransactions);
      });
    });
  }
  function deleteTransaction(id) {
    const url = process.env.REACT_APP_API_URL + '/transaction/' + id;

    fetch(url, {
      method: 'DELETE',
    })
      .then((response) => response.json())
      .then(() => {
        getTransactions().then(setTransactions); // Refresh list
      })
      .catch((err) => {
        console.error('Error deleting transaction:', err);
      });
  }
  let balance = 0;
  for (const transaction of transactions) {
    balance = balance + transaction.price;
  }
  balance = balance.toFixed(2);
  const fraction = balance.split('.')[1];
  balance = balance.split('.')[0];
  return (
    <main>
      <h1>
        ${balance}
        <span>{fraction}</span>
      </h1>
      <form onSubmit={addTransaction}>
        <div className="basic">
          <input
            type="text"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            placeholder={'+200 samsung tv'}
          />
          <input
            value={datetime}
            onChange={(ev) => setDatetime(ev.target.value)}
            type="datetime-local"
          />
        </div>
        <div className="description">
          <input
            type="text"
            value={description}
            onChange={(ev) => setDescription(ev.target.value)}
            placeholder={'description'}
          />
        </div>
        <button type="submit">Add new transaction</button>
      </form>
      <div className="transactions">
        {transactions.length > 0 &&
          transactions.map((transaction, index) => (
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
  );
}

export default App;
