// src/components/CoBan.js
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import '../styles/CoBan.css'; // Tạo file CSS cho styling
import { formatValue, formatKL, getCellColorClass } from '../utils/utils.js';

const socket = io('http://localhost:5000');
const CoBan = ({ searchSymbol, filter }) => {
  const tableRef = useRef(null);
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]); // Thêm state để lưu dữ liệu gốc

  useEffect(() => {
    const fetchData = () => {
      socket.emit('request_co_ban');

      socket.on('update_co_ban', (responseData) => {
        setOriginalData(responseData);
        const filteredData = responseData.filter(
          (item) => filter === 'all' || item.exchange === filter
        );
        setData(filteredData);
      });

      socket.on('error', (error) => {
        console.error('Error fetching financial metrics data:', error.message);
      });
    };

    fetchData();

    // Gửi yêu cầu dữ liệu mỗi 10 giây
    const interval = setInterval(() => {
      socket.emit('request_co_ban');
    }, 5000);

    return () => {
      socket.off('update_co_ban');
      socket.off('error');
      clearInterval(interval); // Dọn dẹp interval khi component unmount
    };
  }, [filter]);
  useEffect(() => {
    if (searchSymbol && tableRef.current) {
      const rows = tableRef.current.getElementsByTagName('tr');
      for (let i = 0; i < rows.length; i++) {
        // Bỏ qua hàng đầu tiên (header)
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length > 0 && cells[0].textContent.includes(searchSymbol)) {
          rows[i].scrollIntoView({ behavior: 'auto', block: 'start' });
          break; // Dừng lại khi tìm thấy
        }
      }
    }
  }, [searchSymbol]);

  return (
    <div className="table-wrapper-co-ban">
      <table className="data-table-co-ban header-table-co-ban">
        <thead>
          <tr>
            <th style={{ width: '7%' }}>Mã</th>
            <th style={{ width: '9%' }}>Sàn</th>
            <th style={{ width: '12%' }}>Thị giá vốn (tỷ)</th>
            <th style={{ width: '12%' }}>EPS</th>
            <th style={{ width: '12%' }}>P/E</th>
            <th style={{ width: '12%' }}>P/B</th>
            <th style={{ width: '12%' }}>P/S</th>
            <th style={{ width: '12%' }}>ROA (%)</th>
            <th style={{ width: '12%' }}>ROE (%)</th>
          </tr>
        </thead>
      </table>
      <div className="body-container-co-ban">
        <table className="data-table-co-ban body-table-co-ban" ref={tableRef}>
          <tbody>
            {data.map((item) => (
              <tr key={item.symbol}>
                <td style={{ width: '7%' }}>{item.symbol}</td>
                <td style={{ width: '9%' }}>{item.exchange}</td>
                <td style={{ width: '12%' }}>
                  {formatKL(item.thi_gia_von_ty / 1e10)}
                </td>
                <td style={{ width: '12%' }}>{formatValue(item.eps)}</td>
                <td style={{ width: '12%' }}>{formatValue(item.pe)}</td>
                <td style={{ width: '12%' }}>{formatValue(item.pb)}</td>
                <td style={{ width: '12%' }}>{formatValue(item.ps)}</td>
                <td style={{ width: '12%' }}>{formatValue(item.roa * 100)}</td>
                <td style={{ width: '12%' }}>{formatValue(item.roe * 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoBan;
