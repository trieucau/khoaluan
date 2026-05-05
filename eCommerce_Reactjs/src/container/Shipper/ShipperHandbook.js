import React, { useState } from 'react';

const ShipperHandbook = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const CATEGORIES = [
    { id: 'process', title: 'Quy trình giao nhận', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>), color: 'blue' },
    { id: 'policy', title: 'Chính sách & Thưởng', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>), color: 'amber' },
    { id: 'safety', title: 'An toàn & Hỗ trợ', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>), color: 'green' },
    { id: 'faq', title: 'Câu hỏi thường gặp', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>), color: 'cyan' },
  ];

  const ARTICLES = [
    { id: 1, cat: 'process', title: 'Cách nhận đơn hàng mới', content: 'Khi có đơn hàng mới, hệ thống sẽ gửi thông báo nổi. Bạn có 30 giây để chấp nhận trước khi đơn chuyển cho shipper khác.' },
    { id: 2, cat: 'process', title: 'Quy trình lấy hàng tại kho', content: 'Đến kho đúng giờ, kiểm tra mã vận đơn và tình trạng đóng gói của sản phẩm trước khi ký nhận.' },
    { id: 3, cat: 'policy', title: 'Hệ thống phân hạng tài xế', content: 'Bao gồm 5 hạng: Đồng, Bạc, Vàng, Kim Cương, Bạch Kim dựa trên độ tin cậy và số đơn hoàn thành.' },
    { id: 4, cat: 'safety', title: 'Xử lý khi khách không nghe máy', content: 'Gọi tối thiểu 3 cuộc trong 15 phút. Nếu không được, cập nhật trạng thái "Giao không thành công" và ghi chú lý do.' },
    { id: 5, cat: 'policy', title: 'Cách tính điểm tin cậy', content: '70% dựa trên tỷ lệ hoàn thành, 30% dựa trên tỷ lệ thành công/thất bại của các đơn đã nhận.' },
    { id: 6, cat: 'faq', title: 'Khi nào tôi nhận được tiền?', content: 'Thu nhập sẽ được tổng kết vào cuối ngày và có thể yêu cầu rút về tài khoản ngân hàng sau 24h.' },
  ];

  const filteredArticles = ARTICLES.filter(a => {
    const matchCat = activeCategory === 'all' || a.cat === activeCategory;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                       a.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="sp-page" style={{ paddingBottom: 100 }}>
      <div className="sp-page-header">
        <div className="sp-page-title">
          <svg className="sp-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          Sổ tay Shipper
        </div>
        <div className="sp-page-subtitle">Cẩm nang hướng dẫn và những bí quyết để trở thành "Xế Xịn"</div>
      </div>

      {/* Search Bar */}
      <div className="sp-search-bar" style={{ marginBottom: 32, maxWidth: 600 }}>
        <svg className="sp-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input 
          type="text" 
          placeholder="Tìm kiếm hướng dẫn, quy định..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Simplified Category Filter (Horizontal Pills) */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, marginBottom: 24, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <button 
          className={`sp-btn-tag ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
          style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Tất cả
        </button>
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id} 
            className={`sp-btn-tag ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            style={{ whiteSpace: 'nowrap', padding: '8px 20px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {cat.icon}
            {cat.title}
          </button>
        ))}
      </div>

      {/* Simplified Articles List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredArticles.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-title">Không tìm thấy kết quả</div>
          </div>
        ) : (
          filteredArticles.map(article => (
            <div key={article.id} className="sp-card" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="sp-card-body" style={{ padding: '16px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{article.title}</div>
                <div style={{ fontSize: 13, color: 'var(--sp-text-muted)', lineHeight: 1.5 }}>
                  {article.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .sp-btn-tag {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--sp-text-muted);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .sp-btn-tag.active {
          background: var(--sp-primary);
          border-color: var(--sp-primary);
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default ShipperHandbook;
