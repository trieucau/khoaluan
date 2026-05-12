import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  getCountCardStatistic,
  getCountStatusOrder,
  getStatisticByMonth,
  getStatisticByDay,
} from '../../services/userService';
import moment from 'moment';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AdminShipperMap from './ShipperMap/AdminShipperMap';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const chartDefaults = {
  responsive: true,
  plugins: {
    legend: { labels: { color: '#8b949e', font: { family: 'Be Vietnam Pro', size: 12 } } },
  },
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
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else setDisplay(start);
    }, 28);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <>
      {prefix}
      {display.toLocaleString('vi-VN')}
    </>
  );
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadCountCard();
    loadStatusOrder();
    loadStatisticOrderByMonth(moment(year).format('YYYY'));
    loadStatisticOrderByDay(moment(year).format('YYYY'), moment(new Date()).format('M'));
  }, []);

  const loadCountCard = async () => {
    const res = await getCountCardStatistic();
    if (res?.errCode === 0) {
      setCountCard(res.data);
      setLoadingCards(false);
    }
  };
  const loadStatusOrder = async () => {
    const res = await getCountStatusOrder({
      oneDate: type === 'day' ? startDate : DateTime,
      twoDate: endDate,
      type,
    });
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
    {
      label: 'Tổng đơn hàng',
      value: CountCard.countOrder,
      icon: <i className="fa-solid fa-box"></i>,
      color: 'indigo',
      to: '/admin/list-order',
    },
    {
      label: 'Đánh giá',
      value: CountCard.countReview,
      icon: <i className="fa-solid fa-star"></i>,
      color: 'purple',
      to: null,
    },
    {
      label: 'Sản phẩm',
      value: CountCard.countProduct,
      icon: <i className="fa-solid fa-bag-shopping"></i>,
      color: 'green',
      to: '/admin/list-product',
    },
    {
      label: 'Thành viên',
      value: CountCard.countUser,
      icon: <i className="fa-solid fa-users"></i>,
      color: 'amber',
      to: '/admin/list-user',
    },
  ];

  const dataLine = {
    labels: StatisticOrderByMonth.arrayMonthLable,
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: StatisticOrderByMonth.arrayMonthValue,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.12)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
      },
    ],
  };

  const dataBar = {
    labels: StatisticOrderByDay.arrayDayLable,
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: StatisticOrderByDay.arrayDayValue,
        backgroundColor: 'rgba(139,92,246,0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const dataPie = {
    labels: CountStatusOrder.arrayLable,
    datasets: [
      {
        data: CountStatusOrder.arrayValue,
        backgroundColor: [
          'rgba(99,102,241,0.8)',
          'rgba(16,185,129,0.8)',
          'rgba(245,158,11,0.8)',
          'rgba(239,68,68,0.8)',
          'rgba(6,182,212,0.8)',
          'rgba(139,92,246,0.8)',
        ],
        borderColor: ['#161b22'],
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#8b949e', font: { family: 'Be Vietnam Pro', size: 11 }, padding: 12 },
      },
    },
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-title">
          <i className="fa-solid fa-gauge" style={{ marginRight: 8 }}></i>Tổng quan hệ thống
        </div>
        <div className="ap-page-subtitle">Thống kê và báo cáo hoạt động kinh doanh</div>
      </div>

      {/* Stat Cards */}
      <div
        className="ap-stats-grid"
        style={{
          display: 'flex',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          overflowX: isMobile ? 'auto' : 'visible',
          WebkitOverflowScrolling: 'touch',
          gap: 16,
          paddingBottom: isMobile ? 8 : 0,
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {STATS.map((s) => {
          const Tag = s.to ? Link : 'div';
          return (
            <Tag
              key={s.label}
              to={s.to}
              className={`ap-stat-card ${s.color}`}
              style={{
                minWidth: isMobile ? 220 : 'calc(25% - 12px)',
                flexShrink: 0,
                textDecoration: 'none',
                cursor: s.to ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div className={`ap-stat-icon ${s.color}`}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="ap-stat-value" style={{ color: 'var(--ap-text-primary)' }}>
                  {loadingCards ? (
                    <div
                      className="ap-skeleton ap-skeleton-text"
                      style={{ width: 60, height: 28 }}
                    />
                  ) : (
                    <AnimatedNumber value={s.value || 0} />
                  )}
                </div>
                <div className="ap-stat-label" style={{ color: 'var(--ap-text-dim)' }}>
                  {s.label}
                </div>
              </div>
              {s.to && <div style={{ fontSize: 20, color: 'var(--ap-text-dim)' }}>›</div>}
            </Tag>
          );
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(12, 1fr)',
          gap: 16,
        }}
      >
        {/* 1. Map Card (Desktop: Top-Left, Mobile: 3rd) */}
        <div
          className="ap-card"
          style={{
            gridColumn: isMobile ? '1' : 'span 7',
            order: isMobile ? 3 : 1,
            margin: 0,
            minWidth: 0,
          }}
        >
          <div
            className="ap-card-header"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 10,
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
            }}
          >
            <span className="ap-card-title" style={{ fontSize: 14 }}>
              📍 Bảng Điều Hành Shipper Trực Tuyến
            </span>
            <Link
              to="/admin/shipper-map"
              className="ap-btn ap-btn-ghost ap-btn-sm"
              style={{
                textDecoration: 'none',
                padding: '4px 10px',
                fontSize: 11,
                alignSelf: isMobile ? 'flex-end' : 'auto',
              }}
            >
              Mở lớn ↗
            </Link>
          </div>
          <div
            className="ap-card-body"
            style={{
              padding: 0,
              overflow: 'hidden',
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}
          >
            <AdminShipperMap isMini={true} />
          </div>
        </div>

        {/* Pie Chart */}
        <div
          className="ap-card"
          style={{
            gridColumn: isMobile ? '1' : 'span 5',
            order: isMobile ? 1 : 2,
            margin: 0,
            minWidth: 0,
          }}
        >
          <div
            className="ap-card-header"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
            }}
          >
            <span className="ap-card-title" style={{ fontSize: 14 }}>
              🥧 Trạng thái đơn hàng
            </span>
            <div
              className="ap-chart-toolbar"
              style={{
                margin: 0,
                gap: 8,
                display: 'grid',
                gridTemplateColumns: 'minmax(70px, 1fr) minmax(100px, 2fr) auto',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <select
                className="ap-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{ width: '100%', fontSize: 11, padding: '4px 8px', height: 28 }}
              >
                <option value="day">Ngày</option>
                <option value="month">Tháng</option>
                <option value="year">Năm</option>
              </select>

              <div className="ap-datepicker-wrap" style={{ width: '100%', display: 'flex' }}>
                {type === 'day' && (
                  <DatePicker
                    className="ap-input"
                    style={{ width: '100%', fontSize: 11, padding: '4px 8px', height: 28 }}
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={setDateRange}
                    isClearable
                    placeholderText="Ngày"
                  />
                )}
                {type === 'month' && (
                  <DatePicker
                    className="ap-input"
                    style={{ width: '100%', fontSize: 11, padding: '4px 8px', height: 28 }}
                    selected={DateTime}
                    onChange={setDateTime}
                    dateFormat="MM/yyyy"
                    showMonthYearPicker
                    placeholderText="Tháng"
                  />
                )}
                {type === 'year' && (
                  <DatePicker
                    className="ap-input"
                    style={{ width: '100%', fontSize: 11, padding: '4px 8px', height: 28 }}
                    selected={DateTime}
                    onChange={setDateTime}
                    dateFormat="yyyy"
                    showYearPicker
                    placeholderText="Năm"
                  />
                )}
              </div>

              <button
                className="ap-btn ap-btn-primary"
                onClick={loadStatusOrder}
                style={{
                  padding: '0 12px',
                  fontSize: 11,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                Lọc
              </button>
            </div>
          </div>
          <div
            className="ap-card-body"
            style={{ height: 220, padding: '10px', display: 'flex', justifyContent: 'center' }}
          >
            <Pie data={dataPie} options={{ ...pieOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Line Chart */}
        <div
          className="ap-card"
          style={{
            gridColumn: isMobile ? '1' : 'span 7',
            order: isMobile ? 2 : 3,
            margin: 0,
            minWidth: 0,
          }}
        >
          <div
            className="ap-card-header"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 10,
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
            }}
          >
            <span className="ap-card-title" style={{ fontSize: 14 }}>
              📈 Doanh thu theo tháng
            </span>
            <div
              className="ap-chart-toolbar"
              style={{
                margin: 0,
                gap: 8,
                display: 'flex',
                width: isMobile ? '100%' : '140px',
                justifyContent: isMobile ? 'flex-end' : 'flex-end',
              }}
            >
              <div className="ap-datepicker-wrap" style={{ width: '100%', display: 'flex' }}>
                <DatePicker
                  selected={year}
                  onChange={(date) => {
                    setYear(date);
                    loadStatisticOrderByMonth(moment(date).format('YYYY'));
                  }}
                  dateFormat="yyyy"
                  showYearPicker
                  placeholderText="Năm"
                  className="ap-input"
                  style={{ width: '100%', fontSize: 11, padding: '4px 8px', height: 28 }}
                />
              </div>
            </div>
          </div>
          <div className="ap-card-body" style={{ height: 260, padding: '10px' }}>
            <Line
              options={{
                ...chartDefaults,
                maintainAspectRatio: false,
                plugins: { ...chartDefaults.plugins, title: { display: false } },
              }}
              data={dataLine}
            />
          </div>
        </div>

        {/* Bar Chart */}
        <div
          className="ap-card"
          style={{
            gridColumn: isMobile ? '1' : 'span 5',
            order: isMobile ? 4 : 4,
            margin: 0,
            minWidth: 0,
          }}
        >
          <div
            className="ap-card-header"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 10,
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
            }}
          >
            <span className="ap-card-title" style={{ fontSize: 14 }}>
              <i className="fa-solid fa-file-excel" style={{ marginRight: 6 }}></i>Doanh thu theo
              ngày
            </span>
            <div
              className="ap-chart-toolbar"
              style={{
                margin: 0,
                gap: 8,
                display: 'flex',
                width: isMobile ? '100%' : '140px',
                justifyContent: isMobile ? 'flex-end' : 'flex-end',
              }}
            >
              <div className="ap-datepicker-wrap" style={{ width: '100%', display: 'flex' }}>
                <DatePicker
                  className="ap-input"
                  style={{ width: '100%', fontSize: 11, padding: '4px 8px', height: 28 }}
                  selected={month}
                  onChange={(date) => {
                    setMonth(date);
                    loadStatisticOrderByDay(moment(date).format('YYYY'), moment(date).format('M'));
                  }}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  placeholderText="Tháng"
                />
              </div>
            </div>
          </div>
          <div className="ap-card-body" style={{ height: 220, padding: '10px' }}>
            <Bar
              options={{
                ...chartDefaults,
                maintainAspectRatio: false,
                plugins: { ...chartDefaults.plugins, title: { display: false } },
              }}
              data={dataBar}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
