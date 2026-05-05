import React from 'react';
import { useNavigate } from 'react-router-dom';

const MENU_CHIPS = [
  { 
    to: '/shipper/orders-available', 
    label: 'Nhận đơn', 
    icon: (<svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>) 
  },
  { 
    to: '/shipper/my-orders', 
    label: 'Đơn của tôi', 
    icon: (<svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>) 
  },
  { 
    to: '/shipper/returns', 
    label: 'Hoàn trả', 
    icon: (<svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>) 
  },
  { 
    to: '/shipper/rewards', 
    label: 'Thưởng', 
    icon: (<svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>) 
  },
  { 
    to: '/shipper/reviews', 
    label: 'Đánh giá', 
    icon: (<svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>) 
  },
  { 
    to: '/shipper/history', 
    label: 'Lịch sử', 
    icon: (<svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>) 
  },
  { 
    to: '/shipper/support', 
    label: 'Hỗ trợ', 
    icon: (<svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>) 
  },
];

const HorizontalMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="sp-horizontal-menu" style={{ 
      display: 'flex', 
      overflowX: 'auto', 
      gap: '8px', 
      padding: '12px 16px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      WebkitOverflowScrolling: 'touch'
    }}>
      <style>{`
        .sp-horizontal-menu::-webkit-scrollbar { display: none; }
        .sp-menu-chip {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sp-menu-chip:active { transform: scale(0.95); background: var(--sp-primary); }
        .sp-menu-chip svg { opacity: 0.8; transition: opacity 0.2s; }
        .sp-menu-chip:hover svg { opacity: 1; }
      `}</style>
      {MENU_CHIPS.map((item, idx) => (
        <div key={idx} className="sp-menu-chip" onClick={() => navigate(item.to)}>
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default HorizontalMenu;
