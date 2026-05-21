import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, FileText, TrendingUp, Heart, Bookmark } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/stats`, {
          credentials: 'include'
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchStats();
    }
  }, [user]);

  // Draw chart
  useEffect(() => {
    if (!stats?.chartData || !chartRef.current) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 20, bottom: 50, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const data = stats.chartData;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barWidth = (chartW / data.length) * 0.6;
    const barGap = (chartW / data.length) * 0.4;

    // Grid lines
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      const val = Math.round(maxVal - (maxVal / gridLines) * i);
      ctx.fillText(val.toString(), padding.left - 10, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const x = padding.left + i * (barWidth + barGap) + barGap / 2;
      const barH = (d.value / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      // Gradient
      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      grad.addColorStop(0, '#0ea5e9');
      grad.addColorStop(1, '#38bdf8');

      ctx.fillStyle = grad;
      ctx.beginPath();
      const radius = 6;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();

      // Value on top
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.value.toString(), x + barWidth / 2, y - 8);

      // X-axis label
      ctx.fillStyle = '#9ca3af';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      const label = d.label.split(', ')[0] || d.label;
      ctx.fillText(label, x + barWidth / 2, h - padding.bottom + 20);
    });
  }, [stats]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        Loading dashboard...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Overview of your platform's performance</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Users size={22} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalUsers}</div>
          <div className="stat-card-label">Total Users</div>
          <div className="stat-card-sub">
            <TrendingUp size={14} />
            +{stats.newUsersToday} today
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <FileText size={22} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalPrompts}</div>
          <div className="stat-card-label">Total Prompts</div>
          <div className="stat-card-sub">
            <TrendingUp size={14} />
            +{stats.newPromptsToday} today
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Heart size={22} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalLikes}</div>
          <div className="stat-card-label">Total Likes</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Bookmark size={22} />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalBookmarks}</div>
          <div className="stat-card-label">Total Bookmarks</div>
        </div>
      </div>

      <div className="admin-extra-stats">
        <div className="admin-extra-stat">
          <div className="stat-value">{stats.totalTags}</div>
          <div className="stat-label">Tags Created</div>
        </div>
        <div className="admin-extra-stat">
          <div className="stat-value">{stats.newUsersToday}</div>
          <div className="stat-label">New Users Today</div>
        </div>
        <div className="admin-extra-stat">
          <div className="stat-value">{stats.newPromptsToday}</div>
          <div className="stat-label">New Prompts Today</div>
        </div>
      </div>

      <div className="admin-chart-section">
        <h3>Prompts Created — Last 7 Days</h3>
        <div className="admin-chart-container">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
