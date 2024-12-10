import React, { useState } from 'react';
import CandlestickChart from './CandlestickChart';
import '../styles/Dashboard.css';

function Dashboard() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [submittedSymbol, setSubmittedSymbol] = useState('');

  const handleSearch = (event) => {
    event.preventDefault(); // Ngăn chặn hành vi mặc định của form
    setSubmittedSymbol(searchSymbol); // Lưu mã chứng khoán đã nhập
  };

  return (
    <div className="container-dashboard">
      <div className="block-stock">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            placeholder="Nhập mã chứng khoán"
          />
          <button type="submit">Tìm kiếm</button>
        </form>
        <div className="stock-display">
          {submittedSymbol && <CandlestickChart symbol={submittedSymbol} />}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;