import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { paymentOrderVnpaySuccessService, confirmOrderVnpay } from '../../services/userService';
import { toast } from 'react-toastify';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

function VnpayPaymentSuccess(props) {
  let query = useQuery();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'failed'
  const [paymentInfo, setPaymentInfo] = useState(null);
  const hasRun = React.useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const objectParam = {};
    for (const [key, value] of query.entries()) {
      if (key.startsWith('vnp_')) {
        objectParam[key] = value;
      }
    }

    setPaymentInfo(objectParam);

    let confirm = async () => {
      let orderData = JSON.parse(localStorage.getItem('orderData'));
      localStorage.removeItem('orderData');

      if (orderData) {
        try {
          let res = await confirmOrderVnpay(objectParam);
          if (res && res.errCode === 0) {
            await createNewOrder(orderData);
          } else {
            console.error('VNPay Verification Failed:', res);
            setStatus('failed');
            toast.error(res?.errMessage || 'Xác thực giao dịch thất bại');
          }
        } catch (error) {
          console.error('Error confirming VNPay order:', error);
          setStatus('failed');
          toast.error('Có lỗi xảy ra khi xác thực giao dịch');
        }
      } else {
        console.error('No order data found in localStorage');
        setStatus('failed');
        toast.error('Không tìm thấy thông tin đơn hàng');
      }
    };
    confirm();
  }, []);

  let createNewOrder = async (data) => {
    let res = await paymentOrderVnpaySuccessService(data);
    if (res && res.errCode == 0) {
      setStatus('success');
      toast.success('Thanh toán hóa đơn thành công');
    } else {
      setStatus('failed');
      toast.error(res.errMessage);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount / 100);
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 14) return dateStr;
    return `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}/${dateStr.slice(0, 4)} ${dateStr.slice(8, 10)}:${dateStr.slice(10, 12)}:${dateStr.slice(12, 14)}`;
  };

  const handleGoToOrders = () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      navigate('/user/order/' + userData.id);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ background: 'var(--c-bg-alt)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Minimal Header */}
      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: '800', color: 'var(--c-text)', letterSpacing: '0.5px' }}>
          SOLANA SHOP
        </h1>
      </div>

      <div className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-8">
            
            {/* Digital Receipt Card */}
            <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
              
              {/* Receipt Header (Status) */}
              <div style={{ padding: '40px 24px 32px', textAlign: 'center', background: status === 'success' ? '#fafafa' : status === 'failed' ? '#fff1f0' : '#fff' }}>
                {status === 'loading' && (
                  <>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--c-overlay)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: 'var(--c-primary)' }}></i>
                    </div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: 'var(--c-text)' }}>Đang xác thực...</h2>
                    <p style={{ margin: 0, color: 'var(--c-text-soft)', fontSize: '14px' }}>Vui lòng giữ nguyên trang web</p>
                  </>
                )}

                {status === 'success' && (
                  <>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#52c41a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 16px rgba(82, 196, 26, 0.2)' }}>
                      <i className="fa-solid fa-check" style={{ fontSize: '28px', color: '#fff' }}></i>
                    </div>
                    <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: '#237804' }}>Thanh toán thành công</h2>
                    <h1 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: '800', color: 'var(--c-text)' }}>
                      {formatAmount(paymentInfo?.vnp_Amount)}
                    </h1>
                  </>
                )}

                {status === 'failed' && (
                  <>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ff4d4f', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 8px 16px rgba(255, 77, 79, 0.2)' }}>
                      <i className="fa-solid fa-xmark" style={{ fontSize: '28px', color: '#fff' }}></i>
                    </div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800', color: '#a8071a' }}>Giao dịch thất bại</h2>
                    <p style={{ margin: 0, color: '#cf1322', fontSize: '14px' }}>Bạn đã hủy giao dịch hoặc có lỗi xảy ra</p>
                  </>
                )}
              </div>

              {/* Dashed Line separator (Ticket effect) */}
              <div style={{ position: 'relative', height: '20px', background: 'transparent' }}>
                <div style={{ position: 'absolute', top: '50%', left: '-10px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--c-bg-alt)', transform: 'translateY(-50%)', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', top: '50%', right: '-10px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--c-bg-alt)', transform: 'translateY(-50%)', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', top: '50%', left: '10px', right: '10px', borderTop: '2px dashed var(--c-border)', transform: 'translateY(-50%)' }}></div>
              </div>

              {/* Receipt Details */}
              {paymentInfo && status !== 'loading' && (
                <div style={{ padding: '24px 32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--c-text-soft)', fontSize: '14px' }}>Mã tham chiếu</span>
                    <span style={{ color: 'var(--c-text)', fontSize: '14px', fontWeight: '600' }}>{paymentInfo.vnp_TransactionNo || '---'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--c-text-soft)', fontSize: '14px' }}>Thời gian</span>
                    <span style={{ color: 'var(--c-text)', fontSize: '14px', fontWeight: '600' }}>{formatDate(paymentInfo.vnp_PayDate) || '---'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--c-text-soft)', fontSize: '14px' }}>Phương thức</span>
                    <span style={{ color: 'var(--c-text)', fontSize: '14px', fontWeight: '600' }}>VNPAY {paymentInfo.vnp_BankCode ? `(${paymentInfo.vnp_BankCode})` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--c-text-soft)', fontSize: '14px' }}>Nội dung</span>
                    <span style={{ color: 'var(--c-text)', fontSize: '14px', fontWeight: '600', textAlign: 'right', maxWidth: '60%' }}>{paymentInfo.vnp_OrderInfo || '---'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {status !== 'loading' && (
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexDirection: 'column' }}>
                <button
                  onClick={handleGoToOrders}
                  style={{
                    width: '100%', height: '52px', background: 'var(--c-text)', color: '#fff',
                    border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Xem đơn hàng của tôi
                </button>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    width: '100%', height: '52px', background: 'transparent', color: 'var(--c-text)',
                    border: '1px solid var(--c-border-strong)', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--c-surface-2)'; e.currentTarget.style.borderColor = 'var(--c-text)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--c-border-strong)'; }}
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default VnpayPaymentSuccess;
