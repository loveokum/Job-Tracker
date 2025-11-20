// ==========================
// IMPORTS – MUST BE AT TOP
// ==========================
import React, { useState, useEffect } from 'react';
import {
  Trash2, Plus, Briefcase, CheckCircle, Clock, TrendingUp, AlertCircle,
  User, Calendar, LogOut, Share2, Copy, Check
} from 'lucide-react';

// ==========================
// SUPABASE REQUEST FUNCTION
// ==========================
const SUPABASE_URL = 'https://bzqresbsrlaqxezwzaam.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6cXJlc2JzcmxhcXhlend6YWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzIwNTgsImV4cCI6MjA3OTI0ODA1OH0.U_5d2Y90DaR91JIfgyuSMVozgtqM-o8s7882TJqfHZ4';

const supabaseRequest = async (method, endpoint, body = null) => {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'apikey': SUPABASE_KEY,
    },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { data, error: !response.ok ? data : null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// ==========================
// MAIN COMPONENT
// ==========================
export default function JobTracker() {
  // ==========================
  // STATE VARIABLES
  // ==========================
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [applications, setApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    company: '', position: '', date: '', status: '', notes: ''
  });
  const [formData, setFormData] = useState({
    company: '', position: '', date: new Date().toISOString().split('T')[0], status: 'Applied', notes: ''
  });
  const [sharedApps, setSharedApps] = useState([]);

  const statusOptions = ['Applied', 'Reviewing', 'Interview Scheduled', 'Interviewing', 'Offer Received', 'Rejected', 'Withdrawn'];
  const statusColors = {
    'Applied': { bg: '#dbeafe', text: '#0369a1', icon: Clock },
    'Reviewing': { bg: '#fef3c7', text: '#b45309', icon: CheckCircle },
    'Interview Scheduled': { bg: '#e9d5ff', text: '#7e22ce', icon: Calendar },
    'Interviewing': { bg: '#e0e7ff', text: '#4f46e5', icon: User },
    'Offer Received': { bg: '#dcfce7', text: '#15803d', icon: TrendingUp },
    'Rejected': { bg: '#fee2e2', text: '#b91c1c', icon: AlertCircle },
    'Withdrawn': { bg: '#f3f4f6', text: '#374151', icon: Briefcase }
  };

  const backgroundStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 25%, #6366f1 75%, #ec4899 100%)',
    backgroundAttachment: 'fixed',
    padding: 'clamp(16px, 5vw, 24px)',
    position: 'relative',
    overflow: 'hidden'
  };

  const decorativePattern = (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="dots" x="20" y="20" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="white" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#dots)" />
    </svg>
  );

  // ==========================
  // INITIAL LOAD
  // ==========================
  useEffect(() => {
    try {
      const saved = localStorage.getItem('job-tracker-user');
      if (saved) {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        setAuthMode('tracker');
        loadUserApplications(user.id);
      }
    } catch (error) {
      console.log('Error loading user:', error);
    }
  }, []);

  // ==========================
  // LOAD USER APPLICATIONS
  // ==========================
  const loadUserApplications = async (userId) => {
    setLoading(true);
    const { data, error } = await supabaseRequest('GET', `/applications?user_id=eq.${userId}`);
    if (!error && data) setApplications(data);
    setLoading(false);
  };

  // ==========================
  // AUTH HANDLERS
  // ==========================
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError(''); setLoading(true);
    if (!email || !password) return setAuthError('Please fill in all fields');
    if (password.length < 6) return setAuthError('Password must be at least 6 characters');

    const userId = `user_${Date.now()}`;
    const { error } = await supabaseRequest('POST', '/users', { id: userId, email, password });
    if (error) return setAuthError('Email already registered or error occurred');

    const user = { id: userId, email };
    localStorage.setItem('job-tracker-user', JSON.stringify(user));
    setCurrentUser(user); setAuthMode('tracker'); setEmail(''); setPassword('');
    await loadUserApplications(userId);
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError(''); setLoading(true);
    if (!email || !password) return setAuthError('Please fill in all fields');

    const { data, error } = await supabaseRequest('GET', `/users?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`);
    if (error || !data || data.length === 0) return setAuthError('Email not found or incorrect password');

    const user = { id: data[0].id, email };
    localStorage.setItem('job-tracker-user', JSON.stringify(user));
    setCurrentUser(user); setAuthMode('tracker'); setEmail(''); setPassword('');
    await loadUserApplications(data[0].id);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('job-tracker-user');
    setCurrentUser(null); setAuthMode('login'); setApplications([]);
    setEmail(''); setPassword(''); setAuthError('');
  };

  // ==========================
  // SHARE LINK HANDLERS
  // ==========================
  const generateShareLink = () => {
    const baseUrl = window.location.href.split('?')[0];
    setShareLink(`${baseUrl}?share=${currentUser.id}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================
  // FORM HANDLERS
  // ==========================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const addApplication = async () => {
    if (!formData.company.trim() || !formData.position.trim()) return;
    setLoading(true);
    await supabaseRequest('POST', '/applications', { user_id: currentUser.id, ...formData });
    await loadUserApplications(currentUser.id);
    setFormData({ company: '', position: '', date: new Date().toISOString().split('T')[0], status: 'Applied', notes: '' });
    setCurrentPage('dashboard');
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    setLoading(true);
    await supabaseRequest('PATCH', `/applications?id=eq.${id}`, { status: newStatus });
    await loadUserApplications(currentUser.id);
    setLoading(false);
  };

  const deleteApplication = async (id) => {
    setLoading(true);
    await supabaseRequest('DELETE', `/applications?id=eq.${id}`);
    await loadUserApplications(currentUser.id);
    setLoading(false);
  };

  const startEdit = (app) => {
    setEditingId(app.id);
    setEditFormData({ company: app.company, position: app.position, date: app.date, status: app.status, notes: app.notes || '' });
  };

  const saveEdit = async (id) => {
    setLoading(true);
    await supabaseRequest('PATCH', `/applications?id=eq.${id}`, editFormData);
    await loadUserApplications(currentUser.id);
    setEditingId(null);
    setLoading(false);
  };

  const cancelEdit = () => setEditingId(null);

  // ==========================
  // SHARED VIEW LOGIC
  // ==========================
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedUserId = urlParams.get('share');
    if (!sharedUserId || sharedUserId === currentUser?.id) return;

    const loadSharedApps = async () => {
      const { data } = await supabaseRequest('GET', `/applications?user_id=eq.${sharedUserId}`);
      if (data) setSharedApps(data);
    };

    loadSharedApps();
    const interval = setInterval(loadSharedApps, 3000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const sharedStats = {
    total: sharedApps.length,
    applied: sharedApps.filter(a => a.status === 'Applied').length,
    interviews: sharedApps.filter(a => ['Interview Scheduled', 'Interviewing'].includes(a.status)).length,
    offers: sharedApps.filter(a => a.status === 'Offer Received').length,
    rejected: sharedApps.filter(a => a.status === 'Rejected').length
  };

  // ==========================
  // DASHBOARD STATS
  // ==========================
  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    interviews: applications.filter(a => ['Interview Scheduled', 'Interviewing'].includes(a.status)).length,
    offers: applications.filter(a => a.status === 'Offer Received').length,
    rejected: applications.filter(a => a.status === 'Rejected').length
  };

  // ==========================
  // RENDER
  // ==========================
  // AUTH PAGES
  if (authMode === 'login' || authMode === 'signup') {
    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', padding: '40px', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)', padding: '16px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Briefcase size={32} color="white" />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>Job Tracker</h1>
                <p style={{ color: '#666', margin: 0 }}>{authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
              </div>
              {authError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{authError}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                <button onClick={authMode === 'login' ? handleLogin : handleSignup} disabled={loading} style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <p style={{ color: '#666', margin: '0 0 12px 0', fontSize: '14px' }}>{authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}</p>
                  <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#0099ff', cursor: 'pointer', fontWeight: '600', fontSize: '14px', textDecoration: 'underline' }}>
                    {authMode === 'login' ? 'Sign up here' : 'Sign in here'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================
  // SHARED VIEW PAGE
  // ==========================
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUserId = urlParams.get('share');
  if (sharedUserId && sharedUserId !== currentUser?.id) {
    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', margin: 0, marginBottom: '32px' }}>Shared Job Applications</h1>

          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Total', count: sharedStats.total, icon: Briefcase, color: '#0099ff' },
              { label: 'Pending', count: sharedStats.applied, icon: Clock, color: '#0369a1' },
              { label: 'Interviews', count: sharedStats.interviews, icon: Calendar, color: '#7e22ce' },
              { label: 'Offers', count: sharedStats.offers, icon: TrendingUp, color: '#15803d' },
              { label: 'Rejected', count: sharedStats.rejected, icon: AlertCircle, color: '#b91c1c' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
                  <Icon size={24} color={stat.color} style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color }}>{stat.count}</div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>{stat.label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sharedApps.map(app => {
              const StatusIcon = statusColors[app.status]?.icon || Briefcase;
              return (
                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#111' }}>{app.position}</div>
                    <div style={{ color: '#555', fontSize: '14px' }}>{app.company}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusIcon size={20} color={statusColors[app.status]?.text} />
                    <span style={{ color: statusColors[app.status]?.text, fontWeight: '600' }}>{app.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================
  // DASHBOARD / MAIN PAGE
  // ==========================
  return (
    <div style={backgroundStyle}>
      {decorativePattern}
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', color: 'white' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Job Tracker</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Log Out
            </button>
            <button onClick={generateShareLink} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Share
            </button>
            {shareLink && (
              <button onClick={copyToClipboard} style={{ background: copied ? '#4ade80' : 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            )}
          </div>
        </header>

        {/* STATS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total', count: stats.total, icon: Briefcase, color: '#0099ff' },
            { label: 'Pending', count: stats.applied, icon: Clock, color: '#0369a1' },
            { label: 'Interviews', count: stats.interviews, icon: Calendar, color: '#7e22ce' },
            { label: 'Offers', count: stats.offers, icon: TrendingUp, color: '#15803d' },
            { label: 'Rejected', count: stats.rejected, icon: AlertCircle, color: '#b91c1c' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
                <Icon size={24} color={stat.color} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color }}>{stat.count}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* APPLICATIONS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {applications.map(app => {
            const StatusIcon = statusColors[app.status]?.icon || Briefcase;
            return (
              <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                {editingId === app.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <input name="company" value={editFormData.company} onChange={handleEditChange} placeholder="Company" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    <input name="position" value={editFormData.position} onChange={handleEditChange} placeholder="Position" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    <input name="date" type="date" value={editFormData.date} onChange={handleEditChange} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    <select name="status" value={editFormData.status} onChange={handleEditChange} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}>
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea name="notes" value={editFormData.notes} onChange={handleEditChange} placeholder="Notes" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }} />
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#111' }}>{app.position}</div>
                    <div style={{ color: '#555', fontSize: '14px' }}>{app.company}</div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingId === app.id ? (
                    <>
                      <button onClick={() => saveEdit(app.id)} style={{ padding: '8px', borderRadius: '8px', background: '#4ade80', color: '#fff', fontWeight: '600' }}>Save</button>
                      <button onClick={cancelEdit} style={{ padding: '8px', borderRadius: '8px', background: '#f87171', color: '#fff', fontWeight: '600' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(app)} style={{ padding: '8px', borderRadius: '8px', background: '#fbbf24', color: '#fff', fontWeight: '600' }}>Edit</button>
                      <button onClick={() => deleteApplication(app.id)} style={{ padding: '8px', borderRadius: '8px', background: '#f87171', color: '#fff', fontWeight: '600' }}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ADD APPLICATION FORM */}
        <div style={{ marginTop: '32px', background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 'bold', color: '#111' }}>Add New Application</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input name="company" value={formData.company} onChange={handleInputChange} placeholder="Company" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <input name="position" value={formData.position} onChange={handleInputChange} placeholder="Position" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <input name="date" type="date" value={formData.date} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <select name="status" value={formData.status} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Notes" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <button onClick={addApplication} style={{ padding: '12px', borderRadius: '8px', background: '#00d4ff', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Add Application</button>
          </div>
        </div>
      </div>
    </div>
  );
}
