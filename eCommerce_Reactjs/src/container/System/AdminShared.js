import React from 'react';
import ReactPaginate from 'react-paginate';

/**
 * Shared skeleton rows for admin table pages
 */
export const SkeletonRows = ({ cols = 5 }) => (
  <>
    {[1, 2, 3, 4, 5].map(i => (
      <tr key={i}>
        {Array(cols).fill(0).map((_, j) => (
          <td key={j} style={{ padding: '13px 14px' }}>
            <div className="ap-skeleton ap-skeleton-text" style={{ width: j === 0 ? '30%' : j === 1 ? '70%' : '55%' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/**
 * Empty state for admin table pages
 */
export const EmptyState = ({ icon = '📭', title = 'Không có dữ liệu', desc = 'Thử thay đổi từ khóa tìm kiếm' }) => (
  <tr>
    <td colSpan={99} style={{ padding: 0, border: 'none' }}>
      <div className="ap-empty">
        <div className="ap-empty-icon">{icon}</div>
        <div className="ap-empty-title">{title}</div>
        <div className="ap-empty-desc">{desc}</div>
      </div>
    </td>
  </tr>
);

/**
 * Shared pagination component for admin pages
 */
export const AdminPagination = ({ count, onPageChange }) => {
  if (!count || count <= 1) return null;
  return (
    <div style={{ padding: '14px 20px', borderTop: '1px solid var(--ap-border)', display: 'flex', justifyContent: 'center' }}>
      <ReactPaginate
        previousLabel="← Trước"
        nextLabel="Sau →"
        breakLabel="..."
        pageCount={count}
        marginPagesDisplayed={2}
        containerClassName="ap-pagination"
        pageClassName="ap-page-item"
        pageLinkClassName="ap-page-link"
        previousClassName="ap-page-item"
        previousLinkClassName="ap-page-link"
        nextClassName="ap-page-item"
        nextLinkClassName="ap-page-link"
        breakClassName="ap-page-item"
        breakLinkClassName="ap-page-link"
        activeClassName="ap-page-active"
        onPageChange={onPageChange}
      />
    </div>
  );
};

/**
 * Search toolbar for admin pages
 */
export const SearchBar = ({ value, onChange, onSearch, placeholder = 'Tìm kiếm...' }) => (
  <div className="ap-toolbar">
    <div className="ap-search-bar">
      <span style={{ color: 'var(--ap-text-dim)' }}>🔍</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch(value)}
        placeholder={placeholder}
      />
      {value && (
        <button onClick={() => { onChange(''); onSearch(''); }}
          style={{ background: 'none', border: 'none', color: 'var(--ap-text-dim)', cursor: 'pointer', fontSize: 16 }}>×</button>
      )}
    </div>
    <button className="ap-btn ap-btn-primary ap-btn-sm" onClick={() => onSearch(value)}>Tìm kiếm</button>
  </div>
);

/**
 * Standard page header for admin list pages
 */
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="ap-page-header">
    <div className="ap-page-header-row">
      <div>
        <div className="ap-page-title">{title}</div>
        {subtitle && <div className="ap-page-subtitle">{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  </div>
);
