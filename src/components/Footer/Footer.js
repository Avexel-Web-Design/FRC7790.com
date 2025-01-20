import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer" id="contact">
            <div className="social-links">
                <a href="https://twitter.com/frc7790" target="_blank" rel="noopener noreferrer">Twitter</a>
                <a href="https://www.instagram.com/frc7790/" target="_blank" rel="noopener noreferrer">Instagram</a>
            </div>
            <p>Licensed under the GNU General Public License Version 3</p>
        </footer>
    );
};

export default Footer;