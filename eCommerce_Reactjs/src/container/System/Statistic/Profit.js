import React, { useState, useEffect } from 'react';
import { getStatisticProfit } from '../../../services/userService';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CommonUtils from '../../../utils/CommonUtils';
import moment from 'moment';
import { SkeletonRows, EmptyState, PageHeader } from '../AdminShared';

const Profit = () => {
  const [data, setData] = useState([]);
  const [dataExport, setDataExport] = useState([]);
  const [stats, setStats] = useState({ actualRevenue: 0, actualImport: 0, actualProfit: 0, deliveredOrders: 0 });
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
        const res = await getStatisticProfit({ oneDate: type === 'day' ? startDate : dateTime, twoDate: endDate, type });
        if (res?.errCode === 0) {
          let actualRevenue = 0, actualImport = 0, actualProfit = 0, deliveredOrders = 0;
          const exported = res.data.map(item => {
            const status = item.statusOrderData?.value;
            if (status === 'Đã giao' || status === 'Đã giao hàng') {
              actualRevenue += item.totalpriceProduct;
              actualImport += item.importPrice;
              actualProfit += item.profitPrice;
              deliveredOrders++;
            }
            return { id: item.id, createdAt: moment.utc(item.createdAt).local().format('DD/MM/YYYY HH:mm'), typeShip: item.typeShipData?.type, codeVoucher: item.voucherData?.codeVoucher, paymentType: item.isPaymentOnlien === 0 ? 'Tiền mặt' : 'Online', statusOrder: item.statusOrderData?.value, totalpriceProduct: item.totalpriceProduct, importPrice: item.importPrice, profitPrice: item.profitPrice };
          });
          setData(res.data); setDataExport(exported); setStats({ actualRevenue, actualImport, actualProfit, deliveredOrders });
        }
      } finally { setLoading(false); }
    };
    fetchData();
  }, [type, startDate, endDate, dateTime]);

  const fmt = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  return (
    <div className="ap-page">
      <PageHeader title="💹 Thống kê lợi nhuận" subtitle="Phân tích lợi nhuận theo ngày / tháng / năm"
        actions={data.length > 0 && <button className="ap-btn ap-btn-success" onClick={() => CommonUtils.exportExcel(dataExport, 'Lợi nhuận', 'Profit')}>📊 Xuất Excel</button>}
      />
      <div className="ap-card" style={{ marginBottom: 20, position: 'relative', zIndex: 10 }}>
        <div className="ap-card-body">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="ap-form-group" style={{ minWidth: 160 }}>
              <label className="ap-label">Loại thống kê</label>
              <select className="ap-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="day">Theo ngày</option>
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
              </select>
            </div>
            {type === 'day' && (
              <div className="ap-form-group" style={{ minWidth: 280 }}>
                <label className="ap-label">Khoảng ngày</label>
                <DatePicker className="ap-input" selectsRange startDate={startDate} endDate={endDate} onChange={setDateRange} isClearable dateFormat="dd/MM/yyyy" placeholderText="Chọn khoảng ngày" popperPlacement="bottom-start" portalId="root" />
              </div>
            )}
            {type === 'month' && (
              <div className="ap-form-group">
                <label className="ap-label">Chọn tháng</label>
                <DatePicker className="ap-input" selected={dateTime} onChange={setDateTime} dateFormat="MM/yyyy" showMonthYearPicker popperPlacement="bottom-start" portalId="root" />
              </div>
            )}
            {type === 'year' && (
              <div className="ap-form-group">
                <label className="ap-label">Chọn năm</label>
                <DatePicker className="ap-input" selected={dateTime} onChange={setDateTime} dateFormat="yyyy" showYearPicker popperPlacement="bottom-start" portalId="root" />
              </div>
            )}
            {/* Removed the manual filter button */}
          </div>
        </div>
      </div>

      {/* Alert Note */}
      {data.length > 0 && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#93c5fd', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span> 
          <span><strong>Lưu ý:</strong> Báo cáo Lợi nhuận Ròng dưới đây chỉ được tính toán dựa trên các đơn hàng có trạng thái <strong>"Đã giao"</strong> thành công.</span>
        </div>
      )}

      {data.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Tổng đơn thành công', value: stats.deliveredOrders, icon: '📦', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
            { label: 'Doanh thu thực tế', value: fmt(stats.actualRevenue), icon: '💰', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
            { label: 'Tổng tiền vốn', value: fmt(stats.actualImport), icon: '📥', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
            { label: 'Lợi Nhuận Ròng', value: fmt(stats.actualProfit), icon: '💎', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ap-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="ap-table" style={{ minWidth: 900 }}>
            <thead>
              <tr><th>Mã đơn</th><th>Ngày đặt</th><th>Voucher</th><th>Thanh toán</th><th>Trạng thái</th><th style={{textAlign:'right'}}>Doanh thu</th><th style={{textAlign:'right'}}>Tiền nhập</th><th style={{textAlign:'right'}}>Lợi nhuận</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={9} /> :
                data.length === 0 ? <EmptyState icon="💹" title="Không có dữ liệu" desc="Chưa có dữ liệu thống kê trong khoảng thời gian này" /> :
                  data.map((item, idx) => {
                    const profit = item.profitPrice;
                    const status = item.statusOrderData?.value;
                    const isSuccess = status === 'Đã giao' || status === 'Đã giao hàng';
                    const isCancelled = status === 'Đã hủy' || status === 'Đã huỷ';
                    
                    return (
                      <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx * 20}ms`, opacity: isSuccess ? 1 : 0.6 }}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--ap-primary)', fontWeight: 600 }}>#{item.id}</td>
                        <td style={{ fontSize: 12, color: 'var(--ap-text-muted)', whiteSpace: 'nowrap' }}>{moment.utc(item.createdAt).local().format('DD/MM/YYYY HH:mm')}</td>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc' }}>{item.voucherData?.codeVoucher || '—'}</span></td>
                        <td><span className={`ap-badge ${item.isPaymentOnlien === 0 ? 'ap-badge-gray' : 'ap-badge-cyan'}`}>{item.isPaymentOnlien === 0 ? '💵 Mặt' : '💳 Online'}</span></td>
                        <td><span className={`ap-badge ${isSuccess ? 'ap-badge-green' : (isCancelled ? 'ap-badge-red' : 'ap-badge-amber')}`}>{status}</span></td>
                        <td style={{ textAlign: 'right', color: '#fbbf24', fontWeight: 600 }}>{isCancelled && '-'}{fmt(item.totalpriceProduct)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--ap-text-muted)' }}>{isCancelled && '-'}{fmt(item.importPrice)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: !isSuccess ? 'var(--ap-text-muted)' : (profit >= 0 ? '#10b981' : '#ef4444') }}>{!isSuccess ? 'Không tính' : fmt(profit)}</td>
                        <td><Link to={`/admin/order-detail/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm">🔍</Link></td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Profit;
