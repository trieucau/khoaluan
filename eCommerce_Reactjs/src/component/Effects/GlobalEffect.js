import React, { useEffect, useState, memo } from 'react';
import './GlobalEffect.scss';

// Giảm số lượng sao xuống 20% so với 180 (còn 144 hạt) để không gian thoáng hơn
const STAR_COUNT = 144;

const GlobalEffect = () => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Bổ sung hàng loạt màu sắc phản quang (Neon) có độ tương phản cực kỳ cao
    const colors = [
      '#FFD700', // Vàng Gold
      '#FF6B9D', // Hồng đậm của shop
      '#FFFFFF', // Trắng ngọc
      '#00FFFF', // Xanh lơ (Cyan)
      '#39FF14', // Xanh Neon phản quang
      '#B026FF', // Tím điện (Electric Purple)
      '#FF00FF', // Đỏ tươi (Magenta)
      '#FFA500'  // Cam chói
    ];

    const generatedStars = Array.from({ length: STAR_COUNT }).map((_, i) => {
      const size = Math.random() * 4 + 2; // Kích thước to hơn một chút (2px - 6px)
      const left = Math.random() * 100;
      const top = Math.random() * 100 + 100;
      const duration = Math.random() * 12 + 8; // Bay nhanh hơn một chút (8s - 20s)
      const delay = Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        id: i,
        style: {
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}vw`,
          top: `${top}vh`,
          backgroundColor: color,
          boxShadow: `0 0 ${size * 2}px ${size / 2}px ${color}`, // Hào quang tỏa sáng mạnh hơn
          animation: `floatStar ${duration}s linear ${delay}s infinite`,
        },
      };
    });

    setStars(generatedStars);
  }, []);

  // Nếu không có sao nào thì không render container
  if (stars.length === 0) return null;

  return (
    <div className="global-star-effect-container">
      {stars.map((star) => (
        <div key={star.id} className="star-particle" style={star.style} />
      ))}
    </div>
  );
};

// Dùng React.memo để ngăn chặn re-render không cần thiết, giúp tăng hiệu năng
export default memo(GlobalEffect);
