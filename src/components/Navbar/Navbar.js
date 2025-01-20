// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="logo">
                <img src="../../assets/images/logo.png" alt="logo" />
            </div>
            <ul className="navbar-links">
                <li><Link to="/home">Home</Link></li>
                <li><Link to="/robots">Robots</Link></li>
                <li><Link to="/sponsors">Sponsors</Link></li>
            </ul>
        </nav>
    );
};

export default Navbar;
