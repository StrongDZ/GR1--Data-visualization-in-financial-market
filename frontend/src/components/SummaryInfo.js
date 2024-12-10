import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import LineChart from './LineChart';
import '../styles/SummaryInfo.css';
import { formatValue, formatKL, getCellColorClass } from '../utils/utils.js';

const socket = io('http://localhost:5000'); // Kết nối với server

const SummaryInfo = ({ symbol, refPrice }) => {
  const [companyData, setCompanyData] = useState({});

  useEffect(() => {
    // Gửi yêu cầu dữ liệu từ bảng tong_hop khi component được mount hoặc symbol thay đổi
    socket.emit('request_tong_hop', symbol);

    // Lắng nghe sự kiện cập nhật dữ liệu từ bảng tong_hop
    socket.on('update_tong_hop', (newData) => {
      if (newData.symbol === symbol) {
        console.log(`tong hop1 : ${newData.symbol}`);
        console.log(`tong hop1 : ${newData.data[0]}`);
        
        setCompanyData(newData.data[0]);
      }
    });
    const interval = setInterval(() => {
      socket.emit('request_tong_hop', symbol);
    }, 5000);
    // Dọn dẹp khi component unmount
    return () => {
      socket.off('update_tong_hop');
      clearInterval(interval);
    };
  }, [symbol]);

  return (
    <div className="summary-info">
      <div
        style={{
          height: '130px',
          borderBottom: '1px solid black',
          paddingBottom: '5px',
          width: '100%',
        }}
      >
        <LineChart symbol={symbol} refPrice={refPrice} />
      </div>
      <div
        style={{
          borderBottom: '1px solid black',
          paddingBottom: '5px',
          width: '100%',
        }}
      >
        <div className="info-row">
          <span className="info-label">Tham chiếu</span>
          <span className={`info-value change-zero`}>
            {formatValue(companyData['Tham chiếu'])}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Mở cửa</span>
          <span
            className={`info-value ${getCellColorClass(
              companyData['Mở cửa'],
              companyData['Tham chiếu']
            )}`}
          >
            {formatValue(companyData['Mở cửa'])}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Thấp - Cao</span>
          <div>
            <span
              className={`info-value ${getCellColorClass(
                companyData['Thấp'],
                companyData['Tham chiếu']
              )}`}
            >
              {formatValue(companyData['Thấp'])}
            </span>
            <span style={{ color: 'white' }}> - </span>
            <span
              className={`info-value ${getCellColorClass(
                companyData['Cao'],
                companyData['Tham chiếu']
              )}`}
            >
              {formatValue(companyData['Cao'])}
            </span>
          </div>
        </div>
        <div className="info-row">
          <span className="info-label">Khối lượng</span>
          <span className="info-value">
            {formatKL(companyData['Khối lượng'] * 100)}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Giá trị</span>
          <span className="info-value">
            {formatValue(companyData['Giá trị'])} tỷ
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">KLTB 10 ngày</span>
          <span className="info-value">
            {formatKL(companyData['KLTB 10 ngày']/10)}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Thị giá vốn</span>
          <span className="info-value">
            {formatValue(companyData['Thị giá vốn tỷ'] / 1e9)} tỷ
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Số lượng CPLH</span>
          <span className="info-value">
            {formatKL(companyData['Số lượng CPLH'] / 10)}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">P/E</span>
          <span className="info-value">
            {typeof companyData['P/E'] === 'number'
              ? companyData['P/E'].toFixed(2)
              : companyData['P/E']}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">EPS</span>
          <span className="info-value">
            {typeof companyData['EPS'] === 'number'
              ? companyData['EPS'].toFixed(2)
              : companyData['EPS']}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryInfo;
