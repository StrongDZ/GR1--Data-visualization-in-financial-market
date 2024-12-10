import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import Indicators from 'highcharts/indicators/indicators-all';
import { parseISO, addHours } from 'date-fns';

Indicators(Highcharts);

const socket = io('http://localhost:5000');

const CandlestickChart = ({ symbol, selectedIndicators }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    socket.emit('request_data', symbol);

    const handleUpdateData = (newData) => {
      if (newData.symbol === symbol) {
        setData(newData.data);
      }
    };

    socket.on('update_data', handleUpdateData);

    const interval = setInterval(() => {
      socket.emit('request_data', symbol);
    }, 5000);

    return () => {
      socket.off('update_data', handleUpdateData);
      clearInterval(interval);
    };
  }, [symbol]);

  const renderIndicators = () => {
    const series = [];
    const additionalYAxis = []; // Lưu trữ cấu hình yAxis cho các chỉ báo

    let currentYAxisIndex = 2; // Bắt đầu từ yAxis[1] vì yAxis[0] là cho giá trị chính (candlestick)

    if (selectedIndicators.includes('MA10')) {
      series.push({
        type: 'sma',
        linkedTo: 'candlestick',
        params: { period: 10 },
        name: 'MA 10',
        lineColor: '#FF5733',
        yAxis: 0, // Dùng yAxis[0] cho MA
      });
    }

    if (selectedIndicators.includes('MA20')) {
      series.push({
        type: 'sma',
        linkedTo: 'candlestick',
        params: { period: 20 },
        name: 'MA 20',
        lineColor: '#33FF57',
        yAxis: 0, // Dùng yAxis[0] cho MA
      });
    }

    if (selectedIndicators.includes('MA50')) {
      series.push({
        type: 'sma',
        linkedTo: 'candlestick',
        params: { period: 50 },
        name: 'MA 50',
        lineColor: '#3357FF',
        yAxis: 0, // Dùng yAxis[0] cho MA
      });
    }

    if (selectedIndicators.includes('EMA')) {
      series.push({
        type: 'ema',
        linkedTo: 'candlestick',
        params: { period: 20 },
        name: 'EMA 20',
        lineColor: '#FF33A1',
        yAxis: 0, // Dùng yAxis[0] cho EMA
      });
    }

    if (selectedIndicators.includes('Bollinger Bands')) {
      series.push({
        type: 'bb',
        linkedTo: 'candlestick',
        params: { period: 20, standardDeviation: 2 },
        name: 'Bollinger Bands',
        lineColor: '#8A2BE2',
        yAxis: 0, // Dùng yAxis[0] cho Bollinger Bands
      });
    }

    if (selectedIndicators.includes('Parabolic SAR')) {
      series.push({
        type: 'psar',
        linkedTo: 'candlestick',
        params: { acceleration: 0.02, maxAcceleration: 0.2 },
        name: 'Parabolic SAR',
        lineColor: '#FF1493',
        yAxis: 0, // Dùng yAxis[0] cho Parabolic SAR
      });
    }

    if (selectedIndicators.includes('RSI')) {
      additionalYAxis.push({
        gridLineWidth: 0.5,
        gridLineColor: '#444444',
        minorGridLineWidth: 0,
        title: { text: 'RSI', style: { color: '#FFD700' } },
        labels: { style: { color: '#FFD700' } },
        opposite: true,
      });
      series.push({
        type: 'rsi',
        linkedTo: 'candlestick',
        params: { period: 14 },
        name: 'RSI',
        lineColor: '#FFD700',
        yAxis: currentYAxisIndex++, // Dùng yAxis riêng cho RSI
      });
    }

    if (selectedIndicators.includes('MACD')) {
      additionalYAxis.push({
        gridLineWidth: 0.5,
        gridLineColor: '#444444',
        minorGridLineWidth: 0,
        title: { text: 'MACD', style: { color: '#FF4500' } },
        labels: { style: { color: '#FF4500' } },
        opposite: true,
      });

      series.push({
        type: 'macd',
        linkedTo: 'candlestick',
        params: { shortPeriod: 12, longPeriod: 26, signalPeriod: 9 },
        name: 'MACD',
        lineColor: '#FF4500',
        yAxis: currentYAxisIndex++, // Dùng yAxis riêng cho MACD
      });
    }

    if (selectedIndicators.includes('Stochastic Oscillator')) {
      additionalYAxis.push({
        gridLineWidth: 0.5,
        gridLineColor: '#444444',
        minorGridLineWidth: 0,
        title: { text: 'Stochastic', style: { color: '#00CED1' } },
        labels: { style: { color: '#00CED1' } },
        opposite: true,
      });

      series.push({
        type: 'stochastic',
        linkedTo: 'candlestick',
        params: { period: 14, slowKPeriod: 3, slowDPeriod: 3 },
        name: 'Stochastic Oscillator',
        lineColor: '#00CED1',
        yAxis: currentYAxisIndex++, // Dùng yAxis riêng cho Stochastic
      });
    }

    return { series, additionalYAxis };
  };

  const candlestickSeries = data.map((item) => [
    addHours(parseISO(item.time), 7).getTime(),
    item.open,
    item.high,
    item.low,
    item.close,
  ]);

  const volumeSeries = data.map((item) => {
    const volumeColor = item.close > item.open ? '#089981' : '#F23645';
    return [
      addHours(parseISO(item.time), 7).getTime(),
      item.volume,
      volumeColor,
    ];
  });

  const last100Data = candlestickSeries.slice(-100);
  const xMin = last100Data[0] ? last100Data[0][0] : null;
  const xMax = last100Data[last100Data.length - 1]
    ? last100Data[last100Data.length - 1][0]
    : null;

  const { series, additionalYAxis } = renderIndicators();
  const subChartCount = additionalYAxis.length;
  const subChartHeight =
    subChartCount > 0 ? Math.max(100 / (3 + subChartCount), 10) : 0; // Chiều cao tối thiểu 10%
  const mainChartHeight = 100 - subChartCount * subChartHeight;

  const options = {
    accessibility: { enabled: false },
    chart: {
      backgroundColor: '#161A25',
      animation: false,
    },
    credits: { enabled: false },
    rangeSelector: {
      verticalAlign: 'bottom',
      buttons: [
        { type: 'day', count: 1, text: '1D' },
        { type: 'month', count: 1, text: '1M' },
        { type: 'month', count: 3, text: '3M' },
        { type: 'month', count: 6, text: '6M' },
        { type: 'year', count: 1, text: '1Y' },
        { type: 'all', text: 'All' },
      ],
      buttonTheme: {
        fill: '#161A25',
        style: { color: '#ffffff' },
        states: {
          hover: { fill: '#0056b3' },
          select: { fill: '#0056b3' },
        },
      },
    },
    xAxis: {
      type: 'datetime',
      gridLineWidth: 0.5,
      gridLineColor: '#444444',
      minorGridLineWidth: 0,
      labels: { style: { color: '#92959E' } },
      min: xMin,
      max: xMax,
    },
    yAxis: [
      {
        gridLineWidth: 0.5,
        gridLineColor: '#444444',
        minorGridLineWidth: 0,
        labels: { format: '{value:.2f}', style: { color: '#92959E' } },
        opposite: true,
        offset: 30,
        title: { text: 'Price', style: { color: '#92959E' } },
        height: mainChartHeight + '%', // Điều chỉnh chiều cao của main chart
      },
      {
        // Trục y cho volume
        opposite: true,
        labels: { enabled: false },
        min: 0,
        softMin: 0,
        softMax: null,
        maxPadding: 2, // Thêm padding 50% ở phía trên
        gridLineWidth: 0,
        height: mainChartHeight + '%', // Điều chỉnh chiều cao của main chart
      },
      ...additionalYAxis.map((axis, index) => ({
        ...axis,
        top: `${mainChartHeight + index * subChartHeight}%`, // Phân bổ top dựa trên số lượng subchart
        height: `${subChartHeight}%`, // Chiều cao động của mỗi subchart
        offset: 30,
      })), // Thêm các yAxis cho chỉ báo vào đây
    ],
    series: [
      {
        type: 'candlestick',
        name: 'Candlestick',
        id: 'candlestick',
        data: candlestickSeries,
        color: '#F23645',
        upColor: '#089981',
        lineColor: '#F23645',
        upLineColor: '#089981',
        yAxis: 0, // Dùng yAxis[0] cho candlestick
      },
      ...series, // Thêm các chỉ báo vào đây
      {
        type: 'column',
        name: 'Volume',
        data: volumeSeries.map((item) => [item[0], item[1]]),
        yAxis: 1, // Dùng yAxis[1] cho volume
        colorByPoint: true,
        colors: volumeSeries.map((item) => {
          const baseColor = item[2];
          return baseColor === '#089981'
            ? 'rgba(8, 153, 129, 0.3)'
            : 'rgba(242, 54, 69, 0.3)';
        }),
      },
    ],
    plotOptions: {
      candlestick: {
        lineColor: '#000',
        upLineColor: '#4db84d', // Màu viền cho nến tăng
        downLineColor: '#ff4d4d', // Màu viền cho nến giảm
      },
      column: {
        borderColor: '#ccc', // Viền của cột volume
      },
    },
    navigator: { enabled: false },
    scrollbar: { enabled: false },
  };

  return (
    <>
      <HighchartsReact
        highcharts={Highcharts}
        constructorType={'stockChart'}
        options={options}
        containerProps={{
          style: { height: `100%`, width: '100%' },
        }}
      />
    </>
  );
};

export default CandlestickChart;
