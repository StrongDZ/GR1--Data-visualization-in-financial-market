import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/NavBar.css';

function NavBar() {
  const [selectedNav, setSelectedNav] = useState('/');

  const handleNavClick = (path) => {
    setSelectedNav(path);
  };

  return (
    <nav className="navbar">
      <div className="container-navbar">
        <Link className="navbar-brand" to="/">
          StockFlow
        </Link>
        <div className="navbar-collapse">
          <ul className="navbar-nav">
            {/* <li className="nav-item">
              <Link
                className={`nav-link ${
                  selectedNav === '/' ? 'selected-nav-link' : ''
                }`}
                to="/"
                onClick={() => handleNavClick('/')}
              >
                Dashboard
              </Link>
            </li> */}
            <li className="nav-item">
              <Link
                className={`nav-link ${
                  selectedNav === '/' ? 'selected-nav-link' : ''
                }`}
                to=""
                onClick={() => handleNavClick('/')}
              >
                Tìm kiếm cơ hội
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${
                  selectedNav === '/charts' ? 'selected-nav-link' : ''
                }`}
                to="/charts"
                onClick={() => handleNavClick('/charts')}
              >
                Biểu đồ
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
