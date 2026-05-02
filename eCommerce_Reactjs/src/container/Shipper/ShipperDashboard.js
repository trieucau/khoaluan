import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrdersByShipper } from '../../services/userService';
import moment from 'moment';

const STATUS_LABEL = { S4: 'Chờ lấy hàng', S5: 'Đang giao', S6: 'Đã giao', S7: 'Đã hủy', S8: 'Giao thất bại' };
const STATUS_BADGE = { S4: 'sp-badge-amber', S5: 'sp-badge-blue', S6: 'sp-badge-green', S7: 'sp-badge-red', S8: 'sp-badge-red' };

// --- ICONS ---
const IconBox = () => <svg className="lucide" viewBox="0 0 24 24"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const IconTruck = () => <svg className="lucide" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11h1v-1"/><path d="M15 18H9"/><path d="M19 18h2v-6h-5v6Z"/><path d="M18 12h3v-2l-3-4h-4v6h4Z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>;
const IconCheck = () => <svg className="lucide" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>;
const IconDollar = () => <svg className="lucide" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>;
const IconMap = () => <svg className="lucide" viewBox="0 0 24 24"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>;
const IconChart = () => <svg className="lucide" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 17v-4"/><path d="M12 17v-8"/><path d="M16 17v-2"/></svg>;
const IconClipboard = () => <svg className="lucide" viewBox="0 0 24 24"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>;
const IconBell = () => <svg className="lucide" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;

const formatMoney = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === undefined || value === null) return;
    let start = 0;
    const step = Math.ceil(value / 20) || 1;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
};

const ShipperDashboard = ({ gpsData }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({ 
    temp: '--', city: 'Đang tải...', icon: '🌤', 
    conditionMsg: 'Đang đánh giá', conditionColor: 'var(--sp-text-muted)' 
  });
  
  const [recentPeriod, setRecentPeriod] = useState('day');
  const [pastPeriod, setPastPeriod] = useState('week');

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const shipperId = userData?.id;
  const firstName = userData?.firstName || 'Shipper';
  
  const { isOnline, gpsStartTime, gpsTotalMs } = gpsData || { isOnline: false, gpsStartTime: null, gpsTotalMs: 0 };
  const [sessionTimeMs, setSessionTimeMs] = useState(gpsTotalMs);

  useEffect(() => {
    let timer;
    if (isOnline) {
      // Immediate update
      const now = Date.now();
      setSessionTimeMs(gpsTotalMs + (now - (gpsStartTime || now)));
      
      timer = setInterval(() => {
        const currentNow = Date.now();
        setSessionTimeMs(gpsTotalMs + (currentNow - (gpsStartTime || currentNow)));
      }, 1000);
    } else {
      setSessionTimeMs(gpsTotalMs);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isOnline, gpsStartTime, gpsTotalMs]);

  const formatMs = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!shipperId) { setLoading(false); return; }
    getAllOrdersByShipper({ shipperId })
      .then((res) => { if (res?.errCode === 0) setOrders(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shipperId]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        let lat = 10.7626;
        let lon = 106.6601;
        let city = 'Ho Chi Minh';

        try {
          const locRes = await fetch('http://ip-api.com/json/');
          if (locRes.ok) {
            const locData = await locRes.json();
            lat = locData.lat;
            lon = locData.lon;
            city = locData.city;
          }
        } catch (e) { console.log('Location fetch failed'); }

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (weatherRes.ok) {
          const data = await weatherRes.json();
          const temp = Math.round(data.current_weather.temperature);
          const wind = data.current_weather.windspeed;
          const code = data.current_weather.weathercode;
          
          let icon = '🌤';
          if (code === 0) icon = '☀️';
          else if (code >= 1 && code <= 3) icon = '🌤';
          else if (code >= 45 && code <= 48) icon = '🌫';
          else if (code >= 51 && code <= 67) icon = '🌧';
          else if (code >= 71 && code <= 77) icon = '❄️';
          else if (code >= 80 && code <= 82) icon = '🌦';
          else if (code >= 95 && code <= 99) icon = '⛈';

          let score = 100;
          if (code >= 45 && code <= 48) score -= 30;
          else if (code >= 51 && code <= 67) score -= 40;
          else if (code >= 71 && code <= 77) score -= 50;
          else if (code >= 80 && code <= 82) score -= 40;
          else if (code >= 95 && code <= 99) score -= 80;

          if (temp >= 40) score -= 40;
          else if (temp >= 35) score -= 20;
          else if (temp <= 10) score -= 20;

          if (wind >= 40) score -= 30;
          else if (wind >= 20) score -= 10;

          score = Math.max(0, score);
          
          let conditionMsg = '';
          let conditionColor = '';
          if (score >= 70) {
            conditionMsg = 'Phù hợp giao hàng';
            conditionColor = 'var(--sp-success)';
          } else if (score >= 40) {
            conditionMsg = 'Cẩn thận khi giao';
            conditionColor = 'var(--sp-warning)';
          } else {
            conditionMsg = 'Không nên giao';
            conditionColor = 'var(--sp-danger)';
          }

          setWeather({ temp, city, icon, conditionMsg, conditionColor });
        }
      } catch (err) {
        setWeather({ temp: '32', city: 'Ho Chi Minh', icon: '🌤', conditionMsg: 'Phù hợp giao hàng', conditionColor: 'var(--sp-success)' });
      }
    };
    fetchWeather();
  }, []);

  const today = moment().format('YYYY-MM-DD');
  const todayOrders = orders.filter((o) => moment(o.createdAt).format('YYYY-MM-DD') === today);
  
  // Base Stats calculations
  const pendingOrders = orders.filter(o => o.statusId === 'S4');
  const activeOrders = orders.filter(o => o.statusId === 'S5');
  
  // --- COMPARISON LOGIC ---
  const getDaysByPeriod = (p) => {
    switch (p) {
      case 'day': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      default: return 1;
    }
  };

  const calculateStats = (period, offsetDays = 0) => {
    const days = getDaysByPeriod(period);
    const end = moment().subtract(offsetDays, 'days').endOf('day');
    const start = moment().subtract(offsetDays + days - 1, 'days').startOf('day');
    
    const filtered = orders.filter(o => {
      const d = moment(o.createdAt);
      return d.isBetween(start, end, null, '[]');
    });

    return {
      total: filtered.length,
      waiting: filtered.filter(o => o.statusId === 'S4').length,
      delivering: filtered.filter(o => o.statusId === 'S5').length,
      completed: filtered.filter(o => o.statusId === 'S6').length,
      cancelled: filtered.filter(o => o.statusId === 'S7').length,
      failed: filtered.filter(o => o.statusId === 'S8').length,
    };
  };

  const recentDays = getDaysByPeriod(recentPeriod);
  const recentStats = calculateStats(recentPeriod, 0);
  const pastStats = calculateStats(pastPeriod, recentDays);

  const getChange = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const chartData = [
    { key: 'total', label: 'Tổng đơn', curr: recentStats.total, prev: pastStats.total, isGood: true },
    { key: 'waiting', label: 'Chờ lấy', curr: recentStats.waiting, prev: pastStats.waiting, isGood: true },
    { key: 'delivering', label: 'Đang giao', curr: recentStats.delivering, prev: pastStats.delivering, isGood: true },
    { key: 'completed', label: 'Hoàn thành', curr: recentStats.completed, prev: pastStats.completed, isGood: true },
    { key: 'cancelled', label: 'Đã hủy', curr: recentStats.cancelled, prev: pastStats.cancelled, isGood: false },
    { key: 'failed', label: 'Thất bại', curr: recentStats.failed, prev: pastStats.failed, isGood: false },
  ];

  const maxVal = Math.max(10, ...chartData.map(d => d.curr));
  const periodLabels = { day: 'Hôm nay', week: 'Tuần này', month: 'Tháng này', year: 'Năm nay' };
  const pastPeriodLabels = { day: 'Hôm qua', week: 'Tuần trước', month: 'Tháng trước', year: 'Năm trước' };

  let summaryText = '';
  const compChange = getChange(recentStats.completed, pastStats.completed);
  if (compChange > 0) summaryText = `Tỷ lệ hoàn thành đơn hàng tăng ${compChange}% so với ${pastPeriodLabels[pastPeriod]?.toLowerCase()}.`;
  else if (compChange < 0) summaryText = `Tỷ lệ hoàn thành đơn hàng giảm ${Math.abs(compChange)}% so với ${pastPeriodLabels[pastPeriod]?.toLowerCase()}.`;
  else summaryText = `Tỷ lệ hoàn thành đơn hàng duy trì ổn định so với ${pastPeriodLabels[pastPeriod]?.toLowerCase()}.`;
  
  const failChange = getChange(recentStats.failed + recentStats.cancelled, pastStats.failed + pastStats.cancelled);
  if (failChange > 0) summaryText += ` Lượng đơn huỷ/thất bại tăng ${failChange}%.`;
  else if (failChange < 0) summaryText += ` Lượng đơn huỷ/thất bại giảm ${Math.abs(failChange)}%.`;
  // --- END COMPARISON LOGIC ---
  
  // Weekly chart logic
  moment.locale('vi');
  const last7Days = Array.from({length: 7}).map((_, i) => moment().subtract(6 - i, 'days').format('YYYY-MM-DD'));
  
  // Monthly income logic
  const currentMonth = moment().format('YYYY-MM');
  const monthlyDone = orders.filter(o => o.statusId === 'S6' && moment(o.createdAt).format('YYYY-MM') === currentMonth);
  const monthlyFailed = orders.filter(o => (o.statusId === 'S7' || o.statusId === 'S8') && moment(o.createdAt).format('YYYY-MM') === currentMonth);
  const incomeMonth = monthlyDone.length * 15000;
  const targetIncome = 2600000;
  const progressPercent = Math.min(100, Math.round((incomeMonth / targetIncome) * 100));

  const recent = [...orders].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
  const activeList = activeOrders.slice(0, 2); // Show max 2 in left col

  return (
    <div className="sp-page">
      {/* Header Area */}
      <div className="sp-page-header-row" style={{ alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="sp-page-title">Xin chào, {firstName}! 👋</div>
          <div className="sp-page-subtitle">{moment().format('dddd, DD/MM/YYYY')} — Chúc bạn giao hàng thuận lợi</div>
          <div className="sp-top-tags">
            <span className="sp-top-tag">{weather.icon} {weather.temp}°C - {weather.city}</span>
            <span className="sp-top-tag" style={{ color: weather.conditionColor }}>🛵 {weather.conditionMsg}</span>
            <span className="sp-top-tag" style={{ color: 'var(--sp-success)' }}>📶 Kết nối tốt</span>
          </div>
        </div>
        <div className={`sp-online-status ${!isOnline ? 'off' : ''}`}>
          <div className={`sp-gps-dot ${isOnline ? 'on' : 'off'}`} style={{ width: 8, height: 8 }} />
          {isOnline ? (
            <span>Ca làm đang chạy - {formatMs(sessionTimeMs)}</span>
          ) : (
            <span>Ca làm đã dừng - Tổng: {formatMs(sessionTimeMs)}</span>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {pendingOrders.length > 0 && (
        <div className="sp-alert-banner">
          <div className="sp-alert-banner-content">
            <div className="sp-alert-banner-icon">🔔</div>
            <div>
              <div className="sp-alert-banner-title">Có {pendingOrders.length} đơn hàng mới đang chờ bạn nhận</div>
              <div className="sp-alert-banner-desc">Đơn gần nhất cách đây {moment(pendingOrders[0].updatedAt).fromNow(true)} - Khu vực: {pendingOrders[0].addressUser?.shipAdress?.split(',').pop() || 'Đang cập nhật'}</div>
            </div>
          </div>
          <Link to="/shipper/orders-available" className="sp-alert-banner-link">Xem ngay →</Link>
        </div>
      )}

      {/* Overview & Comparison */}
      <div className="sp-card-title" style={{ marginBottom: 16, color: 'var(--sp-text-muted)', fontSize: 13, letterSpacing: 1 }}>TỔNG QUAN & SO SÁNH</div>
      <div className="sp-comparison-grid">
        {/* Left: Chart */}
        <div className="sp-comp-card">
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Trực quan hóa dữ liệu</div>
          <div style={{ fontSize: 13, color: 'var(--sp-text-dim)' }}>So sánh: {periodLabels[recentPeriod]} vs {pastPeriodLabels[pastPeriod]}</div>
          
          <div className="sp-comp-chart">
            {chartData.map(item => {
              const change = getChange(item.curr, item.prev);
              let pctClass = '';
              let arrow = '';
              if (change > 0) {
                pctClass = item.isGood ? 'up' : 'down';
                arrow = '↑';
              } else if (change < 0) {
                pctClass = item.isGood ? 'down' : 'up';
                arrow = '↓';
              }
              const prevHeightPct = Math.max(5, (item.prev / maxVal) * 100);
              const heightPct = Math.max(5, (item.curr / maxVal) * 100);

              let barColor = 'var(--sp-primary)';
              if (item.key === 'completed') barColor = 'var(--sp-success)';
              if (item.key === 'delivering') barColor = 'var(--sp-primary-light)';
              if (item.key === 'cancelled' || item.key === 'failed') barColor = 'var(--sp-danger)';

              return (
                <div key={item.key} className="sp-comp-bar-wrap">
                  <div className="sp-comp-bar-head">
                    {change !== 0 && (
                      <div className={`sp-comp-bar-pct ${pctClass}`}>
                        {Math.abs(change)}% {arrow}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: 4, width: '100%', justifyContent: 'center' }} className="sp-comp-bar-container">
                    <div className="sp-comp-bar past" style={{ '--bar-pct': `${prevHeightPct}%`, background: 'var(--sp-surface2)', opacity: 0.6 }} title={`Quá khứ: ${item.prev}`}>
                      <span className="sp-bar-val">{item.prev > 0 ? item.prev : ''}</span>
                    </div>
                    <div className="sp-comp-bar recent" style={{ '--bar-pct': `${heightPct}%`, background: barColor }} title={`Gần đây: ${item.curr}`}>
                      <span className="sp-bar-val">{item.curr > 0 ? item.curr : ''}</span>
                    </div>
                  </div>
                  <div className="sp-comp-bar-label">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="sp-comp-card" style={{ padding: '24px 20px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Tùy chỉnh so sánh</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sp-text-muted)', marginBottom: 12 }}>GẦN ĐÂY</div>
              <div className="sp-comp-radios">
                {['day', 'week', 'month', 'year'].map(p => (
                  <label key={`rec-${p}`} className={`sp-radio-label ${recentPeriod === p ? 'selected-recent' : ''}`}>
                    {periodLabels[p]}
                    <input type="radio" name="recent" value={p} checked={recentPeriod === p} onChange={(e) => setRecentPeriod(e.target.value)} />
                    {recentPeriod === p && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sp-primary)' }} />}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sp-text-muted)', marginBottom: 12 }}>QUÁ KHỨ (Cột mờ)</div>
              <div className="sp-comp-radios">
                {['day', 'week', 'month', 'year'].map(p => (
                  <label key={`past-${p}`} className={`sp-radio-label ${pastPeriod === p ? 'selected-past' : ''}`}>
                    {pastPeriodLabels[p]}
                    <input type="radio" name="past" value={p} checked={pastPeriod === p} onChange={(e) => setPastPeriod(e.target.value)} />
                    {pastPeriod === p && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sp-text-muted)' }} />}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="sp-comp-summary">
            {summaryText}
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="sp-chart-grid">
        <div className="sp-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--sp-text-muted)' }}>
              <IconChart /> Đơn giao 7 ngày qua
            </div>
            <Link to="/shipper/stats" style={{ color: 'var(--sp-primary-light)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>Chi tiết →</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{orders.filter(o => o.statusId === 'S6' && last7Days.includes(moment(o.createdAt).format('YYYY-MM-DD'))).length} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sp-text-muted)' }}>tổng đơn</span></div>
            <div style={{ fontSize: 11, color: 'var(--sp-success)', fontWeight: 600, marginBottom: 4 }}>+3 so tuần trước</div>
          </div>

          <div className="sp-css-bar-chart">
            {last7Days.map(date => {
              const dayOrders = orders.filter(o => moment(o.createdAt).format('YYYY-MM-DD') === date);
              const done = dayOrders.filter(o => o.statusId === 'S6').length;
              const active = dayOrders.filter(o => o.statusId === 'S5').length;
              const max = Math.max(10, ...last7Days.map(d => orders.filter(o => moment(o.createdAt).format('YYYY-MM-DD') === d).length));
              const doneH = Math.min(100, (done / max) * 100);
              const activeH = Math.min(100, (active / max) * 100);
              const isToday = date === today;
              
              return (
                <div key={date} className="sp-css-bar-col" title={`${moment(date).format('DD/MM')}: ${done} đã giao, ${active} đang giao`}>
                  {active > 0 && <div className="sp-css-bar-item active" style={{ height: `${activeH}%` }} />}
                  {done > 0 && <div className="sp-css-bar-item done" style={{ height: `${doneH}%` }} />}
                  <div className="sp-css-bar-label" style={{ color: isToday ? 'var(--sp-text)' : '', fontWeight: isToday ? 700 : 500 }}>
                    {moment(date).format('dd').charAt(0).toUpperCase() + moment(date).format('dd').slice(1, 2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 32, fontSize: 11, color: 'var(--sp-text-dim)', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, background: 'var(--sp-success)', borderRadius: 2 }}/> Đã giao</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, background: 'var(--sp-warning)', borderRadius: 2 }}/> Đang giao</div>
          </div>
        </div>

        <div className="sp-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--sp-text-muted)' }}>
              <IconDollar /> Thu nhập tháng này
            </div>
            <Link to="/shipper/stats" style={{ color: 'var(--sp-primary-light)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>Xem chi tiết →</Link>
          </div>
          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--sp-accent)' }}>{formatMoney(incomeMonth)}</div>
            <div style={{ fontSize: 12, color: 'var(--sp-text-dim)' }}>Tháng {moment().format('M/YYYY')}</div>
          </div>

          <div className="sp-progress-wrap">
            <div className="sp-progress-bar"><div className="sp-progress-fill" style={{ width: `${progressPercent}%` }} /></div>
            <div className="sp-progress-text">
              <span>{progressPercent}% mục tiêu tháng</span>
              <span>Còn {formatMoney(Math.max(0, targetIncome - incomeMonth))}</span>
            </div>
          </div>

          <ul className="sp-income-list" style={{ marginTop: 24, borderTop: '1px solid var(--sp-border)', paddingTop: 16 }}>
            <li><span>Phí giao hàng</span> <span className="val pos">+{formatMoney(incomeMonth)}</span></li>
            <li><span>Thưởng hoàn thành</span> <span className="val pos">+{formatMoney(monthlyDone.length >= 100 ? 500000 : 0)}</span></li>
            <li><span>Đơn thất bại (trừ)</span> <span className="val neg">-{formatMoney(monthlyFailed.length * 5000)}</span></li>
          </ul>
        </div>
      </div>


      {/* Bottom Area: Active Orders & Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IconTruck /> Đơn đang giao</span>
            <Link to="/shipper/my-orders" style={{ fontSize: 12, color: 'var(--sp-primary-light)', textDecoration: 'none', fontWeight: 600 }}>Tất cả →</Link>
          </div>
          <div className="sp-card-body" style={{ padding: '16px 20px' }}>
            {activeList.length === 0 ? (
              <div className="sp-empty" style={{ padding: '40px 0' }}>
                <div style={{ fontSize: 32, opacity: 0.5, marginBottom: 10 }}>🚚</div>
                <div style={{ fontSize: 13, color: 'var(--sp-text-dim)' }}>Không có đơn đang giao</div>
              </div>
            ) : (
              activeList.map(o => (
                <div key={o.id} style={{ border: '1px solid var(--sp-border)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: 'var(--sp-text)' }}>Đơn #{o.id}</div>
                    <div style={{ fontSize: 12, color: 'var(--sp-text-muted)' }}>{moment(o.updatedAt).format('HH:mm')}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--sp-text-muted)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {o.addressUser?.shipAdress || 'Chưa có địa chỉ'}
                  </div>
                  <div className="sp-stepper">
                    <div className="sp-step"><div className="sp-step-dot done" title="Chờ lấy">✓</div><div className="sp-step-line done" /></div>
                    <div className="sp-step"><div className="sp-step-dot active" title="Đang giao">2</div><div className="sp-step-line" /></div>
                    <div className="sp-step"><div className="sp-step-dot pending" title="Hoàn thành">3</div></div>
                  </div>
                </div>
              ))
            )}
            {activeOrders.length > 2 && (
              <Link to="/shipper/my-orders" className="sp-btn sp-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                Xem thêm {activeOrders.length - 2} đơn đang giao →
              </Link>
            )}
          </div>
        </div>

        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IconBell /> Hoạt động gần đây</span>
            <Link to="/shipper/my-orders" style={{ fontSize: 12, color: 'var(--sp-primary-light)', textDecoration: 'none', fontWeight: 600 }}>Xem tất cả →</Link>
          </div>
          <div className="sp-card-body" style={{ padding: '16px 20px 24px' }}>
            {recent.length === 0 ? (
              <div className="sp-empty" style={{ padding: '40px 0' }}>
                <div style={{ fontSize: 32, opacity: 0.5, marginBottom: 10 }}>📭</div>
                <div style={{ fontSize: 13, color: 'var(--sp-text-dim)' }}>Chưa có hoạt động</div>
              </div>
            ) : (
              <div className="sp-timeline" style={{ paddingRight: 0, paddingBottom: 0 }}>
                {recent.map((o, i) => {
                  let dotColor = 'gray';
                  if (o.statusId === 'S4') dotColor = 'amber';
                  else if (o.statusId === 'S5') dotColor = 'cyan';
                  else if (o.statusId === 'S6') dotColor = 'green';
                  else if (['S7', 'S8'].includes(o.statusId)) dotColor = 'red';

                  return (
                    <div key={o.id} className="sp-timeline-item sp-row-enter" style={{ animationDelay: `${i * 60}ms`, marginBottom: 20 }}>
                      <div className={`sp-timeline-dot ${dotColor}`} />
                      <div className="sp-timeline-content" style={{ padding: '10px 14px' }}>
                        <div className="sp-timeline-title" style={{ fontSize: 13 }}>
                          <span>Đơn #{o.id} — {o.addressUser?.shipAdress?.split(',').pop() || 'N/A'}</span>
                          <span className={`sp-badge ${STATUS_BADGE[o.statusId] || 'sp-badge-gray'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                            {STATUS_LABEL[o.statusId] || o.statusId}
                          </span>
                        </div>
                        <div className="sp-timeline-time" style={{ marginTop: 4 }}>
                          {moment(o.updatedAt).fromNow()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboard;
