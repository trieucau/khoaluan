import React, { useRef } from 'react';
import './Header.scss';

const BRANDS = [
  'Local Brand',
  'Streetwear',
  'Y2K Fashion',
  'Old Money',
  'Minimalist Style',
  'Sporty Chic',
  'Vintage Retro',
  'Korean Style',
  'Unisex Fashion',
  'Oversize Style',
  'Cargo Pants',
  'Baggy Jeans',
  'Athleisure',
  'Techwear',
  'Quiet Luxury',
  'Denim on Denim',
  'Coquette Style',
  'Clean Girl Style',
  'Office Core',
  'Dark Academia',
];

const TopMenu = (props) => {
  return (
    <div className="top_menu">
      <div className="top-marquee-container">
        <div className="top-marquee-track">
          {/* Mảng 1 */}
          {BRANDS.map((brand, index) => (
            <div key={`brand1-${index}`} className="brand-item">
              <i
                className="fa-solid fa-star"
                style={{ fontSize: '10px', marginRight: '10px', color: '#F8B195' }}
              ></i>
              {brand}
            </div>
          ))}
          {/* Mảng 2 (Bản sao để lặp vô tận) */}
          {BRANDS.map((brand, index) => (
            <div key={`brand2-${index}`} className="brand-item">
              <i
                className="fa-solid fa-star"
                style={{ fontSize: '10px', marginRight: '10px', color: '#F8B195' }}
              ></i>
              {brand}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopMenu;
