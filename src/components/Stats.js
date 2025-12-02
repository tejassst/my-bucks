import React from 'react';

function Stats({ transactions, currency = '$' }) {
  const totalExpenses = transactions
    .filter((t) => t.price < 0)
    .reduce((sum, t) => sum + Math.abs(t.price), 0);

  const totalIncome = transactions
    .filter((t) => t.price > 0)
    .reduce((sum, t) => sum + t.price, 0);

  const lastTransaction = transactions[0];

  return (
    <div className="stats-grid">
      <div className="stat-card income">
        <h3>Total Income</h3>
        <p className="amount">
          +{currency}
          {totalIncome.toFixed(2)}
        </p>
        <div className="trend">↑ Monthly Income</div>
      </div>
      <div className="stat-card expenses">
        <h3>Total Expenses</h3>
        <p className="amount">
          -{currency}
          {totalExpenses.toFixed(2)}
        </p>
        <div className="trend">↓ Monthly Expenses</div>
      </div>
      <div className="stat-card latest">
        <h3>Latest Transaction</h3>
        <p className="amount">
          {currency}
          {Math.abs(lastTransaction?.price || 0).toFixed(2)}
        </p>
        <div className="description">
          {lastTransaction?.name || 'No transactions yet'}
        </div>
      </div>
    </div>
  );
}

export default Stats;
