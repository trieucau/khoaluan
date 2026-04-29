import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link, useParams } from 'react-router-dom';
import './OrderUser.scss';
import { getAllOrdersByUser, updateStatusOrderService } from '../../services/userService';
import CommonUtils from '../../utils/CommonUtils';
import ModalCancelOrder from '../../component/ModalCancelOrder/ModalCancelOrder';

function OrderUser() {
  const { id } = useParams();

  const [DataOrder, setDataOrder] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancelModal, setCancelModal] = useState({ show: false, order: null });

  useEffect(() => {
    loadDataOrder();
  }, []);

  const loadDataOrder = async () => {
    if (!id) return;

    let order = await getAllOrdersByUser(id);
    if (order && order.errCode === 0) {
      let orderArray = [];
      order.data.forEach((item) => {
        orderArray = [...orderArray, ...item.order];
      });
      setDataOrder(orderArray);
    }
  };

  const handleCancelOrder = async (reason) => {
    let res = await updateStatusOrderService({
      id: cancelModal.order.id,
      statusId: 'S7',
      dataOrder: cancelModal.order,
      statusReason: reason,
    });

    if (res && res.errCode === 0) {
      toast.success('Hủy đơn hàng thành công');
      setCancelModal({ show: false, order: null });
      loadDataOrder();
    } else {
      toast.error(res?.errMessage || 'Hủy đơn thất bại');
    }
  };

  const handleReceivedOrder = async (orderId) => {
    let res = await updateStatusOrderService({
      id: orderId,
      statusId: 'S6',
    });

    if (res && res.errCode === 0) {
      toast.success('Đã nhận đơn hàng');
      loadDataOrder();
    }
  };

  const totalPriceDiscount = (price, discount) => {
    if (discount.typeVoucherOfVoucherData.typeVoucher === 'percent') {
      const discountValue = (price * discount.typeVoucherOfVoucherData.value) / 100;
      return price - Math.min(discountValue, discount.typeVoucherOfVoucherData.maxValue);
    }
    return price - discount.typeVoucherOfVoucherData.maxValue;
  };

  // ===== FILTER SEARCH + STATUS =====
  const filteredOrders = DataOrder.filter((order) => {
    const keyword = searchText.toLowerCase();

    const matchId = order.id?.toString().toLowerCase().includes(keyword);
    const matchShop = order.shopData?.name?.toLowerCase().includes(keyword);
    const matchProduct =
      order.orderDetail &&
      order.orderDetail.some((detail) => detail.product?.name?.toLowerCase().includes(keyword));

    const matchSearch = matchId || matchShop || matchProduct;
    const matchStatus = statusFilter === 'ALL' || order.statusId === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="container container-list-order rounded mt-5 mb-5">
      <div className="row">
        <div className="col-md-12">
          {/* SEARCH */}
          <div className="box-search-order">
            <i className="fas fa-search"></i>
            <input
              autoComplete="off"
              placeholder="Tìm kiếm theo Tên Shop, ID đơn hàng hoặc Tên Sản phẩm"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* STATUS FILTER */}
          <div className="mt-3 mb-3" style={{ maxWidth: '250px' }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="S3">Chờ xác nhận</option>
              <option value="S4">Chờ lấy hàng</option>
              <option value="S5">Đang giao hàng</option>
              <option value="S6">Đã giao hàng</option>
              <option value="S7">Hủy đơn</option>
              <option value="S8">Giao thất bại</option>
            </select>
          </div>

          {/* ORDER LIST */}
          {filteredOrders.length > 0 ? (
            filteredOrders.map((item, index) => {
              let price = 0;
              item.orderDetail?.forEach((detail) => {
                price += detail.quantity * detail.productDetail.discountPrice;
              });

              return (
                <div key={index} className="box-list-order">
                    {/* HEADER */}
                    <div className="content-top">
                      <div className="content-left">
                        <div className="label-favorite">Yêu thích</div>
                        <span className="label-name-shop">
                          {item.shopData?.name || 'Eiser shop'}
                        </span>
                        <div className="order-id">
                          Mã đơn: <strong>#{item.id}</strong>
                        </div>
                      </div>

                      <div className="content-right">
                        {item.statusOrderData?.value}
                        {item.isPaymentOnlien == 1 && ' | Đã thanh toán | '}
                      </div>
                    </div>

                    {/* PRODUCTS */}
                    {item.orderDetail?.map((detail, idx) => (
                      <div className="content-center" key={idx}>
                        <div className="box-item-order">
                          <img src={detail.productImage[0]?.image} alt="" />
                          <div className="box-des">
                            <span className="name">{detail.product?.name}</span>
                            <span className="type">
                              Phân loại: {detail.productDetail?.nameDetail} |{' '}
                              {detail.productDetailSize?.sizeData?.value}
                            </span>
                            <span>x{detail.quantity}</span>
                          </div>
                          <div className="box-price">
                            {CommonUtils.formatter.format(detail.productDetail.discountPrice)}
                          </div>
                        </div>
                      </div>
                    ))}                  {/* FOOTER */}
                  <div className="content-bottom">
                    <div className="up">
                      <span>Tổng số tiền: </span>
                      <span className="name">
                        {item.voucherData?.id
                          ? CommonUtils.formatter.format(
                              totalPriceDiscount(price, item.voucherData) + item.typeShipData.price
                            )
                          : CommonUtils.formatter.format(price + item.typeShipData.price)}
                      </span>
                    </div>

                    <div className="down">
                      <Link
                        to={`/user/order-tracking/${item.id}`}
                        className="btn btn-sm btn-outline-primary me-2"
                        style={{ padding: '6px 14px', borderRadius: '50px' }}
                      >
                        Theo dõi đơn
                      </Link>

                      {/* CHỈ cho hủy khi S3 - Chờ xác nhận */}
                      {item.statusId === 'S3' && (
                        <div
                          className="btn-buy"
                          onClick={() => setCancelModal({ show: true, order: item })}
                        >
                          Hủy đơn
                        </div>
                      )}

                      {item.statusId === 'S5' && (
                        <div className="btn-buy" onClick={() => handleReceivedOrder(item.id)}>
                          Đã nhận hàng
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="mt-4 text-center">Không tìm thấy đơn hàng phù hợp</div>
          )}
        </div>
      </div>

      {/* MODAL HỦY ĐƠN - tái sử dụng component chung */}
      <ModalCancelOrder
        show={cancelModal.show}
        onConfirm={handleCancelOrder}
        onClose={() => setCancelModal({ show: false, order: null })}
      />
    </div>
  );
}

export default OrderUser;
