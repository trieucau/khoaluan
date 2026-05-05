import React from 'react';

const IconPhone = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMessageSquare = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconFileText = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const IconCheckCircle = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

const ActiveOrderWidget = ({ order, onShowItems, onComplete, isMinimized, toggleMinimize, formatMoney, isMobile }) => {
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
      padding: isMobile ? '24px 20px' : '16px 20px',
      borderRadius: 28,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(16px)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
    }}>
      {/* Header with Type & Earnings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 24 : 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
           <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
           <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>{isMobile ? 'ĐANG GIAO • ' : ''}#{order.id}</span>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: 100, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
           <span style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{formatMoney(order.typeShipData?.price || 30000)}</span>
        </div>
      </div>

      <div style={{ 
        maxHeight: isMinimized ? 0 : 600, 
        overflow: 'hidden', 
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isMinimized ? 0 : 1
      }}>
        {/* Logistics Timeline */}
        <div style={{ position: 'relative', paddingLeft: 40, marginBottom: isMobile ? 28 : 20 }}>
           <div style={{ 
             position: 'absolute', left: 15, top: 10, bottom: 10, width: 2, 
             background: 'repeating-linear-gradient(to bottom, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)',
             borderRadius: 1 
           }} />
           
           <div style={{ position: 'relative', marginBottom: isMobile ? 24 : 16 }}>
              <div style={{ 
                position: 'absolute', left: -34, top: 0, width: 22, height: 22, 
                borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>LẤY HÀNG</div>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>Kho Solana Center</div>
           </div>

           <div style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', left: -34, top: 0, width: 22, height: 22, 
                borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>GIAO ĐẾN</div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, lineHeight: 1.4 }}>{order.addressUser?.shipAdress || 'Địa chỉ khách'}</div>
           </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 12
        }}>
          <a href={`tel:${order.addressUser?.phoneNumber || ''}`} className="sp-action-icon-btn" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: isMobile ? 64 : 56, borderRadius: 18, background: 'rgba(255,255,255,0.03)', color: '#fff', textDecoration: 'none', gap: 6, border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <IconPhone size={isMobile ? 20 : 18} />
            <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.7 }}>GỌI</span>
          </a>
          <button className="sp-action-icon-btn" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: isMobile ? 64 : 56, borderRadius: 18, background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', gap: 6, cursor: 'pointer'
          }}>
            <IconMessageSquare size={isMobile ? 20 : 18} />
            <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.7 }}>CHAT</span>
          </button>
          <button className="sp-action-icon-btn" onClick={onShowItems} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: isMobile ? 64 : 56, borderRadius: 18, background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', gap: 6, cursor: 'pointer'
          }}>
            <IconFileText size={isMobile ? 20 : 18} />
            <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.7 }}>XEM</span>
          </button>
          <button className="sp-action-icon-btn success" onClick={() => onComplete(order.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: isMobile ? 64 : 56, background: '#22c55e', color: '#fff', border: 'none', gap: 6, cursor: 'pointer', boxShadow: '0 8px 20px rgba(34, 197, 94, 0.3)', borderRadius: 18
          }}>
            <IconCheckCircle size={isMobile ? 20 : 18} />
            <span style={{ fontSize: 9, fontWeight: 900 }}>GIAO</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveOrderWidget;
