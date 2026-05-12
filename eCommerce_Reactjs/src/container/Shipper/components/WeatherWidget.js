import React from 'react';

const WeatherWidget = ({ dragHandleClass, weatherData, isMobile }) => {
  const weather = React.useMemo(() => {
    if (!weatherData) return { temp: '--', city: 'Đang tải...', desc: 'Cập nhật thời tiết...' };

    const temp = Math.round(weatherData.temperature);
    const code = weatherData.weathercode;
    const city = weatherData.city;

    let desc = 'Trời quang';
    if (code >= 1 && code <= 3) desc = 'Nhiều mây';
    if (code >= 45 && code <= 48) desc = 'Có sương mù';
    if (code >= 51 && code <= 67) desc = 'Có mưa nhẹ';
    if (code >= 71 && code <= 82) desc = 'Có mưa rào';
    if (code >= 95) desc = 'Có dông';

    return { temp, city, desc };
  }, [weatherData]);

  return (
    <div
      className="sp-glass-panel"
      style={{
        padding: isMobile ? '16px' : '12px 16px',
        borderRadius: 20,
        position: 'relative',
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {!isMobile && (
        <div
          className={dragHandleClass}
          style={{
            position: 'absolute',
            top: 5,
            left: '35%',
            right: '35%',
            height: 3,
            borderRadius: 1.5,
            background: 'rgba(255,255,255,0.15)',
            cursor: 'grab',
          }}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: isMobile ? 0 : 4 }}>
        <div
          style={{
            width: isMobile ? 40 : 32,
            height: isMobile ? 40 : 32,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.1)',
          }}
        >
          <svg
            className="sp-icon-sm"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 2v2" />
            <path d="m4.93 4.93.7.7" />
            <path d="M20 12h2" />
            <path d="m19.07 4.93-.7.7" />
            <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
            <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: isMobile ? 13 : 12, fontWeight: 800, color: '#fff' }}>
            {weather.temp}°C {isMobile ? '' : `• ${weather.city}`}
          </div>
          <div
            style={{ fontSize: isMobile ? 10 : 9, color: 'var(--sp-text-dim)', fontWeight: 600 }}
          >
            {isMobile ? weather.city + ' • ' : ''}
            {weather.desc}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
