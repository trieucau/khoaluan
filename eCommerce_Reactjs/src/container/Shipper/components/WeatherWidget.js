import React, { useEffect, useState } from 'react';

const WeatherWidget = ({ dragHandleClass, pos }) => {
  const [weather, setWeather] = useState({ temp: '--', city: 'Đang tải...', desc: 'Cập nhật thời tiết...' });

  useEffect(() => {
    if (!pos || !pos[0]) return;

    const fetchWeather = async () => {
      try {
        // Free API: Open-Meteo
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos[0]}&longitude=${pos[1]}&current_weather=true`);
        const data = await res.json();
        
        if (data?.current_weather) {
          const temp = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode;
          
          // Simple mapping for common weather codes
          let desc = 'Trời quang';
          if (code >= 1 && code <= 3) desc = 'Nhiều mây';
          if (code >= 45 && code <= 48) desc = 'Có sương mù';
          if (code >= 51 && code <= 67) desc = 'Có mưa nhẹ';
          if (code >= 71 && code <= 82) desc = 'Có mưa rào';
          if (code >= 95) desc = 'Có dông';

          // Reverse geocoding for city name (simple approach using lat/lng if no API key)
          // For now, let's just use "Vị trí của bạn" or try a simple reverse geocode
          let city = 'Vị trí hiện tại';
          try {
             const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}`);
             const geoData = await geoRes.json();
             city = geoData.address.city || geoData.address.town || geoData.address.suburb || 'TP. Hồ Chí Minh';
          } catch(e) { console.error(e); }

          setWeather({ temp, city, desc });
        }
      } catch (e) {
        console.error('Weather error:', e);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10 mins
    return () => clearInterval(interval);
  }, [pos]);

  return (
    <div className="sp-glass-panel" style={{ padding: 12, borderRadius: 16, position: 'relative' }}>
      <div className={dragHandleClass} style={{
        position: 'absolute', top: 5, left: '35%', right: '35%', height: 3, borderRadius: 1.5, background: 'rgba(255,255,255,0.15)',
        cursor: 'grab'
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: 4 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
          <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v2"/><path d="m4.93 4.93.7.7"/><path d="M20 12h2"/><path d="m19.07 4.93-.7.7"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 'clamp(10px, 0.9vw, 12px)', fontWeight: 700 }}>{weather.temp}°C • {weather.city}</div>
          <div style={{ fontSize: 'clamp(8px, 0.7vw, 10px)', color: 'var(--sp-text-dim)' }}>{weather.desc}</div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
