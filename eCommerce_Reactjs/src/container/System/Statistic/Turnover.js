import React, { useState } from 'react';
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
  const [totalPrice, setTotalPrice] = useState(0);
  const [type, setType] = useState('day');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [dateTime, setDateTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const handleFilter = async () => {
    setLoading(true);
    try {
      const res = await getStatisticOverturn({ oneDate: type === 'day' ? startDate : dateTime, twoDate: endDate, type });
      if (res?.errCode === 0) {
        const total = res.data.reduce((sum, o) => sum + o.totalpriceProduct, 0);
        setTotalPrice(total);
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

  return (
    <div className="ap-page">
      <PageHeader title="📈 Thống kê doanh thu" subtitle="Lọc và phân tích doanh thu theo ngày / tháng / năm"
        actions={data.length > 0 && <button className="ap-btn ap-btn-success" onClick={() => CommonUtils.exportExcel(dataExport, 'Doanh thu', 'TurnOver')}>📊 Xuất Excel</button>}
      />

      {/* Filter toolbar */}
      <div className="ap-card" style={{ marginBottom: 20 }}>
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
              <div className="ap-form-group" style={{ minWidth: 220 }}>
                <label className="ap-label">Khoảng ngày</label>
                <DatePicker className="ap-input" selectsRange startDate={startDate} endDate={endDate}
                  onChange={setDateRange} isClearable dateFormat="dd/MM/yyyy" placeholderText="Chọn khoảng ngày" />
              </div>
            )}
            {type === 'month' && (
              <div className="ap-form-group">
                <label className="ap-label">Chọn tháng</label>
                <DatePicker className="ap-input" selected={dateTime} onChange={setDateTime} dateFormat="MM/yyyy" showMonthYearPicker placeholderText="Tháng/Năm" />
              </div>
            )}
            {type === 'year' && (
              <div className="ap-form-group">
                <label className="ap-label">Chọn năm</label>
                <DatePicker className="ap-input" selected={dateTime} onChange={setDateTime} dateFormat="yyyy" showYearPicker placeholderText="Năm" />
              </div>
            )}
            <button className="ap-btn ap-btn-primary" onClick={handleFilter} disabled={loading}
              style={{ height: 40, alignSelf: 'flex-end', marginBottom: 2 }}>
              {loading ? '⏳...' : '🔍 Lọc dữ liệu'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary card */}
      {data.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Tổng đơn hàng', value: data.length, icon: '📦', color: '#6366f1' },
            { label: 'Doanh thu', value: CommonUtils.formatter.format(totalPrice), icon: '💰', color: '#f59e0b' },
            { label: 'TB/đơn', value: CommonUtils.formatter.format(Math.round(totalPrice / data.length)), icon: '📊', color: '#10b981' },
          ].map((s, i) => (
            <div key={i} className="ap-card" style={{ margin: 0 }}>
              <div className="ap-card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ap-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: s.color }}>{s.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="ap-card">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr><th>Mã đơn</th><th>Ngày đặt</th><th>Loại ship</th><th>Voucher</th><th>Thanh toán</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Tổng tiền</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={8} /> :
                data.length === 0 ? <EmptyState icon="📈" title="Chọn khoảng thời gian và nhấn Lọc" desc="Kết quả thống kê sẽ hiển thị tại đây" /> :
                  data.map((item, idx) => (
                    <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx * 20}ms` }}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--ap-primary)', fontWeight: 600 }}>#{item.id}</td>
                      <td style={{ fontSize: 12, color: 'var(--ap-text-muted)', whiteSpace: 'nowrap' }}>{moment.utc(item.createdAt).local().format('DD/MM/YYYY HH:mm')}</td>
                      <td style={{ fontSize: 13 }}>{item.typeShipData?.type}</td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc' }}>{item.voucherData?.codeVoucher || '—'}</span></td>
                      <td><span className={`ap-badge ${item.isPaymentOnlien === 0 ? 'ap-badge-gray' : 'ap-badge-cyan'}`}>{item.isPaymentOnlien === 0 ? '💵 Tiền mặt' : '💳 Online'}</span></td>
                      <td><span className={`ap-badge ${STATUS_BADGE[item.statusOrderData?.value] || 'ap-badge-gray'}`}>{item.statusOrderData?.value}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>{CommonUtils.formatter.format(item.totalpriceProduct)}</td>
                      <td><Link to={`/admin/order-detail/${item.id}`} className="ap-btn ap-btn-ghost ap-btn-sm">🔍</Link></td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default Turnover;
