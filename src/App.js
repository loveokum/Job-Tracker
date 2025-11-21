import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Briefcase, CheckCircle, Clock, TrendingUp, AlertCircle, User, Calendar, LogOut, Share2, Copy, Check, Menu, X, Edit2 } from 'lucide-react';

// Supabase Configuration
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sharedApps, setSharedApps] = useState([]);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Applied',
    notes: ''
  });
  const [editFormData, setEditFormData] = useState({
    company: '',
    position: '',
    date: '',
    status: '',
    notes: ''
  });

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const sharedUserId = urlParams.get('share');

  const statusOptions = ['Applied', 'Reviewing', 'Interview Scheduled', 'Interviewing', 'Offer Received', 'Rejected', 'Withdrawn'];
  const statusConfig = {
    'Applied': { bg: '#DBEAFE', text: '#0369A1', icon: Clock, lightBg: '#EFF6FF' },
    'Reviewing': { bg: '#FEF3C7', text: '#B45309', icon: CheckCircle, lightBg: '#FFFBEB' },
    'Interview Scheduled': { bg: '#E9D5FF', text: '#7E22CE', icon: Calendar, lightBg: '#FAF5FF' },
    'Interviewing': { bg: '#E0E7FF', text: '#4F46E5', icon: User, lightBg: '#EEF2FF' },
    'Offer Received': { bg: '#DCFCE7', text: '#15803D', icon: TrendingUp, lightBg: '#F0FDF4' },
    'Rejected': { bg: '#FEE2E2', text: '#991B1B', icon: AlertCircle, lightBg: '#FEF2F2' },
    'Withdrawn': { bg: '#F3F4F6', text: '#374151', icon: Briefcase, lightBg: '#F9FAFB' }
  };

  useEffect(() => {
    const saved = localStorage.getItem('job-tracker-user');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      loadUserApplications(user.id);
    }
  }, []);

  useEffect(() => {
    if (sharedUserId && sharedUserId !== currentUser?.id) {
      const loadSharedApps = async () => {
        const { data } = await supabaseRequest('GET', `/applications?user_id=eq.${sharedUserId}`);
        if (data) setSharedApps(data);
      };
      loadSharedApps();
      const interval = setInterval(loadSharedApps, 3000);
      return () => clearInterval(interval);
    }
  }, [sharedUserId, currentUser?.id]);

  const loadUserApplications = async (userId) => {
    setLoading(true);
    const { data } = await supabaseRequest('GET', `/applications?user_id=eq.${userId}`);
    if (data) setApplications(data);
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) { setAuthError('Please fill in all fields'); return; }
    if (password.length < 6) { setAuthError('Password must be at least 6 characters'); return; }
    
    setLoading(true);
    const userId = `user_${Date.now()}`;
    const { error } = await supabaseRequest('POST', '/users', { id: userId, email, password });
    if (error) { setAuthError('Email already registered'); setLoading(false); return; }
    
    const user = { id: userId, email };
    localStorage.setItem('job-tracker-user', JSON.stringify(user));
    setCurrentUser(user);
    setEmail('');
    setPassword('');
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) { setAuthError('Please fill in all fields'); return; }
    
    setLoading(true);
    const { data, error } = await supabaseRequest('GET', `/users?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`);
    if (error || !data || data.length === 0) { setAuthError('Invalid credentials'); setLoading(false); return; }
    
    const user = { id: data[0].id, email };
    localStorage.setItem('job-tracker-user', JSON.stringify(user));
    setCurrentUser(user);
    await loadUserApplications(data[0].id);
    setEmail('');
    setPassword('');
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('job-tracker-user');
    setCurrentUser(null);
    setApplications([]);
    setEmail('');
    setPassword('');
  };

  const generateShareLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    setShareLink(`${baseUrl}?share=${currentUser.id}`);
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
    setEditFormData(app);
  };

  const saveEdit = async (id) => {
    setLoading(true);
    await supabaseRequest('PATCH', `/applications?id=eq.${id}`, editFormData);
    await loadUserApplications(currentUser.id);
    setEditingId(null);
    setLoading(false);
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    interviews: applications.filter(a => ['Interview Scheduled', 'Interviewing'].includes(a.status)).length,
    offers: applications.filter(a => a.status === 'Offer Received').length,
    rejected: applications.filter(a => a.status === 'Rejected').length
  };

  const sharedStats = {
    total: sharedApps.length,
    applied: sharedApps.filter(a => a.status === 'Applied').length,
    interviews: sharedApps.filter(a => ['Interview Scheduled', 'Interviewing'].includes(a.status)).length,
    offers: sharedApps.filter(a => a.status === 'Offer Received').length,
    rejected: sharedApps.filter(a => a.status === 'Rejected').length
  };

  // AUTH PAGE
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ background: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Briefcase size={32} color="#667eea" />
            </div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '28px' }}>Job Tracker</h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>Track your job search journey</p>
          </div>
          
          <div style={{ padding: '40px' }}>
            {authError && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{authError}</div>}
            
            <input 
              type="email" 
              placeholder="Email address" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            
            <button 
              onClick={authMode === 'login' ? handleLogin : handleSignup}
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}
            >
              {loading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#6B7280', margin: '0 0 12px 0', fontSize: '14px' }}>
                {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </p>
              <button 
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}
                style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600', fontSize: '14px', textDecoration: 'underline' }}
              >
                {authMode === 'login' ? 'Create one' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SHARED VIEW
  if (sharedUserId && sharedUserId !== currentUser?.id) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '0 0 32px 0' }}>Shared Job Applications</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Total', count: sharedStats.total, color: '#667eea' },
              { label: 'Pending', count: sharedStats.applied, color: '#0369A1' },
              { label: 'Interviews', count: sharedStats.interviews, color: '#7E22CE' },
              { label: 'Offers', count: sharedStats.offers, color: '#15803D' },
              { label: 'Rejected', count: sharedStats.rejected, color: '#991B1B' }
            ].map((stat, idx) => (
              <div key={idx} style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                <div style={{ color: stat.color, fontWeight: '700', fontSize: '32px', marginBottom: '8px' }}>{stat.count}</div>
                <div style={{ color: '#6B7280', fontSize: '14px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {sharedApps.map(app => {
              const config = statusConfig[app.status] || statusConfig['Applied'];
              const Icon = config.icon;
              return (
                <div key={app.id} style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: config.lightBg, padding: '12px', borderRadius: '8px', display: 'flex' }}>
                    <Icon size={24} color={config.text} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{app.position}</h3>
                    <p style={{ margin: '0 0 8px 0', color: '#6B7280', fontSize: '14px' }}>{app.company}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: config.bg, color: config.text, padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{app.status}</span>
                      <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Applied: {new Date(app.date).toLocaleDateString()}</span>
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

  // ADD APPLICATION PAGE
  if (currentPage === 'add') {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <button onClick={() => setCurrentPage('dashboard')} style={{ marginBottom: '24px', background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← Back to Dashboard
          </button>
          
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>Add New Application</h2>
            
            <input 
              name="company" 
              placeholder="Company Name" 
              value={formData.company} 
              onChange={handleInputChange}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <input 
              name="position" 
              placeholder="Job Position" 
              value={formData.position} 
              onChange={handleInputChange}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <input 
              name="date" 
              type="date" 
              value={formData.date} 
              onChange={handleInputChange}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleInputChange}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', boxSizing: 'border-box' }}
            >
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea 
              name="notes" 
              placeholder="Notes (optional)" 
              value={formData.notes} 
              onChange={handleInputChange}
              rows="4"
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={addApplication}
                disabled={loading}
                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}
              >
                {loading ? 'Saving...' : 'Save Application'}
              </button>
              <button 
                onClick={() => setCurrentPage('dashboard')}
                style={{ flex: 1, padding: '12px', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // JOBS LIST PAGE
  if (currentPage === 'jobs') {
    const filteredApps = selectedStatus ? applications.filter(a => a.status === selectedStatus) : applications;
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <button onClick={() => { setCurrentPage('dashboard'); setSelectedStatus(null); }} style={{ marginBottom: '24px', background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← Back to Dashboard
          </button>
          
          <h1 style={{ margin: '0 0 32px 0', fontSize: '32px', fontWeight: '700' }}>{selectedStatus || 'All Applications'}</h1>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredApps.map(app => {
              const config = statusConfig[app.status] || statusConfig['Applied'];
              const Icon = config.icon;
              return (
                <div key={app.id} style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  {editingId === app.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <input 
                        name="company" 
                        value={editFormData.company} 
                        onChange={handleEditChange}
                        style={{ padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                      <input 
                        name="position" 
                        value={editFormData.position} 
                        onChange={handleEditChange}
                        style={{ padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                      <input 
                        name="date" 
                        type="date" 
                        value={editFormData.date} 
                        onChange={handleEditChange}
                        style={{ padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                      <select 
                        name="status" 
                        value={editFormData.status} 
                        onChange={handleEditChange}
                        style={{ padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <textarea 
                        name="notes" 
                        value={editFormData.notes} 
                        onChange={handleEditChange}
                        rows="3"
                        style={{ padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          onClick={() => saveEdit(app.id)}
                          disabled={loading}
                          style={{ flex: 1, padding: '10px', background: '#15803D', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.8 : 1 }}
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          style={{ flex: 1, padding: '10px', background: '#E5E7EB', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: config.lightBg, padding: '12px', borderRadius: '8px', display: 'flex' }}>
                          <Icon size={24} color={config.text} />
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{app.position}</h3>
                          <p style={{ margin: '0', color: '#6B7280', fontSize: '14px' }}>{app.company}</p>
                          <div style={{ marginTop: '8px' }}>
                            <span style={{ background: config.bg, color: config.text, padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{app.status}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => startEdit(app)}
                          style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Edit2 size={16} /> Edit
                        </button>
                        <button 
                          onClick={() => deleteApplication(app.id)}
                          disabled={loading}
                          style={{ padding: '8px 16px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.8 : 1 }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredApps.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>No applications found</div>}
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', sticky: 'top', zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={24} color="white" />
            </div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Job Tracker</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={generateShareLink}
              style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Share2 size={16} /> Share
            </button>
            <button 
              onClick={() => setCurrentPage('add')}
              style={{ padding: '8px 16px', background: 'white', color: '#667eea', border: '2px solid #667eea', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Add Job
            </button>
            <button 
              onClick={handleLogout}
              style={{ padding: '8px 16px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Share Link Section */}
      {shareLink && (
        <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="text" 
              value={shareLink} 
              readOnly 
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{ padding: '8px 16px', background: copied ? '#15803D' : '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy Link</>}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {[
            { label: 'Total Applied', count: stats.total, color: '#667eea', icon: Briefcase, status: null },
            { label: 'Pending Review', count: stats.applied, color: '#0369A1', icon: Clock, status: 'Applied' },
            { label: 'Interviews', count: stats.interviews, color: '#7E22CE', icon: Calendar, status: 'Interview Scheduled' },
            { label: 'Offers', count: stats.offers, color: '#15803D', icon: TrendingUp, status: 'Offer Received' },
            { label: 'Rejected', count: stats.rejected, color: '#991B1B', icon: AlertCircle, status: 'Rejected' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div 
                key={idx} 
                onClick={() => { setSelectedStatus(stat.status); setCurrentPage('jobs'); }}
                style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s', border: '2px solid transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ background: `${stat.color}20`, padding: '8px', borderRadius: '8px', display: 'flex' }}>
                    <Icon size={20} color={stat.color} />
                  </div>
                  <div style={{ color: stat.color, fontSize: '28px', fontWeight: '700' }}>{stat.count}</div>
                </div>
                <div style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Recent Applications */}
        {applications.length > 0 && (
          <div>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>Recent Applications</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {applications.slice(0, 5).map(app => {
                const config = statusConfig[app.status] || statusConfig['Applied'];
                const Icon = config.icon;
                return (
                  <div key={app.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      <div style={{ background: config.lightBg, padding: '10px', borderRadius: '8px', display: 'flex' }}>
                        <Icon size={20} color={config.text} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600' }}>{app.position}</h4>
                        <p style={{ margin: '0', color: '#6B7280', fontSize: '13px' }}>{app.company}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ background: config.bg, color: config.text, padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{app.status}</span>
                      <select 
                        value={app.status} 
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {applications.length === 0 && (
          <div style={{ background: 'white', padding: '60px 20px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', width: '80px', height: '80px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Briefcase size={40} color="white" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>No applications yet</h3>
            <p style={{ margin: '0 0 24px 0', color: '#6B7280' }}>Start tracking your job search</p>
            <button 
              onClick={() => setCurrentPage('add')}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={20} /> Add Your First Application
            </button>
          </div>
        )}
      </main>
    </div>
  );
}