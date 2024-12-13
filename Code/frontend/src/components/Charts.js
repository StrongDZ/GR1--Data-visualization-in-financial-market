import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify'; // Import toast và ToastContainer
import CandlestickChart from './CandlestickChart';
import SummaryInfo from './SummaryInfo';
import SoLenh from './SoLenh';
import MucGiaHistogram from './MucGia.js';
import '../styles/Charts.css';
import { formatValue1, symbols } from '../utils/utils.js';

const socket = io('http://localhost:5000');

function Charts() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [submittedSymbol, setSubmittedSymbol] = useState('AAA');
  const [selectedView, setSelectedView] = useState('Tổng hợp'); // State để theo dõi view hiện tại
  const [companyData, setCompanyData] = useState({});
  const [selectedIndicators, setSelectedIndicators] = useState([]); // State để lưu các chỉ báo đã chọn
  const [MenuChiBao, setMenuChiBao] = useState(false); // State để quản lý việc hiển thị menu
  const [searchResults, setSearchResults] = useState([]); // State lưu kết quả tìm kiếm

  useEffect(() => {
    socket.emit('request_change_data', submittedSymbol); // Gửi yêu cầu dữ liệu thay đổi cho symbol cụ thể

    // Lắng nghe sự kiện cập nhật dữ liệu thay đổi
    socket.on('update_change', (changeData) => {
      const changeInfo = changeData.find(
        (item) => item.symbol === submittedSymbol
      );
      if (changeInfo) {
        // console.log('hahaa');
        // console.log(changeData[0]);
        setCompanyData(changeData[0]);
      }
    });

    // Lắng nghe sự kiện lỗi
    socket.on('error', (error) => {
      console.error(
        `Error fetching data for ${submittedSymbol}:`,
        error.message
      );
    });
    const interval = setInterval(() => {
      socket.emit('request_change_data', submittedSymbol);
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.off('update_change');
      socket.off('error');
    };
  }, [submittedSymbol]);

  useEffect(() => {
    if (!searchSymbol) {
      setSearchResults([]);
      return;
    }
    const handleSearch = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/symbols?q=${searchSymbol}`
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const symbolsData = await response.json();
        console.log(symbolsData);
        setSearchResults(symbolsData);
      } catch (error) {
        console.error('Error fetching symbols:', error);
        toast.error('Có lỗi khi lấy dữ liệu mã chứng khoán!');
      }
    };

    handleSearch();
  }, [searchSymbol]); // useEffect sẽ được gọi mỗi khi searchSymbol thay đổi

  const handleGroupSelect = (group) => {
    setSelectedView(group);
  };

  const handleIndicatorChange = (indicator) => {
    setSelectedIndicators((prev) => {
      if (prev.includes(indicator)) {
        return prev.filter((item) => item !== indicator); // Nếu đã chọn, bỏ chọn
      } else {
        return [...prev, indicator]; // Nếu chưa chọn, thêm vào danh sách
      }
    });
  };

  const toggleMenu = () => {
    setMenuChiBao(!MenuChiBao); // Đảo ngược trạng thái menu
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // Ngăn chặn hành động mặc định (tải lại trang)
  };

  const handleSymbolClick = (symbol) => {
    setSubmittedSymbol(symbol); // Cập nhật symbol đã chọn
    setSearchSymbol(''); // Xóa ô tìm kiếm sau khi chọn
    setSearchResults([]); // Xóa kết quả tìm kiếm
  };

  return (
    <div className="charts-container">
      <div className="left-panel">
        <div className="candlestickchart-function">
          <form onSubmit={handleSubmit} className="search-form">
            <input
              type="text"
              value={searchSymbol}
              onChange={(e) => {
                setSearchSymbol(e.target.value.toUpperCase());
              }}
              placeholder="Mã CK..."
              className="search-input"
            />
            <span className="search-icon">🔎</span>
          </form>
          {/* Hiển thị danh sách symbol tìm được */}
          {searchResults.length > 0 && (
            <div className="search-results-container">
              {searchResults.map((item) => (
                <div
                  key={item.symbol}
                  className="search-result-item"
                  onClick={() => handleSymbolClick(item.symbol)}
                >
                  <div className="info-left">
                    <h5 className="symbol-name">{item['organ_name']}</h5>
                    <p className="symbol-exchange">
                      {item['symbol']}:{item['exchange']}
                    </p>
                  </div>
                  <div className="info-right">
                    <p className="ref-price">
                      {formatValue1(item['latest_close'])}
                    </p>
                    <p
                      className={`change-value ${
                        item['change_value'] > 0
                          ? 'change-positive'
                          : item['change_value'] < 0
                          ? 'change-negative'
                          : 'change-zero'
                      }`}
                    >
                      {item['change_value'] > 0 ? '+' : ''}
                      {formatValue1(item['change_value'])}
                      <span> / </span>
                      {item['change_value'] > 0 ? '+' : ''}
                      {formatValue1(item['change_percentage'])}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="indicator-menu">
            <button onClick={toggleMenu} className="indicator-button">
              ƒ Chỉ báo
            </button>
            {MenuChiBao && (
              <ul className="indicator-list">
                {[
                  'MA10',
                  'MA20',
                  'MA50',
                  'EMA',
                  'RSI',
                  'MACD',
                  'Bollinger Bands',
                  'Stochastic Oscillator',
                  'Parabolic SAR',
                ].map((indicator) => (
                  <li key={indicator}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedIndicators.includes(indicator)}
                        onChange={() => handleIndicatorChange(indicator)}
                      />
                      {indicator}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div style={{ height: '88%', width: '100%' }}>
          <CandlestickChart
            symbol={submittedSymbol}
            selectedIndicators={selectedIndicators}
          />
        </div>
      </div>
      <div
        className="right-panel"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="company-info">
          <div className="info-left">
            <h5 className="symbol-name">{companyData['organ_name']}</h5>
            <p className="symbol-exchange">
              {companyData['symbol']}:{companyData['exchange']}
            </p>
          </div>
          <div className="info-right">
            <p className="ref-price">
              {formatValue1(companyData['latest_close'])}
            </p>
            <p
              className={`change-value ${
                companyData['change_value'] > 0
                  ? 'change-positive'
                  : companyData['change_value'] < 0
                  ? 'change-negative'
                  : 'change-zero'
              }`}
            >
              {companyData['change_value'] > 0 ? '+' : ''}
              {formatValue1(companyData['change_value'])}
              <span> / </span>
              {companyData['change_value'] > 0 ? '+' : ''}
              {formatValue1(companyData['change_percentage'])}%
            </p>
          </div>
        </div>
        <div className="button-group">
          <button
            className={`btn ${selectedView === 'Tổng hợp' ? 'active' : ''}`}
            onClick={() => handleGroupSelect('Tổng hợp')}
          >
            Tổng hợp
          </button>
          <button
            className={`btn ${selectedView === 'Sổ lệnh' ? 'active' : ''}`}
            onClick={() => handleGroupSelect('Sổ lệnh')}
          >
            Sổ lệnh
          </button>
          <button
            className={`btn ${selectedView === 'Mức giá' ? 'active' : ''}`}
            onClick={() => handleGroupSelect('Mức giá')}
          >
            Mức giá
          </button>
          {/* <button
            className={`btn ${selectedView === 'Thống kê' ? 'active' : ''}`}
            onClick={() => handleGroupSelect('Thống kê')}
          >
            Thống kê
          </button> */}
        </div>
        {selectedView === 'Tổng hợp' && (
          <SummaryInfo
            symbol={submittedSymbol}
            refPrice={companyData['ref_price']}
          />
        )}
        {selectedView === 'Sổ lệnh' && (
          <SoLenh
            symbol={submittedSymbol}
            refPrice={companyData['ref_price']}
          />
        )}
        {selectedView === 'Mức giá' && (
          <MucGiaHistogram
            symbol={submittedSymbol}
            refPrice={companyData['ref_price']}
          />
        )}
      </div>
    </div>
  );
}

export default Charts;
