import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { paymentOrderVnpaySuccessService, confirmOrderVnpay } from '../../services/userService';
import { toast } from 'react-toastify';
import './OrderHomePage.scss';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

function VnpayPaymentSuccess(props) {
  let query = useQuery();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'failed'
  const [paymentInfo, setPaymentInfo] = useState(null);
  const hasRun = React.useRef(false);
  useEffect(() => {
    if (hasRun.current) return; // ← THÊM - chặn lần chạy thứ 2
    hasRun.current = true; // ← THÊM

    let objectParam = {
      vnp_Amount: query.get('vnp_Amount'),
      vnp_BankCode: query.get('vnp_BankCode'),
      vnp_BankTranNo: query.get('vnp_BankTranNo'),
      vnp_CardType: query.get('vnp_CardType'),
      vnp_OrderInfo: query.get('vnp_OrderInfo'),
      vnp_PayDate: query.get('vnp_PayDate'),
      vnp_ResponseCode: query.get('vnp_ResponseCode'),
      vnp_TmnCode: query.get('vnp_TmnCode'),
      vnp_TransactionNo: query.get('vnp_TransactionNo'),
      vnp_TransactionStatus: query.get('vnp_TransactionStatus'),
      vnp_TxnRef: query.get('vnp_TxnRef'),
      vnp_SecureHash: query.get('vnp_SecureHash'),
    };

    setPaymentInfo(objectParam);

    let confirm = async () => {
      let orderData = JSON.parse(localStorage.getItem('orderData'));
      localStorage.removeItem('orderData');

      if (orderData) {
        let res = await confirmOrderVnpay(objectParam);
        if (res && res.errCode == 0) {
          await createNewOrder(orderData);
        } else {
          setStatus('failed');
        }
      } else {
        setStatus('failed');
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
    if (!amount) return '0';
    return Number(amount / 100).toLocaleString('vi-VN') + ' VNĐ';
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 14) return dateStr;
    return `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}/${dateStr.slice(0, 4)} ${dateStr.slice(8, 10)}:${dateStr.slice(10, 12)}:${dateStr.slice(12, 14)}`;
  };

  const handleGoToOrders = () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      window.location.href = '/user/order/' + userData.id;
    } else {
      window.location.href = '/';
    }
  };

  return (
    <>
      <div className="wrap-order">
        <div className="wrap-heading-order">
          <NavLink to="/" className="navbar-brand logo_h ">
            <img src="/resources/img/logo.png" alt="" />
          </NavLink>
          <span>Thanh Toán VNPAY</span>
        </div>

        <div className="bg-light py-5">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-12 col-md-6 col-lg-5">
                <div className="card border-0 shadow-sm rounded-4">
                  {/* HEADER */}
                  <div className="card-body text-center pt-4 pb-3 border-bottom">
                    {status === 'loading' && (
                      <>
                        <div
                          className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                          style={{ width: 72, height: 72 }}
                        >
                          <div
                            className="spinner-border text-primary"
                            role="status"
                            style={{ width: 32, height: 32 }}
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                        <h5 className="fw-bold mb-1">Đang xử lý</h5>
                        <p className="text-muted small mb-0">Vui lòng chờ trong giây lát...</p>
                      </>
                    )}

                    {status === 'success' && (
                      <>
                        <div
                          className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                          style={{ width: 72, height: 72 }}
                        >
                          <i className="fas fa-check-circle text-success fs-2"></i>
                        </div>
                        <h5 className="fw-bold text-success mb-1">Thanh toán thành công!</h5>
                        <p className="text-muted small mb-0">Đơn hàng của bạn đã được xác nhận</p>
                      </>
                    )}

                    {status === 'failed' && (
                      <>
                        <div
                          className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                          style={{ width: 72, height: 72 }}
                        >
                          <i className="fas fa-times-circle text-danger fs-2"></i>
                        </div>
                        <h5 className="fw-bold text-danger mb-1">Thanh toán thất bại</h5>
                        <p className="text-muted small mb-0">Đã có lỗi xảy ra, vui lòng thử lại</p>
                      </>
                    )}
                  </div>

                  {/* BODY - thông tin đơn hàng */}
                  {paymentInfo && status !== 'loading' && (
                    <div className="card-body px-4 py-3">
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="text-muted small">Số tiền</span>
                        <span className="fw-bold text-primary">
                          {formatAmount(paymentInfo.vnp_Amount)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="text-muted small">Ngân hàng</span>
                        <span className="fw-semibold">{paymentInfo.vnp_BankCode}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="text-muted small">Loại thẻ</span>
                        <span className="fw-semibold">{paymentInfo.vnp_CardType}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="text-muted small">Nội dung</span>
                        <span className="fw-semibold">{paymentInfo.vnp_OrderInfo}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="text-muted small">Mã giao dịch</span>
                        <span className="fw-semibold">{paymentInfo.vnp_TransactionNo}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2">
                        <span className="text-muted small">Thời gian</span>
                        <span className="fw-semibold">{formatDate(paymentInfo.vnp_PayDate)}</span>
                      </div>
                    </div>
                  )}

                  {/* FOOTER - nút điều hướng */}
                  {status !== 'loading' && (
                    <div className="card-body px-4 pt-0 pb-4 d-flex flex-column gap-2">
                      <button
                        className="btn btn-primary w-100 fw-semibold"
                        onClick={handleGoToOrders}
                      >
                        Xem đơn hàng của tôi
                      </button>
                      <NavLink to="/" className="btn btn-outline-secondary w-100">
                        Tiếp tục mua sắm
                      </NavLink>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-100 bg-light" style={{ height: 100 }} />
    </>
  );
}

export default VnpayPaymentSuccess;
