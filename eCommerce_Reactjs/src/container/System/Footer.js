import React from 'react';

const Footer = () => {
  return (
    <footer className="py-4 bg-light mt-auto">
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center justify-content-between small  text-center ">
          Bản quyền ©{new Date().getFullYear()} Đồ án tốt nghiệp của Phan Thành Triều & Võ Quang
          Tuấn Trí
        </div>
      </div>
    </footer>
  );
};
export default Footer;
