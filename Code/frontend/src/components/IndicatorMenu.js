import React, { useState } from 'react';

const indicators = [
  { name: 'SMA (Simple Moving Average)', type: 'sma' },
  { name: 'EMA (Exponential Moving Average)', type: 'ema' },
  { name: 'WMA (Weighted Moving Average)', type: 'wma' },
  { name: 'MACD (Moving Average Convergence Divergence)', type: 'macd' },
  { name: 'RSI (Relative Strength Index)', type: 'rsi' },
  { name: 'Bollinger Bands', type: 'bb' },
  { name: 'Stochastic Oscillator', type: 'stochastic' },
  { name: 'ATR (Average True Range)', type: 'atr' },
  { name: 'ADX (Average Directional Index)', type: 'adx' },
  { name: 'CCI (Commodity Channel Index)', type: 'cci' },
  { name: 'Accumulation/Distribution (A/D Line)', type: 'ad' },
  { name: 'Force Index', type: 'fi' },
  { name: 'Money Flow Index (MFI)', type: 'mfi' },
  { name: 'Chande Momentum Oscillator (CMO)', type: 'cmo' },
  { name: 'Ichimoku Cloud', type: 'ichimoku' },
];

const IndicatorMenu = ({ onToggleIndicator }) => {
  const [activeIndicators, setActiveIndicators] = useState([]);

  const handleToggle = (indicator) => {
    const isActive = activeIndicators.includes(indicator.type);
    const newActiveIndicators = isActive
      ? activeIndicators.filter(type => type !== indicator.type)
      : [...activeIndicators, indicator.type];

    setActiveIndicators(newActiveIndicators);
    onToggleIndicator(indicator.type, !isActive); // Gọi callback để thêm hoặc loại bỏ chỉ báo
  };

  return (
    <div>
      <h5>Chỉ báo</h5>
      {indicators.map(indicator => (
        <div key={indicator.type}>
          <label>
            <input
              type="checkbox"
              checked={activeIndicators.includes(indicator.type)}
              onChange={() => handleToggle(indicator)}
            />
            {indicator.name}
          </label>
        </div>
      ))}
    </div>
  );
};

export default IndicatorMenu;