import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { paymentOrderVnpayService } from '../../services/userService';
import './OrderHomePage.scss';

function VnpayPaymentPage(props) {
  const [inputValues, setInputValues] = useState({
    orderType: 'billpayment',
    orderDescription: 'Thanh toan don hang',
    bankCode: '', // Defaulting to empty lets VNPAY show its own beautiful bank selection screen
    language: 'vn',
    amount: '',
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!location.state?.orderData) {
      navigate('/');
      return;
    }
    setInputValues((prev) => ({
      ...prev,
      amount: location.state.orderData.total,
    }));
  }, [location, navigate]);

  let handleOnclick = async () => {
    setIsProcessing(true);
    let res = await paymentOrderVnpayService({
      orderType: inputValues.orderType,
      orderDescription: inputValues.orderDescription,
      bankCode: inputValues.bankCode,
      language: inputValues.language,
      amount: inputValues.amount,
    });
    if (res && res.errCode == 200) {
      localStorage.setItem('orderData', JSON.stringify(location.state.orderData));
      window.location.href = res.link;
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ background: 'var(--c-bg-alt)', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* App-like Header */}
      <div style={{ background: 'var(--c-surface)', padding: '16px 20px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', fontSize: '20px', color: 'var(--c-text)', cursor: 'pointer', padding: 0 }}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '18px', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--c-text)' }}>
          Thanh toán an toàn
        </h1>
        <div style={{ width: '20px' }}></div> {/* Spacer */}
      </div>

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-8">
            
            {/* VNPay Logo Banner */}
            <div className="text-center mb-4">
              <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png" alt="VNPAY Logo" style={{ height: '48px' }} />
              <p style={{ marginTop: '12px', color: 'var(--c-text-soft)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
                Cổng thanh toán điện tử an toàn, tiện lợi
              </p>
            </div>

            <div className="card-customer" style={{ padding: '0', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
              
              {/* Amount Highlight */}
              <div style={{ background: 'var(--grad-primary)', padding: '32px 24px', textAlign: 'center', color: '#fff' }}>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng thanh toán</p>
                <h2 style={{ fontSize: '36px', fontWeight: '800', margin: 0, fontFamily: 'var(--font-accent)' }}>
                  {inputValues.amount ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inputValues.amount) : '0 ₫'}
                </h2>
              </div>

              {/* Order Details Form */}
              <div style={{ padding: '24px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed var(--c-border)' }}>
                  <span style={{ color: 'var(--c-text-soft)', fontSize: '15px' }}>Mã nạp/đơn hàng</span>
                  <span style={{ fontWeight: '600', color: 'var(--c-text)' }}>Giao dịch mua sắm</span>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '14px', color: 'var(--c-text-soft)', marginBottom: '8px', display: 'block' }}>Ghi chú giao dịch (Tùy chọn)</label>
                  <input
                    value={inputValues.orderDescription}
                    onChange={(e) => setInputValues({...inputValues, orderDescription: e.target.value})}
                    type="text"
                    style={{
                      width: '100%', padding: '12px 16px', background: 'var(--c-surface-2)', 
                      border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', 
                      outline: 'none', color: 'var(--c-text)', fontSize: '15px'
                    }}
                  />
                </div>

                {/* Info Note */}
                <div style={{ display: 'flex', gap: '12px', background: 'rgba(24, 144, 255, 0.05)', padding: '16px', borderRadius: 'var(--r-md)', marginBottom: '32px' }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#1890ff', fontSize: '20px', marginTop: '2px' }}></i>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--c-text-soft)', lineHeight: 1.5 }}>
                    Bạn sẽ được chuyển hướng đến cổng thanh toán bảo mật của VNPAY. Bạn có thể chọn thẻ ATM, thẻ tín dụng hoặc ứng dụng Ngân hàng trên trang tiếp theo.
                  </p>
                </div>

                {/* Checkout Action */}
                <button
                  onClick={handleOnclick}
                  disabled={isProcessing}
                  style={{
                    width: '100%', height: '56px', background: 'var(--c-text)', color: '#fff',
                    border: 'none', borderRadius: 'var(--r-full)', fontSize: '16px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 14px rgba(45, 27, 46, 0.2)'
                  }}
                  onMouseOver={(e) => { if (!isProcessing) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={(e) => { if (!isProcessing) e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {isProcessing ? (
                    <><i className="fa-solid fa-circle-notch fa-spin"></i> Đang kết nối VNPAY...</>
                  ) : (
                    <>Chuyển qua VNPAY <i className="fa-solid fa-arrow-right"></i></>
                  )}
                </button>
              </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--c-text-muted)' }}>
              Bằng việc thanh toán, bạn đồng ý với Điều khoản dịch vụ của chúng tôi.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default VnpayPaymentPage;
