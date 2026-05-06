import React from 'react';
import { Link } from 'react-router-dom';
import './PageNotFound.css';

const PageNotFound = () => {
    return (
        <div className="solana-404-container">
            <div className="solana-404-card">
                <div className="solana-404-header">
                    <span className="solana-404-digit">4</span>
                    <div className="solana-404-circle">
                        <i className="fas fa-shopping-bag"></i>
                    </div>
                    <span className="solana-404-digit">4</span>
                </div>
                
                <h1 className="solana-404-title">Ối! Trang này biến mất rồi</h1>
                <p className="solana-404-text">
                    Đừng lo lắng, đôi khi những điều tốt đẹp nhất lại khó tìm thấy nhất. 
                    Hãy quay lại cửa hàng và tiếp tục hành trình mua sắm của bạn nhé!
                </p>
                
                <div className="solana-404-actions">
                    <Link to="/" className="solana-btn-primary">
                        <i className="fas fa-home"></i> Về Trang Chủ
                    </Link>
                    <Link to="/shop" className="solana-btn-outline">
                        <i className="fas fa-store"></i> Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
            
            <div className="solana-404-bg-icons">
                <i className="fas fa-heart"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-gift"></i>
                <i className="fas fa-tag"></i>
                <i className="fas fa-cart-plus"></i>
            </div>
        </div>
    );
};

export default PageNotFound;
