import React, { useState } from 'react';
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
  const [sumPrice, setSumPrice] = useState(0);
  const [type, setType] = useState('day');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [dateTime, setDateTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const handleFilter = async () => {
    setLoading(true);
    try {
      const res = await getStatisticProfit({ oneDate: type === 'day' ? startDate : dateTime, twoDate: endDate, type });
      if (res?.errCode === 0) {
        let sum = 0;
        const exported = res.data.map(item => {
          sum += item.profitPrice;
          return { id: item.id, createdAt: moment.utc(item.createdAt).local().format('DD/MM/YYYY HH:mm'), typeShip: item.typeShipData?.type, codeVoucher: item.voucherData?.codeVoucher, paymentType: item.isPaymentOnlien === 0 ? 'Tiền mặt' : 'Online', statusOrder: item.statusOrderData?.value, totalpriceProduct: item.totalpriceProduct, importPrice: item.importPrice, profitPrice: item.profitPrice };
        });
        setData(res.data); setDataExport(exported); setSumPrice(sum);
      }
    } finally { setLoading(false); }
  };

  const fmt = v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  const totalRevenue = data.reduce((s, o) => s + o.totalpriceProduct, 0);
  const totalImport = data.reduce((s, o) => s + o.importPrice, 0);

  return (
    <div className="ap-page">
      <PageHeader title="💹 Thống kê lợi nhuận" subtitle="Phân tích lợi nhuận theo ngày / tháng / năm"
        actions={data.length > 0 && <button className="ap-btn ap-btn-success" onClick={() => CommonUtils.exportExcel(dataExport, 'Lợi nhuận', 'Profit')}>📊 Xuất Excel</button>}
      />
      <div className="ap-card" style={{ marginBottom: 20 }}>
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
              <div className="ap-form-group" style={{ minWidth: 220 }}>
                <label className="ap-label">Khoảng ngày</label>
                <DatePicker className="ap-input" selectsRange startDate={startDate} endDate={endDate} onChange={setDateRange} isClearable dateFormat="dd/MM/yyyy" placeholderText="Chọn khoảng ngày" />
              </div>
            )}
            {type === 'month' && (
              <div className="ap-form-group">
                <label className="ap-label">Chọn tháng</label>
                <DatePicker className="ap-input" selected={dateTime} onChange={setDateTime} dateFormat="MM/yyyy" showMonthYearPicker />
              </div>
            )}
            {type === 'year' && (
              <div className="ap-form-group">
                <label className="ap-label">Chọn năm</label>
                <DatePicker className="ap-input" selected={dateTime} onChange={setDateTime} dateFormat="yyyy" showYearPicker />
              </div>
            )}
            <button className="ap-btn ap-btn-primary" onClick={handleFilter} disabled={loading} style={{ height: 40, alignSelf: 'flex-end', marginBottom: 2 }}>
              {loading ? '⏳...' : '🔍 Lọc'}
            </button>
          </div>
        </div>
      </div>

      {data.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Tổng đơn', value: data.length, icon: '📦', color: '#6366f1' },
            { label: 'Doanh thu', value: fmt(totalRevenue), icon: '💰', color: '#f59e0b' },
            { label: 'Tiền nhập', value: fmt(totalImport), icon: '📥', color: '#64748b' },
            { label: 'Lợi nhuận', value: fmt(sumPrice), icon: '💹', color: '#10b981' },
          ].map((s, i) => (
            <div key={i} className="ap-card" style={{ margin: 0 }}>
              <div className="ap-card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ap-text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: s.color }}>{s.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ap-card">
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr><th>Mã đơn</th><th>Ngày đặt</th><th>Voucher</th><th>Thanh toán</th><th style={{textAlign:'right'}}>Doanh thu</th><th style={{textAlign:'right'}}>Tiền nhập</th><th style={{textAlign:'right'}}>Lợi nhuận</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={8} /> :
                data.length === 0 ? <EmptyState icon="💹" title="Chọn khoảng thời gian và nhấn Lọc" /> :
                  data.map((item, idx) => {
                    const profit = item.profitPrice;
                    return (
                      <tr key={item.id} className="ap-row-enter" style={{ animationDelay: `${idx * 20}ms` }}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--ap-primary)', fontWeight: 600 }}>#{item.id}</td>
                        <td style={{ fontSize: 12, color: 'var(--ap-text-muted)' }}>{moment.utc(item.createdAt).local().format('DD/MM/YYYY HH:mm')}</td>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc' }}>{item.voucherData?.codeVoucher || '—'}</span></td>
                        <td><span className={`ap-badge ${item.isPaymentOnlien === 0 ? 'ap-badge-gray' : 'ap-badge-cyan'}`}>{item.isPaymentOnlien === 0 ? '💵 Mặt' : '💳 Online'}</span></td>
                        <td style={{ textAlign: 'right', color: '#fbbf24', fontWeight: 600 }}>{fmt(item.totalpriceProduct)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--ap-text-muted)' }}>{fmt(item.importPrice)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: profit >= 0 ? '#10b981' : '#ef4444' }}>{fmt(profit)}</td>
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
