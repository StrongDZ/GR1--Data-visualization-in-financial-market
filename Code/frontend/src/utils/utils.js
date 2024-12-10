export const formatValue = (value) => {
  return value === 0 || isNaN(value)
    ? ''
    : value.toFixed(2).toLocaleString('vi-VN');
};
export const formatKL = (value) => {
  return isNaN(value)
    ? ''
    : Number((value * 10).toFixed(0)).toLocaleString('vi-VN');
};
export const formatValue1 = (value) => {
  return isNaN(value) ? '' : value.toFixed(2).toLocaleString('vi-VN');
};
export const formatKL1 = (value) => {
  return isNaN(value) ? '' : Number((value * 10).toFixed(0)).toLocaleString('vi-VN');
};

export const getCellColorClass = (value, refValue, ceiling, floor) => {
  if (value === ceiling) return 'ceiling-cell'; // Nếu giá trị bằng ceiling
  if (value === floor) return 'floor-cell'; // Nếu giá trị bằng floor
  if (value > refValue) return 'change-positive';
  if (value < refValue) return 'change-negative';
  if (value === refValue) return 'change-zero';
  return '';
};

export const formatHMS = (time) => {
  const date = new Date(time);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

const getSymbols = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/symbols');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const symbols = await response.json();
    // console.log("symbols:");
    // console.log(typeof(symbols));
    return symbols;
  } catch (error) {
    console.error('Error fetching symbols:', error);
    return [];
  }
};

export const symbols = getSymbols();

export function compareValues(value1, value2, symbol1, symbol2) {
  if (value1 < value2) {
    return -1; // value1 nhỏ hơn value2
  } else if (value1 > value2) {
    return 1; // value1 lớn hơn value2
  } else {
    // Nếu hai giá trị bằng nhau, so sánh đến symbols
    if (symbol1 < symbol2) {
      return -1; // symbol1 nhỏ hơn symbol2
    } else if (symbol1 > symbol2) {
      return 1; // symbol1 lớn hơn symbol2
    } else {
      return 0; // symbol1 bằng symbol2
    }
  }
}
