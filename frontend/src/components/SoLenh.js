import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import '../styles/SoLenh.css'; // Nếu cần thêm CSS cho component
import {
  formatValue,
  formatKL,
  getCellColorClass,
  formatHMS,
} from '../utils/utils.js';

const socket = io('http://localhost:5000'); // Kết nối với server

const SoLenh = ({ symbol, refPrice }) => {
  // State để lưu trữ dữ liệu sổ lệnh
  const [buyPrices, setBuyPrices] = useState([]);
  const [sellPrices, setSellPrices] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [activeBuyVolume, setActiveBuyVolume] = useState(0);
  const [activeSellVolume, setActiveSellVolume] = useState(0);
  const [intradayData, setIntradayData] = useState([]);
  const [stockPriceData, setStockPriceData] = useState({});

  useEffect(() => {
    // Gửi yêu cầu dữ liệu cho symbol
    socket.emit('request_stock_price_board');
    socket.emit('request_intraday_data', symbol);

    // Lắng nghe sự kiện cập nhật dữ liệu từ intraday
    socket.on('update_intraday_data', (data) => {
      setIntradayData(data);
      calculateVolumes(data);
    });

    // Lắng nghe sự kiện cập nhật dữ liệu từ stock_price_board
    socket.on('update_stock_price_board', (data) => {
      const stockData = data.find((item) => item.symbol === symbol);
      // console.log(`stockData ${stockData}`);
      if (stockData) {
        setStockPriceData(stockData);
        updatePrices(stockData);
      }
    });
    const interval = setInterval(() => {
      socket.emit('request_stock_price_board');
      socket.emit('request_intraday_data', symbol);
    }, 5000);
    // Dọn dẹp khi component unmount
    return () => {
      socket.off('update_intraday_data');
      socket.off('update_stock_price_board');
      clearInterval(interval);
    };
  }, [symbol]);

  // Hàm tính toán tổng volume và volume chủ động
  const updatePrices = (stockData) => {
    // Lấy giá và khối lượng tiêu biểu cho bên mua
    const sellPrices = [
      { price: stockData.bid_1_price, volume: stockData.bid_1_volume },
      { price: stockData.bid_2_price, volume: stockData.bid_2_volume },
      { price: stockData.bid_3_price, volume: stockData.bid_3_volume },
    ];

    // Lấy giá và khối lượng tiêu biểu cho bên bán
    const buyPrices = [
      { price: stockData.ask_1_price, volume: stockData.ask_1_volume },
      { price: stockData.ask_2_price, volume: stockData.ask_2_volume },
      { price: stockData.ask_3_price, volume: stockData.ask_3_volume },
    ];
    setTotalVolume(stockData.accumulated_volume * 100);
    setBuyPrices(buyPrices);
    setSellPrices(sellPrices);
  };

  const maxVolume = Math.max(
    Math.max(...sellPrices.map((item) => item.volume), 1),
    Math.max(...buyPrices.map((item) => item.volume), 1)
  );

  const calculateVolumes = (data) => {
    let totalBuyVolume = 0;
    let totalSellVolume = 0;
    let extraVolume = 0;

    data.forEach((item) => {
      if (item.match_type === 'Buy') {
        totalBuyVolume += item.volume;
      } else if (item.match_type === 'Sell') {
        totalSellVolume += item.volume;
      } else {
        extraVolume += item.volume;
      }
    });

    setActiveBuyVolume(totalBuyVolume + extraVolume / 2);
    setActiveSellVolume(totalSellVolume + extraVolume / 2);
  };
  const getColorByIndex = (index) => {
    return index % 2 !== 0 ? 'var(--xam-vua)' : 'var(--xam-dam)';
  };

  const getColorVolumeRec = (value) => {
    if (value > refPrice) return '#223F2C';
    else if (value < refPrice) return '#45262C';
    else return '#464533';
  };
  return (
    <div className="so-lenh-container">
      {/* Div 1: Giá tiêu biểu của bên mua và bán  */}
      <div className="prices-container">
        <div className="sell-side">
          <p className="title-sell white">Đặt mua</p>
          {sellPrices.map((item, index) => {
            const volumeWidth = `${60 * (item.volume / maxVolume)}%`;
            return (
              <div key={index} className="price-item">
                <span>{formatKL(item.volume * 100)}</span>
                <div
                  className="volume-rec-sell"
                  style={{
                    backgroundColor: getColorVolumeRec(item.price),
                    width: volumeWidth,
                  }}
                >
                  <span
                    className={`${getCellColorClass(item.price, refPrice)}`}
                  >
                    {formatValue(item.price)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="buy-side">
          <p className="title-buy white">Đặt bán</p>
          {buyPrices.map((item, index) => {
            const volumeWidth = `${60 * (item.volume / maxVolume)}%`;
            return (
              <div key={index} className="price-item">
                <div
                  className="volume-rec-buy"
                  style={{
                    backgroundColor: getColorVolumeRec(item.price),
                    width: volumeWidth,
                  }}
                >
                  <span
                    className={`${getCellColorClass(item.price, refPrice)}`}
                  >
                    {formatValue(item.price)}
                  </span>
                </div>
                <span>{formatKL(item.volume * 100)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Div 2: Bảng intraday */}
      <div className="intraday-table">
        <div className="table-header">
          <table>
            <thead>
              <tr>
                <th style={{ width: '30%', textAlign: 'left' }}>Khớp</th>
                <th style={{ width: '20%' }}>Giá</th>
                <th style={{ width: '20%' }}>+/-</th>
                <th style={{ width: '20%', textAlign: 'right' }}>KL</th>
                <th style={{ width: '10%' }}>M/B</th>
              </tr>
            </thead>
          </table>
        </div>
        <div className="table-body">
          <div className="table-container-intraday">
            <table>
              <tbody>
                {intradayData.map((item, index) => {
                  const priceDiff = item.price - refPrice;
                  return (
                    <tr
                      key={index}
                      style={{ backgroundColor: getColorByIndex(index) }}
                    >
                      <td
                        style={{
                          width: '30%',
                          textAlign: 'left',
                          color: 'white',
                        }}
                      >
                        {formatHMS(item.time)}
                      </td>
                      <td
                        className={`${getCellColorClass(item.price, refPrice)}`}
                      >
                        {formatValue(item.price)}
                      </td>
                      <td
                        className={`${getCellColorClass(item.price, refPrice)}`}
                      >
                        {priceDiff > 0
                          ? `+${formatValue(priceDiff)}`
                          : formatValue(priceDiff)}
                      </td>
                      <td style={{ color: 'white ', textAlign: 'right' }}>
                        {formatKL(item.volume / 10)}
                      </td>
                      <td
                        className={`${
                          item.match_type === 'Buy'
                            ? 'change-positive'
                            : 'change-negative'
                        }`}
                        style={{ textAlign: 'right' }}
                      >
                        {item.match_type === 'Buy'
                          ? 'M'
                          : item.match_type === 'Sell'
                          ? 'B'
                          : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Div 3: Thông tin tổng volume */}
      <div className="total-volume-info">
        <div>
          <span className="volume-title">Tổng KL khớp:</span>
          <span className="volume-value">{formatKL(totalVolume)}</span>
          <span className="volume-type"></span>
        </div>
        <div>
          <span className="volume-title">KL MUA chủ động:</span>
          <span className="volume-value change-positive">
            {formatKL(activeBuyVolume / 10)}
          </span>
          <span className="volume-type change-positive">M </span>
        </div>
        <div>
          <span className="volume-title">KL BÁN chủ động:</span>
          <span className="volume-value change-negative">
            {formatKL(activeSellVolume / 10)}
          </span>
          <span className="volume-type change-negative">B</span>
        </div>
      </div>
    </div>
  );
};

export default SoLenh;
