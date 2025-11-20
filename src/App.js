import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Briefcase, CheckCircle, Clock, TrendingUp, AlertCircle, User, Calendar, LogOut, Share2, Copy, Check } from 'lucide-react';

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';

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

export default function JobTracker() {
  // ---- State ----
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [applications, setApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'jobs' | 'add'
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ company: '', position: '', date: '', status: '', notes: '' });
  const [formData, setFormData] = useState({ company: '', position: '', date: new Date().toISOString().split('T')[0], status: 'Applied', notes: '' });
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // ---- Load current user ----
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

  // ---- Load applications ----
  const loadUserApplications = async (userId) => {
    setLoading(true);
    const { data, error } = await supabaseRequest('GET', `/applications?user_id=eq.${userId}`);
    if (!error && data) setApplications(data);
    setLoading(false);
  };

  // ---- Auth handlers ----
  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    if (!email || !password) { setAuthError('Please fill in all fields'); setLoading(false); return; }
    if (password.length < 6) { setAuthError('Password must be at least 6 characters'); setLoading(false); return; }

    const userId = `user_${Date.now()}`;
    const { error } = await supabaseRequest('POST', '/users', { id: userId, email, password });
    if (error) { setAuthError('Email already registered or error occurred'); setLoading(false); return; }

    const user = { id: userId, email };
    localStorage.setItem('job-tracker-user', JSON.stringify(user));
    setCurrentUser(user);
    setAuthMode('tracker');
    setEmail(''); setPassword(''); setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    if (!email || !password) { setAuthError('Please fill in all fields'); setLoading(false); return; }

    const { data, error } = await supabaseRequest('GET', `/users?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`);
    if (error || !data || data.length === 0) { setAuthError('Email not found or incorrect password'); setLoading(false); return; }

    const user = { id: data[0].id, email };
    localStorage.setItem('job-tracker-user', JSON.stringify(user));
    setCurrentUser(user);
    setAuthMode('tracker');
    await loadUserApplications(data[0].id);
    setEmail(''); setPassword(''); setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('job-tracker-user');
    setCurrentUser(null);
    setAuthMode('login');
    setApplications([]);
    setEmail('');
    setPassword('');
    setAuthError('');
  };

  // ---- Share link ----
  const generateShareLink = () => {
    const baseUrl = window.location.href.split('?')[0];
    const link = `${baseUrl}?share=${currentUser.id}`;
    setShareLink(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ---- Form handlers ----
  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleEditChange = (e) => setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // ---- CRUD ----
  const addApplication = async () => {
    if (formData.company.trim() && formData.position.trim()) {
      setLoading(true);
      await supabaseRequest('POST', '/applications', { user_id: currentUser.id, ...formData });
      await loadUserApplications(currentUser.id);
      setFormData({ company: '', position: '', date: new Date().toISOString().split('T')[0], status: 'Applied', notes: '' });
      setCurrentPage('dashboard');
      setLoading(false);
    }
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

  // ---- Stats ----
  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    interviews: applications.filter(a => ['Interview Scheduled', 'Interviewing'].includes(a.status)).length,
    offers: applications.filter(a => a.status === 'Offer Received').length,
    rejected: applications.filter(a => a.status === 'Rejected').length
  };

  // ---- Page navigation ----
  const handleStatusClick = (status) => { setSelectedStatus(status); setCurrentPage('jobs'); };
  const handleBackToDashboard = () => { setSelectedStatus(null); setCurrentPage('dashboard'); };

  // ---- Decorative pattern ----
  const backgroundStyle = { minHeight: '100vh', background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 25%, #6366f1 75%, #ec4899 100%)', backgroundAttachment: 'fixed', padding: 'clamp(16px, 5vw, 24px)', position: 'relative', overflow: 'hidden' };
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

  // ---- Auth pages ----
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
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
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

  // ---- Shared view logic ----
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUserId = urlParams.get('share');

  if (sharedUserId && sharedUserId !== currentUser?.id) {
    const [sharedApps, setSharedApps] = useState([]);

    useEffect(() => {
      const loadSharedApps = async () => {
        const { data } = await supabaseRequest('GET', `/applications?user_id=eq.${sharedUserId}`);
        if (data) setSharedApps(data);
      };
      loadSharedApps();
      const interval = setInterval(loadSharedApps, 3000);
      return () => clearInterval(interval);
    }, []);

    const sharedStats = {
      total: sharedApps.length,
      applied: sharedApps.filter(a => a.status === 'Applied').length,
      interviews: sharedApps.filter(a => ['Interview Scheduled', 'Interviewing'].includes(a.status)).length,
      offers: sharedApps.filter(a => a.status === 'Offer Received').length,
      rejected: sharedApps.filter(a => a.status === 'Rejected').length
    };

    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>Shared Job Applications</h1>

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
              const StatusIcon = statusColors[app.status].icon;
              return (
                <div key={app.id} style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#111' }}>{app.position}</div>
                    <div style={{ color: '#555', fontSize: '14px' }}>{app.company}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <StatusIcon size={16} color={statusColors[app.status].text} />
                      <span style={{ color: statusColors[app.status].text, fontWeight: '600', fontSize: '14px' }}>{app.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---- Jobs Page ----
  if (currentPage === 'jobs') {
    const filteredApplications = selectedStatus ? applications.filter(app => app.status === selectedStatus) : applications;

    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <button onClick={handleBackToDashboard} style={{ padding: '8px 16px', borderRadius: '8px', background: '#4ade80', color: 'white', fontWeight: '600' }}>← Back</button>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>{selectedStatus || 'All'} Jobs</h1>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredApplications.map(app => {
              const StatusIcon = statusColors[app.status]?.icon || Briefcase;
              return (
                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#111' }}>{app.position}</div>
                    <div style={{ color: '#555', fontSize: '14px' }}>{app.company}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <StatusIcon size={16} color={statusColors[app.status]?.text} />
                      <span style={{ color: statusColors[app.status]?.text, fontWeight: '600', fontSize: '14px' }}>{app.status}</span>
                    </div>
                  </div>
                  <div>
                    <button onClick={() => startEdit(app)} style={{ padding: '8px', borderRadius: '8px', background: '#fbbf24', color: '#fff', fontWeight: '600', marginRight: '8px' }}>Edit</button>
                    <button onClick={() => deleteApplication(app.id)} style={{ padding: '8px', borderRadius: '8px', background: '#f87171', color: '#fff', fontWeight: '600' }}>Delete</button>
                  </div>
                </div>
              );
            })}
            {filteredApplications.length === 0 && <p style={{ color: 'white', fontSize: '18px', textAlign: 'center', marginTop: '32px' }}>No applications found for "{selectedStatus}"</p>}
          </div>
        </div>
      </div>
    );
  }

  // ---- Main Dashboard Page ----
  return (
    <div style={backgroundStyle}>
      {decorativePattern}
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white' }}>Job Tracker</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={generateShareLink} style={{ padding: '8px 16px', borderRadius: '8px', background: '#3b82f6', color: 'white', fontWeight: '600' }}>Share</button>
            <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '8px', background: '#ef4444', color: 'white', fontWeight: '600' }}>Logout</button>
          </div>
        </header>

        {shareLink && (
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="text" value={shareLink} readOnly style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none' }} />
            <button onClick={copyToClipboard} style={{ padding: '8px', borderRadius: '8px', background: '#10b981', color: 'white', fontWeight: '600' }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

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
              <div key={idx} onClick={() => stat.label !== 'Total' && handleStatusClick(stat.label)} style={{ cursor: stat.label !== 'Total' ? 'pointer' : 'default', background: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
                <Icon size={24} color={stat.color} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color }}>{stat.count}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Add Application Button */}
        <button onClick={() => setCurrentPage('add')} style={{ padding: '12px 24px', borderRadius: '12px', background: '#10b981', color: 'white', fontWeight: '600', marginBottom: '32px' }}>
          <Plus size={16} style={{ marginRight: '8px' }} /> Add Application
        </button>

        {/* Add Application Form */}
        {currentPage === 'add' && (
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Add New Application</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" name="company" placeholder="Company" value={formData.company} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
              <input type="text" name="position" placeholder="Position" value={formData.position} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
              <select name="status" value={formData.status} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea name="notes" placeholder="Notes" value={formData.notes} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={addApplication} style={{ padding: '12px', borderRadius: '8px', background: '#10b981', color: 'white', fontWeight: '600' }}>Add</button>
                <button onClick={() => setCurrentPage('dashboard')} style={{ padding: '12px', borderRadius: '8px', background: '#ef4444', color: 'white', fontWeight: '600' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Applications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {applications.map(app => {
            const StatusIcon = statusColors[app.status]?.icon || Briefcase;

            if (editingId === app.id) {
              return (
                <div key={app.id} style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" name="company" value={editFormData.company} onChange={handleEditChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                  <input type="text" name="position" value={editFormData.position} onChange={handleEditChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                  <input type="date" name="date" value={editFormData.date} onChange={handleEditChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                  <select name="status" value={editFormData.status} onChange={handleEditChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <textarea name="notes" value={editFormData.notes} onChange={handleEditChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => saveEdit(app.id)} style={{ padding: '12px', borderRadius: '8px', background: '#10b981', color: 'white', fontWeight: '600' }}>Save</button>
                    <button onClick={cancelEdit} style={{ padding: '12px', borderRadius: '8px', background: '#ef4444', color: 'white', fontWeight: '600' }}>Cancel</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#111' }}>{app.position}</div>
                  <div style={{ color: '#555', fontSize: '14px' }}>{app.company}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <StatusIcon size={16} color={statusColors[app.status]?.text} />
                    <span style={{ color: statusColors[app.status]?.text, fontWeight: '600', fontSize: '14px' }}>{app.status}</span>
                  </div>
                </div>
                <div>
                  <button onClick={() => startEdit(app)} style={{ padding: '8px', borderRadius: '8px', background: '#fbbf24', color: '#fff', fontWeight: '600', marginRight: '8px' }}>Edit</button>
                  <button onClick={() => deleteApplication(app.id)} style={{ padding: '8px', borderRadius: '8px', background: '#f87171', color: '#fff', fontWeight: '600' }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
