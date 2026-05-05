import React from 'react';

const IconPhone = () => <svg className="lucide" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMessageSquare = () => <svg className="lucide" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconFileText = () => <svg className="lucide" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconCheckCircle = () => <svg className="lucide" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

const ActiveOrderWidget = ({ order, onShowItems, onComplete, isMinimized, toggleMinimize, formatMoney }) => {
  if (!order) {
    return (
      <div className="sp-glass-panel" style={{ textAlign: 'center', padding: '24px 12px', borderRadius: 20, opacity: 0.8, background: 'rgba(15, 23, 42, 0.8)' }}>
        <div style={{ fontSize: 24, marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
          <svg className="sp-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"/><path d="M2 9.5 12 15l10-5.5"/></svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Đang chờ đơn mới...</div>
        <div style={{ fontSize: 10, color: 'var(--sp-text-dim)', marginTop: 4 }}>Khu vực có nhu cầu cao</div>
      </div>
    );
  }

  return (
    <div className="sp-glass-panel sp-active-order-card" style={{ 
      border: '1px solid rgba(59, 130, 246, 0.4)',
      padding: 'clamp(12px, 1.1vw, 18px)',
      borderRadius: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      background: 'rgba(15, 23, 42, 0.95)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div 
        onClick={toggleMinimize}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 24,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10
        }}
      >
        <div style={{ width: 32, height: 3, borderRadius: 1.5, background: 'rgba(255,255,255,0.2)' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 10 }}>
        <div className="sp-badge sp-badge-blue" style={{ fontSize: 9, padding: '3px 8px', borderRadius: 16, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg className="sp-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          ĐANG GIAO #{order.id}
        </div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{formatMoney(order.typeShipData?.price || 30000)}</div>
      </div>

      <div style={{ 
        maxHeight: isMinimized ? 0 : 400, 
        overflow: 'hidden', 
        transition: 'max-height 0.4s ease, opacity 0.3s ease',
        opacity: isMinimized ? 0 : 1
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: '#3b82f6', letterSpacing: 1, marginBottom: 2 }}>LẤY HÀNG</div>
              <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>Kho Solana Center</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <svg className="sp-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: '#f59e0b', letterSpacing: 1, marginBottom: 2 }}>GIAO ĐẾN</div>
              <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>{order.addressUser?.shipAdress || 'Địa chỉ khách'}</div>
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 8,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <a href={`tel:${order.addressUser?.phoneNumber || ''}`} className="sp-action-icon-btn" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 3px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: '#fff', textDecoration: 'none', gap: 6
          }}>
            <IconPhone size={16} />
            <span style={{ fontSize: 8, fontWeight: 800 }}>Gọi</span>
          </a>
          <button className="sp-action-icon-btn" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 3px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', gap: 6, cursor: 'pointer'
          }}>
            <IconMessageSquare size={16} />
            <span style={{ fontSize: 8, fontWeight: 800 }}>Chat</span>
          </button>
          <button className="sp-action-icon-btn" onClick={onShowItems} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 3px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', gap: 6, cursor: 'pointer'
          }}>
            <IconFileText size={16} />
            <span style={{ fontSize: 8, fontWeight: 800 }}>Xem</span>
          </button>
          <button className="sp-action-icon-btn success" onClick={() => onComplete(order.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 3px', borderRadius: 14, background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: 'none', gap: 6, cursor: 'pointer'
          }}>
            <IconCheckCircle size={16} />
            <span style={{ fontSize: 8, fontWeight: 900 }}>Giao</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveOrderWidget;
