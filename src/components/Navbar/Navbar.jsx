import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () =>{
    return (
        <nav className ="navbar">
            <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/Robots">Robots</Link></li>
            </ul>
        </nav>
    )
}