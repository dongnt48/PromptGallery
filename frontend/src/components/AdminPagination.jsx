import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdminPagination = ({ meta, onPageChange }) => {
  if (!meta || meta.totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, meta.page - Math.floor(maxVisible / 2));
  let end = Math.min(meta.totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="admin-pagination">
      <span className="admin-pagination-info">
        Page {meta.page} of {meta.totalPages} ({meta.total} items)
      </span>
      <div className="admin-pagination-btns">
        <button
          className="admin-page-btn"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map(p => (
          <button
            key={p}
            className={`admin-page-btn ${p === meta.page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="admin-page-btn"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
