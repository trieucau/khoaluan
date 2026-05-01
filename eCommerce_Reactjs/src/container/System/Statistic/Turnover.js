import React, { useState, useEffect } from 'react';
import { getStatisticOverturn } from '../../../services/userService';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CommonUtils from '../../../utils/CommonUtils';
import moment from 'moment';
import { SkeletonRows, EmptyState, PageHeader } from '../AdminShared';

const STATUS_BADGE = {
  'Chờ xác nhận': 'ap-badge-amber', 'Đang xử lý': 'ap-badge-cyan',
  'Đang giao': 'ap-badge-indigo', 'Đã giao': 'ap-badge-green',
  'Đã hủy': 'ap-badge-red',
};

const Turnover = () => {
  const [data, setData] = useState([]);
  const [dataExport, setDataExport] = useState([]);
  const [stats, setStats] = useState({ actual: 0, pending: 0, cancelled: 0, totalOrders: 0, deliveredOrders: 0, cancelledOrders: 0 });
  const [type, setType] = useState('year');
  const [dateRange, setDateRange] = useState([new Date(), new Date()]);
  const [startDate, endDate] = dateRange;
  const [dateTime, setDateTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (type === 'day' && (!startDate || !endDate)) return;
      if ((type === 'month' || type === 'year') && !dateTime) return;

      setLoading(true);
      try {
        const res = await getStatisticOverturn({ oneDate: type === 'day' ? startDate : dateTime, twoDate: endDate, type });
        if (res?.errCode === 0) {
          let actual = 0, pending = 0, cancelled = 0;
          let deliveredOrders = 0, cancelledOrders = 0;
          
          res.data.forEach(item => {
             const status = item.statusOrderData?.value;
             const price = item.totalpriceProduct;
             if (status === 'Đã giao' || status === 'Đã giao hàng') {
                 actual += price;
                 deliveredOrders++;
             }
             else if (status === 'Đã hủy' || status === 'Đã huỷ') {
                 cancelled += price;
                 cancelledOrders++;
             }
             else pending += price;
          });

          setStats({ actual, pending, cancelled, totalOrders: res.data.length, deliveredOrders, cancelledOrders });
          setData(res.data);
          setDataExport(res.data.map(item => ({
            id: item.id,
            createdAt: moment.utc(item.createdAt).local().format('DD/MM/YYYY HH:mm:ss'),
            updatedAt: moment.utc(item.updatedAt).local().format('DD/MM/YYYY HH:mm:ss'),
            typeShip: item.typeShipData?.type,
            codeVoucher: item.voucherData?.codeVoucher,
            paymentType: item.isPaymentOnlien === 0 ? 'Tiền mặt' : 'Online',
            statusOrder: item.statusOrderData?.value,
            totalpriceProduct: item.totalpriceProduct,
          })));
        }
      } finally { setLoading(false); }
    };

    fetchData();
  }, [type, startDate, endDate, dateTime]);

  return (
    <div className="ap-page">
      <PageHeader title="📈 Thống kê doanh thu" subtitle="Lọc và phân tích doanh thu theo ngày / tháng / năm"
        actions={data.length > 0 && <button className="ap-btn ap-btn-success" onClick={() => CommonUtils.exportExcel(dataExport, 'Doanh thu', 'TurnOver')}>📊 Xuất Excel</button>}
      />

      {/* Filter toolbar */}
      <div className="ap-card" style={{ marginBottom: 20, position: 'relative', zIndex: 10 }}>
        <div className="ap-card-body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="ap-form-group" style={{ minWidth: 160 }}>
              <label className="ap-label">Loại thống kê</label>
              <select className="ap-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="day">Theo ngày (khoảng)</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
            </div>
            {type === 'day' && (
              <div className="ap-form-group" style={{ minWidth: 280 }}>
                <label className="ap-label">Khoảng ngày</label>
                <DatePicker className="ap-input" selectsRange startDate={startDate} endDate={endDate}
                  onChange={setDateRange} isClearable dateFormat="dd/MM/yyyy" placeholderText="Chọn khoảng ngày" popperPlacement="bottom-start" portalId="root" />
              </div>
            )}
            {type === 'month' && (
              <div className="ap-form-group">
                <label className="ap-label">Chọn tháng</label>
                <DatePicker className="ap-input" selected={dateTime} onChange={setDateTime} dateFormat="MM/yyyy" showMonthYearPicker placeholderText="Tháng/Năm" popperPlacement="bottom-start" portalId="root" />
              </div>
            )}
            {type === 'year' && (
              <div className="ap-form-group">
                <label className="ap-label">Chọn năm</label>
                <DatePicker className="ap-input" selected={dateTime} onChange={setDateTime} dateFormat="yyyy" showYearPicker placeholderText="Năm" popperPlacement="bottom-start" portalId="root" />
              </div>
            )}
            {/* Removed the manual filter button */}
          </div>
        </div>
      </div>

      {/* Summary card */}
      {data.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Doanh Thu Thực Tế', desc: `${stats.deliveredOrders} đơn đã giao`, value: CommonUtils.formatter.format(stats.actual), icon: '💰', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
            { label: 'Doanh Thu Chờ Thu', desc: `${stats.totalOrders - stats.deliveredOrders - stats.cancelledOrders} đơn đang xử lý`, value: CommonUtils.formatter.format(stats.pending), icon: '⏳', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
            { label: 'Khách Hủy (Thất Thoát)', desc: `${stats.cancelledOrders} đơn bị hủy`, value: CommonUtils.formatter.format(stats.cancelled), icon: '📉', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
            { label: 'Trung Bình / Đơn', desc: 'Chỉ tính đơn thành công', value: CommonUtils.formatter.format(stats.deliveredOrders > 0 ? Math.round(stats.actual / stats.deliveredOrders) : 0), icon: '📈', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
          ].map((s, i) => (
            <div key={i} className="ap-card" style={{ margin: 0, border: `1px solid ${s.color}40`, background: 'var(--ap-surface)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: s.bg, filter: 'blur(24px)' }} />
              
              <div className="ap-card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, border: `1px solid ${s.color}40` }}>
                  {s.icon}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 11, color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: s.color, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--ap-text-dim)', marginTop: 4 }}>{s.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="ap-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="ap-table" style={{ minWidth: 800 }}>
            <thead>
              <tr><th>Mã đơn</th><th>Ngày đặt</th><th>Loại ship</th><th>Voucher</th><th>Thanh toán</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Tổng tiền</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={8} /> :
                data.length === 0 ? <EmptyState icon="📈" title="Không có dữ liệu" desc="Chưa có dữ liệu thống kê trong khoảng thời gian này" /> :
                  data.map((item, idx) => {
                    const status = item.statusOrderData?.value;
                    const isSuccess = status === 'Đã giao' || status === 'Đã giao hàng';
                    const isCancelled = status === 'Đã hủy' || status === 'Đã huỷ';
                    return (
                      <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx * 20}ms` }}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--ap-primary)', fontWeight: 600 }}>#{item.id}</td>
                        <td style={{ fontSize: 12, color: 'var(--ap-text-muted)', whiteSpace: 'nowrap' }}>{moment.utc(item.createdAt).local().format('DD/MM/YYYY HH:mm')}</td>
                        <td style={{ fontSize: 13 }}>{item.typeShipData?.type}</td>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc' }}>{item.voucherData?.codeVoucher || '—'}</span></td>
                        <td><span className={`ap-badge ${item.isPaymentOnlien === 0 ? 'ap-badge-gray' : 'ap-badge-cyan'}`}>{item.isPaymentOnlien === 0 ? '💵 Tiền mặt' : '💳 Online'}</span></td>
                        <td><span className={`ap-badge ${STATUS_BADGE[item.statusOrderData?.value] || 'ap-badge-gray'}`}>{item.statusOrderData?.value}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: isSuccess ? '#10b981' : (isCancelled ? '#ef4444' : '#fbbf24') }}>{isCancelled && '-'}{CommonUtils.formatter.format(item.totalpriceProduct)}</td>
                        <td><Link to={`/admin/order-detail/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm">🔍</Link></td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Turnover;
