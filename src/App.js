import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Briefcase, CheckCircle, Clock, TrendingUp, AlertCircle, User, Calendar, LogOut, Share2, Copy, Check } from 'lucide-react';

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

export default function JobTracker() {
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
    company: '',
    position: '',
    date: '',
    status: '',
    notes: ''
  });
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Applied',
    notes: ''
  });

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

  const loadUserApplications = async (userId) => {
    setLoading(true);
    const { data, error } = await supabaseRequest('GET', `/applications?user_id=eq.${userId}`);
    if (!error && data) {
      setApplications(data);
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    if (!email || !password) {
      setAuthError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const userId = `user_${Date.now()}`;
    const { error } = await supabaseRequest('POST', '/users', {
      id: userId,
      email,
      password
    });
    
    if (error) {
      setAuthError('Email already registered or error occurred');
      setLoading(false);
      return;
    }

    const user = { id: userId, email };
    localStorage.setItem('job-tracker-user', JSON.stringify(user));
    setCurrentUser(user);
    setAuthMode('tracker');
    setEmail('');
    setPassword('');
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    if (!email || !password) {
      setAuthError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseRequest('GET', `/users?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`);
    
    if (error || !data || data.length === 0) {
      setAuthError('Email not found or incorrect password');
      setLoading(false);
      return;
    }

    const user = { id: data[0].id, email };
    localStorage.setItem('job-tracker-user', JSON.stringify(user));
    setCurrentUser(user);
    setAuthMode('tracker');
    await loadUserApplications(data[0].id);
    setEmail('');
    setPassword('');
    setLoading(false);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const addApplication = async () => {
    if (formData.company.trim() && formData.position.trim()) {
      setLoading(true);
      await supabaseRequest('POST', '/applications', {
        user_id: currentUser.id,
        ...formData
      });
      
      await loadUserApplications(currentUser.id);
      setFormData({
        company: '',
        position: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Applied',
        notes: ''
      });
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
    setEditFormData({
      company: app.company,
      position: app.position,
      date: app.date,
      status: app.status,
      notes: app.notes || ''
    });
  };

  const saveEdit = async (id) => {
    setLoading(true);
    await supabaseRequest('PATCH', `/applications?id=eq.${id}`, editFormData);
    await loadUserApplications(currentUser.id);
    setEditingId(null);
    setLoading(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    interviews: applications.filter(a => ['Interview Scheduled', 'Interviewing'].includes(a.status)).length,
    offers: applications.filter(a => a.status === 'Offer Received').length,
    rejected: applications.filter(a => a.status === 'Rejected').length
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

              {authError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                  {authError}
                </div>
              )}

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

  // SHARE VIEW
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
              const StatusIcon = statusColors[app.status].icon;
              return (
                <div key={app.id} style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', gap: '16px' }}>
                  <div style={{ flex: 1, display: 'flex', gap: '16px' }}>
                    <div style={{ background: statusColors[app.status].bg, padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '48px', height: '48px' }}>
                      <StatusIcon size={24} color={statusColors[app.status].text} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>{app.position}</h3>
                      <p style={{ color: '#666', margin: '4px 0 0 0' }}>{app.company}</p>
                      <p style={{ fontSize: '14px', color: '#999', margin: '6px 0 0 0' }}>Applied: {new Date(app.date).toLocaleDateString()}</p>
                      {app.notes && <p style={{ fontSize: '14px', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>📝 {app.notes}</p>}
                    </div>
                  </div>
                  <div style={{ background: statusColors[app.status].bg, color: statusColors[app.status].text, padding: '8px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    {app.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ADD PAGE
  if (currentPage === 'add') {
    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ maxWidth: '600px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <button onClick={() => setCurrentPage('dashboard')} style={{ marginBottom: '24px', background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>← Back</button>
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#0099ff', margin: '0 0 24px 0' }}>Add Application</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" name="company" placeholder="Company" value={formData.company} onChange={handleInputChange} style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="text" name="position" placeholder="Position" value={formData.position} onChange={handleInputChange} style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              <select name="status" value={formData.status} onChange={handleInputChange} style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea name="notes" placeholder="Notes" value={formData.notes} onChange={handleInputChange} rows="4" style={{ padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <button onClick={addApplication} disabled={loading} style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST PAGE
  if (currentPage === 'list') {
    const filteredApps = selectedStatus ? applications.filter(a => a.status === selectedStatus) : applications;

    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button onClick={() => { setCurrentPage('dashboard'); setSelectedStatus(null); }} style={{ marginBottom: '24px', background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>← Back</button>
          <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '32px' }}>{selectedStatus || 'All'} ({filteredApps.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredApps.map(app => {
              const StatusIcon = statusColors[app.status].icon;
              return (
                <div key={app.id} style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: window.innerWidth < 640 ? 'column' : 'row', gap: '16px' }}>
                  {editingId === app.id ? (
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <input type="text" name="company" value={editFormData.company} onChange={handleEditChange} style={{ padding: '12px', border: '2px solid #00d4ff', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                        <input type="text" name="position" value={editFormData.position} onChange={handleEditChange} style={{ padding: '12px', border: '2px solid #00d4ff', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => saveEdit(app.id)} disabled={loading} style={{ background: '#15803d', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>Save</button>
                        <button onClick={cancelEdit} style={{ background: '#e5e7eb', color: '#374151', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1, display: 'flex', gap: '16px' }}>
                        <div style={{ background: statusColors[app.status].bg, padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '48px', height: '48px' }}>
                          <StatusIcon size={24} color={statusColors[app.status].text} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>{app.position}</h3>
                          <p style={{ color: '#666', margin: '4px 0 0 0' }}>{app.company}</p>
                          <p style={{ fontSize: '14px', color: '#999', margin: '6px 0 0 0' }}>Applied: {new Date(app.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => startEdit(app)} style={{ color: '#0099ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>✏️ Edit</button>
                        <button onClick={() => deleteApplication(app.id)} disabled={loading} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div style={backgroundStyle}>
      {decorativePattern}
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '32px', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: 0 }}>Job Tracker</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>{currentUser.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => generateShareLink()} style={{ background: 'white', color: '#0099ff', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Share2 size={18} /> Share
            </button>
            <button onClick={() => setCurrentPage('add')} style={{ background: 'white', color: '#0099ff', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Add
            </button>
            <button onClick={handleLogout} style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {shareLink && (
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
            <h3 style={{ color: '#333', marginTop: 0, marginBottom: '12px' }}>Share Your Tracking</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" value={shareLink} readOnly style={{ flex: 1, minWidth: '200px', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', background: '#f9fafb', boxSizing: 'border-box' }} />
              <button onClick={copyToClipboard} style={{ background: copied ? '#15803d' : '#0099ff', color: 'white', padding: '10px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
              </button>
            </div>
            <p style={{ color: '#666', fontSize: '12px', margin: '12px 0 0 0' }}>Anyone with this link can view your dashboard in real-time!</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr 1fr' : window.innerWidth < 1024 ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Applied', count: stats.total, icon: Briefcase, color: '#0099ff', status: null },
            { label: 'Pending Review', count: stats.applied, icon: Clock, color: '#0369a1', status: 'Applied' },
            { label: 'Interviews', count: stats.interviews, icon: Calendar, color: '#7e22ce', status: 'Interview Scheduled' },
            { label: 'Offers', count: stats.offers, icon: TrendingUp, color: '#15803d', status: 'Offer Received' },
            { label: 'Rejected', count: stats.rejected, icon: AlertCircle, color: '#b91c1c', status: 'Rejected' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} onClick={() => { setSelectedStatus(stat.status); setCurrentPage('list'); }} style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
                  <Icon size={60} color={stat.color} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Icon size={24} color={stat.color} style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color }}>
                    {stat.count}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                    {stat.label}
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