import React, { useEffect, useRef, useState } from 'react';
import '../styles/StockPriceTable.css';
import { io } from 'socket.io-client';
import { formatValue, formatKL, getCellColorClass, compareValues } from '../utils/utils.js';

const socket = io('http://localhost:5000');

const StockPriceTable = ({ searchSymbol, filter }) => {
  const tableRef = useRef(null);
  const [data, setData] = useState([]);
  const [changedCells, setChangedCells] = useState({}); // Theo dõi ô nào bị thay đổi
  const [filteredIndexes, setFilteredIndexes] = useState([]); // Chỉ số hàng được hiển thị
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending',
  });

  const getCellColorIndex = (index) => {
    return index % 2 === 0 ? 'xam_dam' : 'xam_nhat';
  };

  useEffect(() => {
    const fetchData = () => {
      socket.emit('request_stock_price_board');
  
      socket.on('update_stock_price_board', (responseData) => {
        const changes = {};
        const key = sortConfig.key;
        const direction = sortConfig.direction;
        let sortData = data;
        if (key) {
          responseData = [...responseData].sort((a, b) => {
            const comparison = compareValues(a[key], b[key], a.symbol, b.symbol);
            return direction === 'ascending' ? comparison : -comparison;
          });
          if (sortData != null) {
            sortData = [...data].sort((a, b) => {
              const comparison = compareValues(a[key], b[key], a.symbol, b.symbol);
              return direction === 'ascending' ? comparison : -comparison;
            });
          }
        }
        console.log(responseData);
        console.log(sortData);
        responseData.forEach((item, index) => {
          if (sortData[index]) {
            Object.keys(item).forEach((key) => {
              if (item[key] !== sortData[index][key]) {
                if (!changes[index]) changes[index] = {};
                changes[index][key] = true; // Đánh dấu field bị thay đổi
              }
            });
          }
        });
  
        setChangedCells(changes); // Cập nhật ô thay đổi
  
        // Chỉ cập nhật data nếu responseData khác với data hiện tại
        if (JSON.stringify(responseData) !== JSON.stringify(data)) {
          setData(responseData); // Lưu dữ liệu mới
        }
  
        // Reset trạng thái `changedCells` sau khi hiệu ứng hoàn thành (5 giây)
        setTimeout(() => {
          setChangedCells({});
        }, 3000);
      });
  
      socket.on('error', (error) => {
        console.error('Error fetching stock price data:', error.message);
      });
    };
  
    fetchData();
  
    const interval = setInterval(() => {
      socket.emit('request_stock_price_board');
    }, 5000);
  
    return () => {
      socket.off('update_stock_price_board');
      socket.off('error');
      clearInterval(interval);
      setChangedCells({});
    };
  }, [sortConfig, data]); // Chỉ giữ sortConfig trong mảng phụ thuộc

  // Cập nhật danh sách chỉ số phù hợp với filter
  useEffect(() => {
    if (filter === 'all') {
      setFilteredIndexes(data.map((_, index) => index)); // Hiển thị tất cả
    } else {
      const indexes = data
        .map((item, index) => (item.exchange === filter ? index : null))
        .filter((index) => index !== null); // Lọc chỉ số
      setFilteredIndexes(indexes);
    }
  }, [filter, data]);

  // Cuộn đến mã cổ phiếu tìm kiếm
  useEffect(() => {
    if (searchSymbol && tableRef.current) {
      const rows = tableRef.current.getElementsByTagName('tr');
      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length > 0 && cells[0].textContent.includes(searchSymbol)) {
          rows[i].scrollIntoView({ behavior: 'auto', block: 'start' });
          break;
        }
      }
    }
  }, [searchSymbol]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    console.log(key);
    setSortConfig({ key, direction });
    console.log("haha");
    console.log(sortConfig.key);
    const sortedData = [...data].sort((a, b) => {
      const comparison = compareValues(a[key], b[key], a.symbol, b.symbol);
      return direction === 'ascending' ? comparison : -comparison;
    });
    setData(sortedData);
  };
  return (
    <div className="table-wrapper">
      <table className="data-table header-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('symbol')} rowSpan="2">
              Mã
            </th>
            <th colSpan="3">Giá Tham Chiếu</th>
            <th onClick={() => requestSort('accumulated_volume')} rowSpan="2">
              Tổng KL
            </th>
            <th colSpan="6">Bên Mua</th>
            <th onClick={() => requestSort('match_price')} rowSpan="2">
              Giá Khớp
            </th>
            <th onClick={() => requestSort('match_vol')} rowSpan="2">
              KL Khớp
            </th>
            <th onClick={() => requestSort('symbol')} rowSpan="2">
              +/-
            </th>
            <th colSpan="6">Bên Bán</th>
            <th colSpan="3">Thống Kê</th>
            <th colSpan="2">Nước Ngoài</th>
          </tr>
          <tr>
            <th onClick={() => requestSort('ceiling')}>Trần</th>
            <th onClick={() => requestSort('floor')}>Sàn</th>
            <th onClick={() => requestSort('ref_price')}>TC</th>
            <th onClick={() => requestSort('bid_3_price')}>Mua 3</th>
            <th onClick={() => requestSort('bid_3_volume')}>KL 3</th>
            <th onClick={() => requestSort('bid_2_price')}>Mua 2</th>
            <th onClick={() => requestSort('bid_2_volume')}>KL 2</th>
            <th onClick={() => requestSort('bid_1_price')}>Mua 1</th>
            <th onClick={() => requestSort('bid_1_volume')}>KL 1</th>
            <th onClick={() => requestSort('ask_1_price')}>Bán 1</th>
            <th onClick={() => requestSort('ask_1_volume')}>KL 1</th>
            <th onClick={() => requestSort('ask_2_price')}>Bán 2</th>
            <th onClick={() => requestSort('ask_2_volume')}>KL 2</th>
            <th onClick={() => requestSort('ask_3_price')}>Bán 3</th>
            <th onClick={() => requestSort('ask_3_volume')}>KL 3</th>
            <th onClick={() => requestSort('highest')}>Cao</th>
            <th onClick={() => requestSort('avg_match_price')}>TB</th>
            <th onClick={() => requestSort('lowest')}>Thấp</th>
            <th onClick={() => requestSort('foreign_buy_volume')}>Mua</th>
            <th onClick={() => requestSort('foreign_sell_volume')}>Bán</th>
          </tr>
        </thead>
      </table>
      <div className="body-container">
        <table className="data-table body-table" ref={tableRef}>
          <tbody>
            {filteredIndexes.map((index1, index) => {
              const item = data[index1];
              return (
                <tr key={item.symbol}>
                  <td
                    title={`${item.organ_name}`}
                    className={`table-cell ${getCellColorClass(
                      item.match_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.symbol ? 'blink' : ''}`}
                  >
                    {item.symbol}
                  </td>
                  <td
                    className={`table-cell ceiling-cell ${getCellColorIndex(
                      index
                    )} ${changedCells[index]?.ceiling ? 'blink' : ''}`}
                  >
                    {formatValue(item.ceiling)}
                  </td>
                  <td
                    className={`table-cell floor-cell ${getCellColorIndex(
                      index
                    )} ${changedCells[index]?.floor ? 'blink' : ''}`}
                  >
                    {formatValue(item.floor)}
                  </td>
                  <td
                    className={`table-cell tc-cell ${getCellColorIndex(
                      index
                    )} ${changedCells[index]?.ref_price ? 'blink' : ''}`}
                  >
                    {formatValue(item.ref_price)}
                  </td>
                  <td
                    className={`table-cell white ${
                      changedCells[index]?.accumulated_volume ? 'blink' : ''
                    }`}
                  >
                    {formatKL(item.accumulated_volume)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.bid_3_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.bid_3_price ? 'blink' : ''}`}
                  >
                    {formatValue(item.bid_3_price)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.bid_3_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.bid_3_volume ? 'blink' : ''}`}
                  >
                    {formatKL(item.bid_3_volume)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.bid_2_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.bid_2_price ? 'blink' : ''}`}
                  >
                    {formatValue(item.bid_2_price)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.bid_2_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )}${changedCells[index]?.bid_2_volume ? 'blink' : ''}`}
                  >
                    {formatKL(item.bid_2_volume)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.bid_1_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.bid_1_price ? 'blink' : ''}`}
                  >
                    {formatValue(item.bid_1_price)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.bid_1_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )}${changedCells[index]?.bid_1_volume ? 'blink' : ''}`}
                  >
                    {formatKL(item.bid_1_volume)}
                  </td>

                  <td
                    className={`table-cell ${getCellColorClass(
                      item.match_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${getCellColorIndex(index)}${
                      changedCells[index]?.match_price ? 'blink' : ''
                    }`}
                  >
                    {formatValue(item.match_price)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.match_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${getCellColorIndex(index)} ${
                      changedCells[index]?.match_vol ? 'blink' : ''
                    }`}
                  >
                    {formatKL(item.match_vol)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.match_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${getCellColorIndex(index)} ${
                      changedCells[index]?.match_vol ? 'blink' : ''
                    }`}
                  >
                    {formatValue(item.match_price - item.ref_price)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.ask_1_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.ask_1_price ? 'blink' : ''}`}
                  >
                    {formatValue(item.ask_1_price)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.ask_1_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.ask_1_volume ? 'blink' : ''}`}
                  >
                    {formatKL(item.ask_1_volume)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.ask_2_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.ask_2_price ? 'blink' : ''}`}
                  >
                    {formatValue(item.ask_2_price)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.ask_2_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.ask_2_volume ? 'blink' : ''}`}
                  >
                    {formatKL(item.ask_2_volume)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.ask_3_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.ask_3_price ? 'blink' : ''}`}
                  >
                    {formatValue(item.ask_3_price)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.ask_3_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${changedCells[index]?.ask_3_volume ? 'blink' : ''}`}
                  >
                    {formatKL(item.ask_3_volume)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.highest,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${getCellColorIndex(index)} ${
                      changedCells[index]?.highest ? 'blink' : ''
                    }`}
                  >
                    {formatValue(item.highest)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.avg_match_price,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${getCellColorIndex(index)}${
                      changedCells[index]?.avg_match_price ? 'blink' : ''
                    }`}
                  >
                    {formatValue(item.avg_match_price)}
                  </td>
                  <td
                    className={`table-cell ${getCellColorClass(
                      item.lowest,
                      item.ref_price,
                      item.ceiling,
                      item.floor
                    )} ${getCellColorIndex(index)} ${
                      changedCells[index]?.lowest ? 'blink' : ''
                    }`}
                  >
                    {formatValue(item.lowest)}
                  </td>
                  <td
                    className={`table-cell white ${
                      changedCells[index]?.foreign_buy_volume ? 'blink' : ''
                    }`}
                  >
                    {formatKL(item.foreign_buy_volume)}
                  </td>
                  <td
                    className={`table-cell white ${
                      changedCells[index]?.foreign_sell_volume ? 'blink' : ''
                    }`}
                  >
                    {formatKL(item.foreign_sell_volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockPriceTable;
