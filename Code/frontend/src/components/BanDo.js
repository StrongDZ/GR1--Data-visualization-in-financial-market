// src/components/BanDo.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import ReactECharts from 'echarts-for-react';
import {
  formatValue,
  formatKL,
  getCellColorClass,
  formatHMS,
} from '../utils/utils.js';


const socket = io('http://localhost:5000');

const BanDo = () => {
  const [data, setData] = useState([]);
  const chartRef = React.useRef(null);
  useEffect(() => {
    // Gửi yêu cầu dữ liệu cho bảng ban_do
    socket.emit('request_ban_do');

    // Lắng nghe sự kiện cập nhật dữ liệu
    socket.on('update_ban_do', (responseData) => {
      setData(responseData);
    });
    // Gửi yêu cầu dữ liệu mỗi 10 giây
    const interval = setInterval(() => {
      socket.emit('request_ban_do');
    }, 5000);

    // Dọn dẹp khi component unmount
    return () => {
      socket.off('update_ban_do');
      clearInterval(interval);
    };
  }, []);

  // Chuyển đổi dữ liệu thành định dạng cho treemap
  const getTreemapData = () => {
    return data.map((item) => ({
      name: item.symbol,
      value: item.accumulated_volume,
      change_percentage: item.change_percentage,
      itemStyle: {
        color:
          item.change_percentage > 0
            ? '#4CAF50'
            : item.change_percentage < 0
            ? '#F44336'
            : '#D0C30D', // Màu sắc dựa trên tỷ lệ thay đổi
      },
      tooltip: {
        formatter: `${item.symbol} - ${item.organ_short_name}<br>Gia: ${
          formatValue(item.match_price)
        }<br>Khoi luong GD: ${
          formatKL(item.accumulated_volume*100)
        }<br>Thay đổi: ${item.change_percentage.toFixed(2)}%`,
      },
    }));
  };

  const option = {
    tooltip: {
      trigger: 'item',
    },
    series: [
      {
        type: 'treemap',
        roam: true, // Cho phép zoom và pan
        layoutAlgorithm: 'squarified',
        width: '100%',
        height: '100%',
        scale: 1, // Scale mặc định
        zoomToNodeRatio: 1, // Tự động căn chỉnh zoom
        data: getTreemapData(),
        label: {
          show: true,
          formatter: ({ name, data }) =>
            `${name}\n${
              data.change_percentage === 0
                ? 0
                : Math.round(data.change_percentage * 100) / 100
            }%`,
          fontSize: 12,
          color: '#fff', // Màu chữ
        },
        itemStyle: {
          borderColor: '#000', // Màu viền là đen
          borderWidth: 0.3, // Độ rộng viền là 1px
        },
      },
    ],
  };

  return (
    <div style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default BanDo;
