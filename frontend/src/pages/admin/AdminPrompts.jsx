import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, FileText, Eye, EyeOff, Trash2, RotateCcw } from 'lucide-react';
import AdminPagination from '../../components/AdminPagination';
import PromptDetailModal from '../../components/PromptDetailModal';

const API_BASE = 'http://localhost:3000';

const AdminPrompts = () => {
  const { token } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewPromptId, setViewPromptId] = useState(null);
  const searchTimeout = useRef(null);

  const fetchPrompts = useCallback(async (p = 1, s = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (s) params.append('search', s);
      const res = await fetch(`${API_BASE}/admin/prompts?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPrompts(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to fetch prompts:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPrompts(page, search);
      setSelectedIds([]); // Clear selection when page or search changes
    }
  }, [page, token, search, fetchPrompts]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchPrompts(1, val);
    }, 400);
  };

  const handleTogglePublic = async (promptId, isPublic) => {
    try {
      await fetch(`${API_BASE}/admin/prompts/${promptId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublic: !isPublic })
      });
      fetchPrompts(page, search);
    } catch (err) {
      console.error('Failed to update prompt:', err);
    }
  };

  const handleToggleDelete = async (promptId, isDelete) => {
    try {
      await fetch(`${API_BASE}/admin/prompts/${promptId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isDelete: !isDelete })
      });
      fetchPrompts(page, search);
    } catch (err) {
      console.error('Failed to update prompt:', err);
    }
  };

  const handleHardDelete = async (promptId) => {
    if (!confirm('Permanently delete this prompt? This cannot be undone.')) return;
    try {
      await fetch(`${API_BASE}/admin/prompts/${promptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchPrompts(page, search);
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(prompts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkSoftDelete = async () => {
    if (!confirm(`Are you sure you want to soft delete ${selectedIds.length} selected prompts?`)) return;
    
    try {
      await fetch(`${API_BASE}/admin/prompts/bulk`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds, isDelete: true })
      });
      setSelectedIds([]);
      fetchPrompts(page, search);
    } catch (err) {
      console.error('Failed to perform bulk delete:', err);
    }
  };

  const handleBulkHardDelete = async () => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete ${selectedIds.length} selected prompts? This cannot be undone.`)) return;
    
    try {
      await fetch(`${API_BASE}/admin/prompts/bulk`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      setSelectedIds([]);
      fetchPrompts(page, search);
    } catch (err) {
      console.error('Failed to perform bulk hard delete:', err);
    }
  };

  const resolveImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url}`;
  };

  return (
    <>
      <div className="admin-page-header">
        <h1>Prompts Management</h1>
        <p>Manage all prompts on the platform</p>
      </div>

      <div className="admin-table-section">
        <div className="admin-table-toolbar">
          <div className="admin-search-input">
            <Search size={16} color="#9ca3af" />
            <input
              type="text"
              placeholder="Search prompts by content, author..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <span className="admin-table-info">{meta.total} prompts total</span>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner"></div>
            Loading prompts...
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              {selectedIds.length > 0 && (
                <div style={{ padding: '12px 20px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e7ff' }}>
                  <span style={{ fontSize: 13, color: '#4f46e5', fontWeight: 500 }}>
                    {selectedIds.length} prompts selected
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="admin-action-btn danger" onClick={handleBulkSoftDelete}>
                      <RotateCcw size={14} style={{ marginRight: 4 }} />
                      Soft Delete
                    </button>
                    <button className="admin-action-btn danger" onClick={handleBulkHardDelete} style={{ background: '#fef2f2' }}>
                      <Trash2 size={14} style={{ marginRight: 4 }} />
                      Permanent Delete
                    </button>
                  </div>
                </div>
              )}
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length > 0 && selectedIds.length === prompts.length}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th>Image</th>
                    <th>Content</th>
                    <th>Author</th>
                    <th>Model</th>
                    <th>Likes</th>
                    <th>Visibility</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.map(p => (
                    <tr 
                      key={p.id} 
                      style={{ backgroundColor: selectedIds.includes(p.id) ? '#f8fafc' : 'transparent', cursor: 'pointer' }}
                      onClick={() => setViewPromptId(p.id)}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleSelectRow(p.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        {p.images && p.images.length > 0 ? (
                          <img
                            src={resolveImageUrl(p.images[0].imageUrl)}
                            alt=""
                            className="admin-prompt-thumb"
                          />
                        ) : (
                          <div className="admin-prompt-thumb" style={{
                            background: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FileText size={16} color="#ccc" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="admin-prompt-content" title={p.content}>
                          {p.content}
                        </div>
                      </td>
                      <td>
                        <div className="admin-table-user">
                          <img
                            src={p.user?.avatarUrl || `https://ui-avatars.com/api/?name=${p.user?.username || 'User'}&background=random`}
                            alt={p.user?.username || 'User'}
                            className="admin-table-avatar"
                            referrerPolicy="no-referrer"
                            style={{ width: 28, height: 28 }}
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${p.user?.username || 'User'}&background=random`;
                            }}
                          />
                          <span style={{ fontSize: 13 }}>{p.user?.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 13 }}>{p.aiModel || '—'}</span></td>
                      <td>{p._count?.likes || 0}</td>
                      <td>
                        <span className={`admin-badge ${p.isPublic ? 'status-public' : 'status-private'}`}>
                          {p.isPublic ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${p.isDelete ? 'status-deleted' : 'status-active'}`}>
                          {p.isDelete ? 'Deleted' : 'Active'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="admin-table-actions">
                          <button
                            className="admin-action-btn"
                            onClick={() => handleTogglePublic(p.id, p.isPublic)}
                            title={p.isPublic ? 'Make private' : 'Make public'}
                          >
                            {p.isPublic ? <EyeOff size={12} /> : <Eye size={12} />}
                            {p.isPublic ? 'Hide' : 'Show'}
                          </button>
                          <button
                            className={`admin-action-btn ${p.isDelete ? 'success' : 'danger'}`}
                            onClick={() => handleToggleDelete(p.id, p.isDelete)}
                          >
                            {p.isDelete ? <RotateCcw size={12} /> : <Trash2 size={12} />}
                            {p.isDelete ? 'Restore' : 'Delete'}
                          </button>
                          {p.isDelete && (
                            <button
                              className="admin-action-btn danger"
                              onClick={() => handleHardDelete(p.id)}
                              title="Permanently delete"
                            >
                              <Trash2 size={12} />
                              Permanent
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      {viewPromptId && (
        <PromptDetailModal
          id={viewPromptId}
          onClose={() => setViewPromptId(null)}
          onInteractionSync={() => {
            // Optional: refresh prompts if interaction happened
            fetchPrompts(page, search);
          }}
        />
      )}
    </>
  );
};

export default AdminPrompts;
