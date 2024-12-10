// src/components/IndexInfo.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import LineChart from './LineChart';
import '../styles/IndexInfo.css';
import { formatValue, symbols, formatKL } from '../utils/utils.js';

const socket = io('http://localhost:5000'); // Kết nối với server

const IndexInfo = ({ symbol }) => {
  const [indexInfo, setIndexInfo] = useState({});
  const [changeValue, setChangeValue] = useState('0.00');
  const [changePercent, setChangePercent] = useState('0.00%');
  const [refPrice, setRefPrice] = useState('0.00');
  const [latestClose, setLatestClose] = useState('0.00'); // Thêm state cho latest_close

  useEffect(() => {
    socket.emit('request_change_data', symbol); // Gửi yêu cầu dữ liệu thay đổi cho symbol cụ thể
    socket.emit('request_index_info', symbol);

    socket.on('update_index_info', (index_info) => {
      if (index_info.index === symbol) {
        setIndexInfo(index_info.data[0]);
      }
    });
    // Lắng nghe sự kiện cập nhật dữ liệu thay đổi
    socket.on('update_change', (changeData) => {
      // console.log('haha');
      // console.log(changeData);
      const changeInfo = changeData.find((item) => item.symbol === symbol);
      if (changeInfo) {
        setChangeValue(changeData[0]['change_value'].toFixed(2));
        setChangePercent(changeData[0]['change_percentage'].toFixed(2) + '%');
        // console.log(`ref_price ${changeData[0]['ref_price']}`);
        setRefPrice(changeData[0]['ref_price']);
        setLatestClose(changeData[0]['latest_close'].toFixed(2)); // Cập nhật latest_close
      }
    });

    // Lắng nghe sự kiện lỗi
    socket.on('error', (error) => {
      console.error(`Error fetching data for ${symbol}:`, error.message);
    });
    const interval = setInterval(() => {
      socket.emit('request_change_data', symbol);
      socket.emit('request_index_info', symbol);
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.off('update_change');
      socket.off('error');
      socket.off('update_index_info');
    };
  }, [symbol]);

  // Xác định màu sắc và dấu hiệu cho symbol-change
  const changeValueNum = parseFloat(changeValue);
  let color;
  let sign = '';

  if (changeValueNum > 0) {
    color = 'text-green';
    sign = '+';
  } else if (changeValueNum < 0) {
    color = 'text-red';
    sign = '';
  } else {
    color = 'text-yellow'; // Màu vàng khi giá trị bằng 0
  }

  return (
    <div className="linechart-index">
      <div className="first-row">
        <div className="symbol-name-index">{symbol}</div>
        <div className="latest-close">{latestClose}</div>
        <div className={`symbol-change ${color}`}>
        {sign}
          {changeValue} / {changePercent}
        </div>
      </div>
      <div className="text-info">
        KL: <span style={{fontWeight: '700'}}>{formatValue(indexInfo['KL tổng'] / 1000)}</span> tr GT: <span style={{fontWeight: '700'}}>{formatKL(indexInfo['GT tổng']/10)}</span> tỷ 
        <span className = 'text-green' style={{whiteSpace: 'pre', fontWeight: '700'}}>   ⇑ {indexInfo['increase']}</span> 
        <span className = 'text-yellow' style={{whiteSpace: 'pre', fontWeight: '700'}}>   ☰ {indexInfo['increase']}</span> 
        <span className = 'text-red' style={{ whiteSpace: 'pre', fontWeight: '700'}}>   ⇓ {indexInfo['increase']}</span> 
      </div>
      <div className="linechart-wrapper">
        <LineChart symbol={symbol} refPrice={refPrice} />
      </div>
    </div>
  );
};

export default IndexInfo;
