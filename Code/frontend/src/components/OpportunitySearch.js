import React, { useEffect, useState } from 'react';
import StockPriceTable from './StockPriceTable';
import BanDo from './BanDo';
import IndexInfo from './IndexInfo';
import CoBan from './CoBan';
import '../styles/OpportunitySearch.css';
import { color } from 'highcharts';

function OpportunitySearch() {
  const [symbols] = useState([
    'VNINDEX',
    'HNXINDEX',
    'UPCOMINDEX',
    'VN30',
    'HNX30',
  ]);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // Thêm state để theo dõi nút được chọn
  const [selectedView, setSelectedView] = useState('Bảng giá');
  const handleFilter = (exchange) => {
    console.log(`Filtering by: ${exchange}`);
    setSelectedFilter(exchange);
  };

  const handleGroupSelect = (group) => {
    setSelectedView(group); // Cập nhật view hiện tại
  };

  return (
    <div className="container-opportunity">
      <div className="index-row">
        {symbols.map((symbol) => (
          <IndexInfo key={symbol} symbol={symbol} />
        ))}
      </div>
      <div className="function-bar">
        <div className="search-bar">
          <input
            type="text"
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            placeholder="Mã CK ..."
            className="search-input-op"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-symbol-button ${
              selectedFilter === 'all' ? 'selected' : ''
            }`}
            onClick={() => handleFilter('all')}
          >
            Toàn bộ
          </button>
          <button
            className={`filter-symbol-button ${
              selectedFilter === 'HNX' ? 'selected' : ''
            }`}
            onClick={() => handleFilter('HNX')}
          >
            HNX
          </button>
          <button
            className={`filter-symbol-button ${
              selectedFilter === 'HSX' ? 'selected' : ''
            }`}
            onClick={() => handleFilter('HSX')}
          >
            HSX
          </button>
          <button
            className={`filter-symbol-button ${
              selectedFilter === 'UPCOM' ? 'selected' : ''
            }`}
            onClick={() => handleFilter('UPCOM')}
          >
            UPCOM
          </button>
          <div style={{ color: 'white', fontSize: '10px', marginLeft: '5px' }}> Đ/v KL: 100CP</div>
        </div>

        <div className="statistics-views">
          <button
            className={`statistics-view ${
              selectedView === 'Bảng giá' ? 'active' : ''
            }`}
            onClick={() => handleGroupSelect('Bảng giá')}
          >
            Bảng giá
          </button>
          {/* <button
            className={`statistics-view ${
              selectedView === 'Thống kê' ? 'active' : ''
            }`}
            onClick={() => handleGroupSelect('Thống kê')}
          >
            Thống kê
          </button> */}
          <button
            className={`statistics-view ${
              selectedView === 'Cơ bản' ? 'active' : ''
            }`}
            onClick={() => handleGroupSelect('Cơ bản')}
          >
            Cơ bản
          </button>
          <button
            className={`statistics-view ${
              selectedView === 'Bản đồ' ? 'active' : ''
            }`}
            onClick={() => handleGroupSelect('Bản đồ')}
          >
            Bản đồ
          </button>
        </div>
      </div>

      <div className="view-container">
        {selectedView === 'Bảng giá' && (
          <StockPriceTable
            searchSymbol={searchSymbol}
            filter={selectedFilter}
          />
        )}
        {selectedView === 'Cơ bản' && (
          <CoBan searchSymbol={searchSymbol} filter={selectedFilter} />
        )}
        {selectedView === 'Thống kê' && <div>Statistics View</div>}
        {selectedView === 'Bản đồ' && <BanDo />}
      </div>
    </div>
  );
}

export default OpportunitySearch;
