import React, { useEffect, useState } from 'react';
import './RippleEffect.scss';

const RippleEffect = () => {
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    const handleAddRipple = (e) => {
      // Xác định tọa độ X, Y dựa trên sự kiện click hoặc touch
      let x, y;
      if (e.type === 'touchstart') {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }

      // Phân biệt giao diện Khách hàng vs Admin/Shipper qua URL
      const path = window.location.pathname;
      const isAdminOrShipper = path.startsWith('/admin') || path.startsWith('/shipper');
      const rippleClass = isAdminOrShipper ? 'admin' : 'customer';

      // Tạo ID ngẫu nhiên cho gợn nước
      const newRipple = {
        id: new Date().getTime() + Math.random(),
        x,
        y,
        className: rippleClass
      };

      setRipples((prev) => [...prev, newRipple]);

      // Tự động xóa gợn nước sau khi animation kết thúc (800ms)
      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
      }, 800);
    };

    // Lắng nghe sự kiện trên toàn bộ màn hình (window)
    window.addEventListener('click', handleAddRipple);
    window.addEventListener('touchstart', handleAddRipple);

    return () => {
      window.removeEventListener('click', handleAddRipple);
      window.removeEventListener('touchstart', handleAddRipple);
    };
  }, []);

  if (ripples.length === 0) return null;

  return (
    <div className="ripple-container">
      {ripples.map((ripple) => {
        // Sử dụng vw (viewport width) để kích thước tự động tỷ lệ thuận với chiều rộng màn hình
        // Trên điện thoại (nhỏ), gợn nước sẽ nhỏ. Trên Desktop (lớn), gợn nước sẽ lớn.
        const style = {
          left: ripple.x,
          top: ripple.y,
          width: '8vw',
          height: '8vw',
        };

        return (
          <div
            key={ripple.id}
            className={`ripple ${ripple.className}`}
            style={style}
          />
        );
      })}
    </div>
  );
};

export default RippleEffect;
