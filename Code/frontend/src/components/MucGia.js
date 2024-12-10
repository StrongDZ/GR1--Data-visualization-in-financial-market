import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ReactECharts from 'echarts-for-react';
import { getCellColorClass } from '../utils/utils'; // Import hàm getCellColorClass
import { Tooltip } from 'highcharts';

const socket = io('http://localhost:5000');

const MucGiaHistogram = ({ symbol, refPrice }) => {
  const [intradayData, setIntradayData] = useState([]);

  useEffect(() => {
    // Gửi yêu cầu dữ liệu cho symbol
    socket.emit('request_intraday_data', symbol);
    // Lắng nghe sự kiện cập nhật dữ liệu từ intraday
    socket.on('update_intraday_data', (data) => {
      setIntradayData(data);
    });

    const interval = setInterval(() => {
      socket.emit('request_stock_price_board');
    }, 5000);
    // Dọn dẹp khi component unmount
    return () => {
      socket.off('update_intraday_data');
      clearInterval(interval);
    };
  }, [symbol]);

  // Tính toán tần suất của từng loại giá
  const calculatePriceFrequency = (data) => {
    const frequency = {};
    data.forEach((item) => {
      const price = item.price;
      const volume = item.volume;
      frequency[price] = (frequency[price] || 0) + volume;
    });
    return frequency;
  };

  // Chuyển đổi tần suất thành định dạng cho ECharts
  const getHistogramData = () => {
    const frequency = calculatePriceFrequency(intradayData);
    return {
      prices: Object.keys(frequency),
      counts: Object.values(frequency),
    };
  };

  const { prices, counts } = getHistogramData();

  // Tạo màu sắc cho các cột dựa trên giá so với refPrice
  const getBarColors = () => {
    return counts.map((count, index) => {
      const price = parseFloat(prices[index]);
      return price > refPrice
        ? '#00aa00'
        : price === refPrice
        ? '#ccaa00'
        : '#e24037';
    });
  };

  const options = {
    tooltip: {},
    xAxis: {
      type: 'value',
      position: 'top',
      
    },
    yAxis: {
      type: 'category',
      data: prices,
      axisLine: {
        show: false, // Ẩn đường trục y
      },
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: 0,
      containLabel: true,
      backgroundColor: '#ffaaaa', // Màu nền của grid
      lineStyle: { width: 1 },
    },
    series: [
      {
        type: 'bar',
        data: counts,
        itemStyle: {
          color: (params) => getBarColors()[params.dataIndex], // Sử dụng màu sắc tùy chỉnh
        },
        barWidth: '90%',
      },
    ],
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts
        option={options}
        style={{ height: '100%', width: '100%' }} // Đặt chiều cao và chiều rộng là 100%
      />
    </div>
  );
};

export default MucGiaHistogram;
