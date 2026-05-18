import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Shield, Trash2, RotateCcw } from 'lucide-react';
import AdminPagination from '../../components/AdminPagination';

const API_BASE = 'http://localhost:3000';

const AdminUsers = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const searchTimeout = useRef(null);

  const fetchUsers = useCallback(async (p = 1, s = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15 });
      if (s) params.append('search', s);
      const res = await fetch(`${API_BASE}/admin/users?${params}`, {
        credentials: 'include'
      });
      const data = await res.json();
      setUsers(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUsers(page, search);
      setSelectedIds([]); // Clear selection when page or search changes
    }
  }, [page, token, search, fetchUsers]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, val);
    }, 400);
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include', headers: {
          'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      fetchUsers(page, search);
    } catch (err) {
      console.error('Failed to update user role:', err);
    }
  };

  const handleToggleDelete = async (userId, isDelete) => {
    try {
      await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include', headers: {
          'Content-Type': 'application/json' },
        body: JSON.stringify({ isDelete: !isDelete })
      });
      fetchUsers(page, search);
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected users?`)) return;
    
    try {
      await fetch(`${API_BASE}/admin/users/bulk`, {
        method: 'PATCH',
        credentials: 'include', headers: {
          'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, isDelete: true })
      });
      setSelectedIds([]);
      fetchUsers(page, search);
    } catch (err) {
      console.error('Failed to perform bulk delete:', err);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <h1>Users Management</h1>
        <p>Manage all users on the platform</p>
      </div>

      <div className="admin-table-section">
        <div className="admin-table-toolbar">
          <div className="admin-search-input">
            <Search size={16} color="#9ca3af" />
            <input
              type="text"
              placeholder="Search users by name, email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <span className="admin-table-info">{meta.total} users total</span>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner"></div>
            Loading users...
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              {selectedIds.length > 0 && (
                <div style={{ padding: '12px 20px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e7ff' }}>
                  <span style={{ fontSize: 13, color: '#4f46e5', fontWeight: 500 }}>
                    {selectedIds.length} users selected
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="admin-action-btn danger" onClick={handleBulkDelete}>
                      <Trash2 size={14} style={{ marginRight: 4 }} />
                      Delete Selected
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
                        checked={selectedIds.length > 0 && selectedIds.length === users.length}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Prompts</th>
                    <th>Likes</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ backgroundColor: selectedIds.includes(u.id) ? '#f8fafc' : 'transparent' }}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(u.id)}
                          onChange={() => handleSelectRow(u.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <div className="admin-table-user">
                          <img
                            src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name || u.username}&background=random`}
                            alt={u.username}
                            className="admin-table-avatar"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${u.name || u.username}&background=random`;
                            }}
                          />
                          <div>
                            <div className="admin-table-name">{u.name || u.username}</div>
                            <div className="admin-table-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge role-${u.role}`}>{u.role}</span>
                      </td>
                      <td>{u._count?.prompts || 0}</td>
                      <td>{u._count?.likes || 0}</td>
                      <td>
                        <span className={`admin-badge ${u.isDelete ? 'status-deleted' : 'status-active'}`}>
                          {u.isDelete ? 'Deleted' : 'Active'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            className="admin-action-btn"
                            onClick={() => handleToggleRole(u.id, u.role)}
                            title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                          >
                            <Shield size={12} />
                            {u.role === 'admin' ? 'Demote' : 'Promote'}
                          </button>
                          <button
                            className={`admin-action-btn ${u.isDelete ? 'success' : 'danger'}`}
                            onClick={() => handleToggleDelete(u.id, u.isDelete)}
                          >
                            {u.isDelete ? <RotateCcw size={12} /> : <Trash2 size={12} />}
                            {u.isDelete ? 'Restore' : 'Delete'}
                          </button>
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
    </>
  );
};

export default AdminUsers;
