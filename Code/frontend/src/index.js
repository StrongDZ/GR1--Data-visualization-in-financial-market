// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import CSS

// Tạo một root element để render ứng dụng
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render ứng dụng App vào root element
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
            <ToastContainer />
        </BrowserRouter>
    </React.StrictMode>
);