import React from 'react';

const TickerIcon = ({ children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 6 }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  </span>
);

const ICONS = {
  Pin: <TickerIcon><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></TickerIcon>,
  Rain: <TickerIcon><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path></TickerIcon>,
  Sun: <TickerIcon><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></TickerIcon>,
  Flame: <TickerIcon><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></TickerIcon>,
  Map: <TickerIcon><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></TickerIcon>,
  Trophy: <TickerIcon><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></TickerIcon>,
  Crown: <TickerIcon><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path></TickerIcon>,
  Sparkles: <TickerIcon><path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287L12 3Z"></path></TickerIcon>,
  Zap: <TickerIcon><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></TickerIcon>,
  Bulb: <TickerIcon><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></TickerIcon>,
};

const ShipperStatusBar = ({
  isOnline,
  sessionTimeMs,
  formatMs,
  firstName,
  dailyStats,
  formatMoney,
  weatherData,
  rankProgress,
}) => {
  const tickerText = React.useMemo(() => {
    let items = [];

    // 1. Weather & High Demand (Operational Efficiency)
    if (weatherData) {
      const code = weatherData.weathercode;
      const temp = Math.round(weatherData.temperature);
      const city = weatherData.city;

      items.push(
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {ICONS.Pin} {city} ({temp}°C)
        </span>
      );

      if (code >= 51)
        items.push(<span style={{ display: 'inline-flex', alignItems: 'center' }}>{ICONS.Rain} Cảnh báo mưa: Đường trơn trượt, hãy giảm tốc độ và chú ý an toàn.</span>);
      else if (temp >= 35) items.push(<span style={{ display: 'inline-flex', alignItems: 'center' }}>{ICONS.Flame} Cảnh báo nắng nóng: Hãy nghỉ ngơi tại các trạm dừng chân.</span>);
      else items.push(<span style={{ display: 'inline-flex', alignItems: 'center' }}>{ICONS.Sun} Thời tiết lý tưởng để bùng nổ doanh thu hôm nay!</span>);

      // Simulate Heatmap based on city
      items.push(<span style={{ display: 'inline-flex', alignItems: 'center' }}>{ICONS.Map} Khu vực {city} đang có nhu cầu cao, hãy sẵn sàng nhận đơn!</span>);
    }

    // 2. Ranking Progress (Financial Motivation)
    if (rankProgress) {
      const { score, nextGoal, nextRank } = rankProgress;
      if (score < 95) {
        items.push(<span style={{ display: 'inline-flex', alignItems: 'center' }}>{ICONS.Trophy} Mục tiêu: Chỉ cần thêm {nextGoal - score}% tin cậy để đạt {nextRank}!</span>);
      } else {
        items.push(<span style={{ display: 'inline-flex', alignItems: 'center' }}>{ICONS.Crown} Bạn đang là tài xế Bạch Kim! Duy trì phong độ để nhận ưu đãi tối đa.</span>);
      }
    }

    // 3. Performance & Earnings
    if (dailyStats.count > 0) {
      items.push(
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{ICONS.Sparkles} Hôm nay: Đã hoàn thành {dailyStats.count} đơn • Thu nhập: +{formatMoney(dailyStats.income)}</span>
      );
    } else {
      items.push(<span style={{ display: 'inline-flex', alignItems: 'center' }}>{ICONS.Zap} Chúc bạn một ngày mới "nổ đơn" liên tục!</span>);
    }

    // 4. System Tips
    items.push(<span style={{ display: 'inline-flex', alignItems: 'center' }}>{ICONS.Bulb} Mẹo: Chấp nhận đơn nhanh trong 30s để tăng 5% điểm ưu tiên từ hệ thống.</span>);

    return items.map((item, idx) => (
      <React.Fragment key={idx}>
        {item}
        <span style={{ margin: '0 12px', opacity: 0.5 }}>•</span>
      </React.Fragment>
    ));
  }, [weatherData, dailyStats, firstName, rankProgress]);

  return (
    <section
      className="sp-float-status"
      style={{
        position: 'absolute',
        top: 'clamp(10px, 1.5vw, 24px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '95%',
        maxWidth: 1400,
        zIndex: 1000,
        background: 'none',
        border: 'none',
        display: 'flex',
        gap: 'clamp(8px, 1.2vw, 16px)',
        alignItems: 'center',
      }}
    >
      {/* TRÁI: STATUS PILL */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          padding: 'clamp(6px, 0.8vw, 10px) clamp(10px, 1.2vw, 18px)',
          borderRadius: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 0.6vw, 10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          flexShrink: 0,
        }}
      >
        <div
          className={`sp-gps-dot ${isOnline ? 'on' : 'off'}`}
          style={{
            width: 'clamp(6px, 0.6vw, 10px)',
            height: 'clamp(6px, 0.6vw, 10px)',
            borderRadius: '50%',
            background: isOnline ? '#22c55e' : '#ef4444',
            boxShadow: isOnline ? '0 0 10px #22c55e' : '0 0 10px #ef4444',
          }}
        />
        <span
          style={{
            color: isOnline ? '#fff' : '#ef4444',
            fontWeight: 900,
            fontSize: 'clamp(10px, 1vw, 13px)',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg
            className="sp-icon-xs"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {isOnline ? formatMs(sessionTimeMs) : 'OFFLINE'}
        </span>
      </div>

      {/* GIỮA: TICKER PILL */}
      <div
        style={{
          flex: 1,
          background: 'rgba(15, 23, 42, 0.85)',
          padding: 'clamp(6px, 0.8vw, 10px) clamp(12px, 1.5vw, 24px)',
          borderRadius: 100,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <svg
          className="sp-icon-xs"
          style={{ color: '#fbbf24', flexShrink: 0 }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <div className="sp-ticker-wrap" style={{ flex: 1 }}>
          <div
            className="sp-ticker-content"
            style={{
              fontSize: 'clamp(10px, 0.9vw, 12px)',
              color: '#fbbf24',
              fontWeight: 700,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              {tickerText}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              {tickerText}
            </div>
          </div>
        </div>
      </div>

      {/* PHẢI: INCOME PILL */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          padding: 'clamp(6px, 0.8vw, 10px) clamp(12px, 1.5vw, 22px)',
          borderRadius: 100,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        <svg
          className="sp-icon-xs"
          style={{ color: '#22c55e' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <div
          style={{
            fontSize: 'clamp(12px, 1.4vw, 18px)',
            fontWeight: 900,
            color: '#22c55e',
          }}
        >
          +{formatMoney(dailyStats.income)}
        </div>
      </div>
    </section>
  );
};

export default ShipperStatusBar;
