import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import ReactECharts from 'echarts-for-react';
import '../styles/LineChart.css';

const socket = io('http://localhost:5000'); // Kết nối với server

const LineChart = ({ symbol, refPrice }) => {
  const [data, setData] = useState([]);
  useEffect(() => {
    // Gửi yêu cầu dữ liệu mới nhất khi component được mount hoặc symbol thay đổi
    socket.emit('request_data_newest', symbol);

    // Lắng nghe sự kiện cập nhật dữ liệu
    socket.on('update_data_newest', (newData) => {
      if (newData.symbol === symbol) {
        // console.log(newData.data);
        setData(newData.data);
      }
    });

    // Gửi yêu cầu dữ liệu mỗi 10 giây
    const interval = setInterval(() => {
      socket.emit('request_data_newest', symbol);
    }, 5000);

    return () => {
      socket.off('update_data_newest');
      clearInterval(interval); // Dọn dẹp interval khi component unmount
    };
  }, [symbol]);

  if (!data || data.length === 0) {
    return <div>Không có dữ liệu</div>;
  }

  const minValue = Math.min(...data.map((item) => item.close));
  const maxValue = Math.max(...data.map((item) => item.close));
  const padding = (maxValue - minValue) * 0.1;

  // Split data into segments based on the value
  const segments = [];
  let currentSegment = [];
  for (let i = 0; i < data.length - 1; i++) {
    const currentPoint = data[i];
    const nextPoint = data[i + 1];
    currentSegment.push([
      new Date(currentPoint.time).getTime(),
      currentPoint.close,
    ]);
    if (
      (currentPoint.close >= refPrice && nextPoint.close < refPrice) ||
      (currentPoint.close < refPrice && nextPoint.close >= refPrice)
    ) {
      currentSegment.push([
        new Date(nextPoint.time).getTime(),
        nextPoint.close,
      ]);
      segments.push(currentSegment);
      currentSegment = [];
    }
  }
  if (currentSegment.length > 0) {
    currentSegment.push([
      new Date(data[data.length - 1].time).getTime(),
      data[data.length - 1].close,
    ]);
    segments.push(currentSegment);
  }

  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const time = new Date(params[0].axisValue).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        const close = params[0].data[1];
        const volume = params[1] ? params[1].data[1] : 0; // Lấy giá trị volume
        return `Thời gian: ${time}<br>Giá: ${close}<br>Khối lượng: ${volume}`;
      },
    },
    xAxis: {
      type: 'time',
      splitLine: {
        show: false,
      },
      axisLabel: {
        formatter: (value) =>
          new Date(value).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
        color: '#aaaaaa', // Đổi màu chữ trục X
        fontSize: 12, // Tuỳ chỉnh kích thước chữ
      },
      axisLine: {
        lineStyle: {
          color: '#aaaaaa', // Đổi màu đường trục X
          width: 1, // Độ dày của đường trục
        },
      },
      boundaryGap: false,
      // Thêm các thuộc tính để tùy chỉnh hiển thị
      minInterval: 1000, // Khoảng cách tối thiểu giữa các điểm (1 giây)
      splitNumber: 6, // Số lượng mốc thời gian hiển thị
    },
    yAxis: [
      {
        type: 'value',
        show: false,
        max: Math.max(...data.map((item) => item.volume)),
      },
      {
        type: 'value',
        min: minValue - padding,
        max: maxValue + padding,
        show: false,
      },
    ],
    series: [
      ...segments.map((segment, index) => ({
        name: 'Giá',
        type: 'line',
        data: segment,
        smooth: false,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: segment[0][1] >= refPrice ? 'rgb(7, 182, 7)' : '#ef5350',
        },
        yAxisIndex: 1,
      })),
      {
        name: 'Khối lượng',
        type: 'bar',
        data: data.map((item) => [new Date(item.time).getTime(), item.volume]),
        yAxisIndex: 0,
        itemStyle: {
          color: 'rgba(214, 176, 7, 1)',
        },
      },
      {
        type: 'line',
        markLine: {
          symbol: ['none', 'arrow'], // Mũi tên chỉ ở cuối
          symbolSize: 8, // Kích thước mũi tên
          data: refPrice ? [{ yAxis: refPrice }] : [],
          lineStyle: {
            type: 'dashed', // Kiểu nét đứt
            color: 'rgba(214, 176, 7, 1)', // Màu của đường
          },
          label: {
            show: false, // Không hiển thị nhãn
          },
          animation: false, // Tắt animation
        },
        yAxisIndex: 1,
      },
    ],
    grid: {
      left: 15,
      right: 6,
      top: 0,
      bottom: 20,
    },
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: '100%' }}
      notMerge={true}
      lazyUpdate={true}
      theme={'light'}
    />
  );
};

export default LineChart;
