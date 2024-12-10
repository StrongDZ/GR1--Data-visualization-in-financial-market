// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import OpportunitySearch from './components/OpportunitySearch';
import Charts from './components/Charts';

function App() {
  const appStyle = {
    overflow: 'hidden', // Ẩn thanh cuộn
    height: '100vh', // Đảm bảo chiều cao 100% của viewport
    backgroundColor: '#56585D',
  };

  return (
    <div style={appStyle}>
      <NavBar />
      <Routes>
        {/* <Route path="/" element={<Dashboard />} /> */}
        <Route path="/" element={<OpportunitySearch />} />
        <Route path="/charts" element={<Charts />} />
      </Routes>
    </div>
  );
}

export default App;
