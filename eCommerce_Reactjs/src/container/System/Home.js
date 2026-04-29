import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { getCountCardStatistic, getCountStatusOrder, getStatisticByMonth, getStatisticByDay } from '../../services/userService';
import moment from 'moment';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

const chartDefaults = {
  responsive: true,
  plugins: { legend: { labels: { color: '#8b949e', font: { family: 'Be Vietnam Pro', size: 12 } } } },
  scales: {
    x: { ticks: { color: '#8b949e' }, grid: { color: 'rgba(48,54,61,0.6)' } },
    y: { ticks: { color: '#8b949e' }, grid: { color: 'rgba(48,54,61,0.6)' } },
  },
};

const AnimatedNumber = ({ value, prefix = '' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const step = Math.ceil(value / 25);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 28);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display.toLocaleString('vi-VN')}</>;
};

const Home = () => {
  const [CountCard, setCountCard] = useState({});
  const [CountStatusOrder, setCountStatusOrder] = useState({});
  const [StatisticOrderByMonth, setStatisticOrderByMonth] = useState({});
  const [StatisticOrderByDay, setStatisticOrderByDay] = useState({});
  const [loadingCards, setLoadingCards] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [DateTime, setDateTime] = useState(new Date());
  const [type, setType] = useState('month');
  const [month, setMonth] = useState(new Date());
  const [year, setYear] = useState(new Date());

  useEffect(() => {
    loadCountCard();
    loadStatusOrder();
    loadStatisticOrderByMonth(moment(year).format('YYYY'));
    loadStatisticOrderByDay(moment(year).format('YYYY'), moment(new Date()).format('M'));
  }, []);

  const loadCountCard = async () => {
    const res = await getCountCardStatistic();
    if (res?.errCode === 0) { setCountCard(res.data); setLoadingCards(false); }
  };
  const loadStatusOrder = async () => {
    const res = await getCountStatusOrder({ oneDate: type === 'day' ? startDate : DateTime, twoDate: endDate, type });
    if (res?.errCode === 0) setCountStatusOrder(res.data);
  };
  const loadStatisticOrderByMonth = async (y) => {
    const res = await getStatisticByMonth(y);
    if (res?.errCode === 0) setStatisticOrderByMonth(res.data);
  };
  const loadStatisticOrderByDay = async (y, m) => {
    const res = await getStatisticByDay({ year: y, month: m });
    if (res?.errCode === 0) setStatisticOrderByDay(res.data);
  };

  const STATS = [
    { label: 'Tổng đơn hàng', value: CountCard.countOrder, icon: '📦', color: 'indigo', to: '/admin/list-order' },
    { label: 'Đánh giá', value: CountCard.countReview, icon: '⭐', color: 'purple', to: null },
    { label: 'Sản phẩm', value: CountCard.countProduct, icon: '🛍️', color: 'green', to: '/admin/list-product' },
    { label: 'Thành viên', value: CountCard.countUser, icon: '👥', color: 'amber', to: '/admin/list-user' },
  ];

  const dataLine = {
    labels: StatisticOrderByMonth.arrayMonthLable,
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      data: StatisticOrderByMonth.arrayMonthValue,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.12)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
    }],
  };

  const dataBar = {
    labels: StatisticOrderByDay.arrayDayLable,
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      data: StatisticOrderByDay.arrayDayValue,
      backgroundColor: 'rgba(139,92,246,0.7)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const dataPie = {
    labels: CountStatusOrder.arrayLable,
    datasets: [{
      data: CountStatusOrder.arrayValue,
      backgroundColor: ['rgba(99,102,241,0.8)','rgba(16,185,129,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)','rgba(6,182,212,0.8)','rgba(139,92,246,0.8)'],
      borderColor: ['#161b22'],
      borderWidth: 2,
    }],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right', labels: { color: '#8b949e', font: { family: 'Be Vietnam Pro', size: 11 }, padding: 12 } },
    },
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-title">📊 Tổng quan hệ thống</div>
        <div className="ap-page-subtitle">Thống kê và báo cáo hoạt động kinh doanh</div>
      </div>

      {/* Stat Cards */}
      <div className="ap-stats-grid">
        {STATS.map((s) => (
          <div key={s.label} className={`ap-stat-card ${s.color}`}>
            <div className={`ap-stat-icon ${s.color}`}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div className="ap-stat-value">
                {loadingCards ? (
                  <div className="ap-skeleton ap-skeleton-text" style={{ width: 60, height: 28 }} />
                ) : (
                  <AnimatedNumber value={s.value || 0} />
                )}
              </div>
              <div className="ap-stat-label">{s.label}</div>
            </div>
            {s.to && (
              <Link to={s.to} style={{ fontSize: 18, color: 'var(--ap-text-dim)', textDecoration: 'none', transition: 'var(--ap-transition)' }}
                onMouseEnter={e => e.target.style.color = 'var(--ap-primary-light)'}
                onMouseLeave={e => e.target.style.color = 'var(--ap-text-dim)'}
              >›</Link>
            )}
          </div>
        ))}
      </div>

      {/* Line Chart + Pie */}
      <div className="ap-grid-3" style={{ marginBottom: 20 }}>
        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">📈 Doanh thu theo tháng</span>
            <div className="ap-chart-toolbar" style={{ margin: 0, gap: 8 }}>
              <div className="ap-datepicker-wrap">
                <DatePicker
                  selected={year}
                  onChange={(date) => { setYear(date); loadStatisticOrderByMonth(moment(date).format('YYYY')); }}
                  dateFormat="yyyy"
                  showYearPicker
                  placeholderText="Chọn năm"
                />
              </div>
            </div>
          </div>
          <div className="ap-card-body">
            <Line options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, title: { display: false } } }} data={dataLine} />
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-card-header">
            <span className="ap-card-title">🥧 Trạng thái đơn hàng</span>
            <div className="ap-chart-toolbar" style={{ margin: 0, gap: 8 }}>
              <select className="ap-select" value={type} onChange={(e) => setType(e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }}>
                <option value="day">Ngày</option>
                <option value="month">Tháng</option>
                <option value="year">Năm</option>
              </select>
              {type === 'day' && (
                <div className="ap-datepicker-wrap">
                  <DatePicker selectsRange startDate={startDate} endDate={endDate} onChange={setDateRange} isClearable placeholderText="Chọn ngày" />
                </div>
              )}
              {type === 'month' && (
                <div className="ap-datepicker-wrap">
                  <DatePicker selected={DateTime} onChange={setDateTime} dateFormat="MM/yyyy" showMonthYearPicker placeholderText="Chọn tháng" />
                </div>
              )}
              {type === 'year' && (
                <div className="ap-datepicker-wrap">
                  <DatePicker selected={DateTime} onChange={setDateTime} dateFormat="yyyy" showYearPicker placeholderText="Chọn năm" />
                </div>
              )}
              <button className="ap-btn ap-btn-primary ap-btn-sm" onClick={loadStatusOrder}>Lọc</button>
            </div>
          </div>
          <div className="ap-card-body">
            <Pie data={dataPie} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="ap-card">
        <div className="ap-card-header">
          <span className="ap-card-title">📊 Doanh thu theo ngày</span>
          <div className="ap-datepicker-wrap">
            <DatePicker
              selected={month}
              onChange={(date) => { setMonth(date); loadStatisticOrderByDay(moment(date).format('YYYY'), moment(date).format('M')); }}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              placeholderText="Chọn tháng"
            />
          </div>
        </div>
        <div className="ap-card-body">
          <Bar options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, title: { display: false } } }} data={dataBar} />
        </div>
      </div>
    </div>
  );
};

export default Home;
