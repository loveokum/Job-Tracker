import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Briefcase, CheckCircle, Clock, TrendingUp, AlertCircle, User, Calendar, LogOut, Share2, Copy, Check } from 'lucide-react';

// -------------------- Supabase Helper --------------------
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

// -------------------- App Component --------------------
export default function App() {
  // -------------------- State --------------------
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // login, signup, tracker
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [applications, setApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard'); // dashboard, add, jobs
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Shared View State
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUserId = urlParams.get('share');
  const [sharedApps, setSharedApps] = useState([]);

  // -------------------- Constants --------------------
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

  // -------------------- Effects --------------------
  // Load user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('job-tracker-user');
    if (saved) {
      const user = JSON.parse(saved);
      setCurrentUser(user);
      setAuthMode('tracker');
      loadUserApplications(user.id);
    }
  }, []);

  // Load shared applications
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
  }, [sharedUserId, currentUser]);

  // -------------------- Functions --------------------
  const loadUserApplications = async (userId) => {
    setLoading(true);
    const { data, error } = await supabaseRequest('GET', `/applications?user_id=eq.${userId}`);
    if (!error && data) setApplications(data);
    setLoading(false);
  };

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
    setAuthError(''); setLoading(true);
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

  const generateShareLink = () => {
    const baseUrl = window.location.href.split('?')[0];
    setShareLink(`${baseUrl}?share=${currentUser.id}`);
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
    setEditFormData({ ...app });
  };

  const saveEdit = async (id) => {
    setLoading(true);
    await supabaseRequest('PATCH', `/applications?id=eq.${id}`, editFormData);
    await loadUserApplications(currentUser.id);
    setEditingId(null);
    setLoading(false);
  };

  const cancelEdit = () => setEditingId(null);

  const handleStatusClick = (status) => {
    setSelectedStatus(status);
    setCurrentPage('jobs');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedStatus(null);
  };

  // -------------------- Computed Stats --------------------
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

  // -------------------- Render --------------------
  // -------- AUTH --------
  if (authMode === 'login' || authMode === 'signup') {
    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.95)', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>Job Tracker</h1>
            {authError && <p style={{ color: 'red', textAlign: 'center' }}>{authError}</p>}
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
            <button onClick={authMode === 'login' ? handleLogin : handleSignup} style={{ width: '100%', padding: '12px', marginBottom: '12px' }}>{authMode === 'login' ? 'Login' : 'Signup'}</button>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ width: '100%', padding: '12px' }}>{authMode === 'login' ? 'Go to Signup' : 'Go to Login'}</button>
          </div>
        </div>
      </div>
    );
  }

  // -------- SHARED VIEW --------
  if (sharedUserId && sharedUserId !== currentUser?.id) {
    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>Shared Job Applications</h1>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {[
              { label: 'Total', count: sharedStats.total, color: '#0099ff' },
              { label: 'Pending', count: sharedStats.applied, color: '#0369a1' },
              { label: 'Interviews', count: sharedStats.interviews, color: '#7e22ce' },
              { label: 'Offers', count: sharedStats.offers, color: '#15803d' },
              { label: 'Rejected', count: sharedStats.rejected, color: '#b91c1c' }
            ].map((stat, idx) => (
              <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '24px', flex: 1 }}>
                <div style={{ color: stat.color, fontWeight: 'bold', fontSize: '24px' }}>{stat.count}</div>
                <div>{stat.label}</div>
              </div>
            ))}
          </div>
          {sharedApps.map(app => {
            const StatusIcon = statusColors[app.status]?.icon || Briefcase;
            return (
              <div key={app.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                <h3>{app.position}</h3>
                <p>{app.company}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <StatusIcon size={16} color={statusColors[app.status]?.text} />
                  <span>{app.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------- DASHBOARD + JOBS + ADD --------
  if (currentPage === 'jobs') {
    const filteredApplications = selectedStatus ? applications.filter(a => a.status === selectedStatus) : applications;
    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button onClick={handleBackToDashboard} style={{ marginBottom: '24px' }}>← Back</button>
          <h1 style={{ color: 'white', marginBottom: '16px' }}>{selectedStatus || 'All'} Jobs</h1>
          {filteredApplications.map(app => {
            const StatusIcon = statusColors[app.status]?.icon || Briefcase;
            return (
              <div key={app.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3>{app.position}</h3>
                  <p>{app.company}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <StatusIcon size={16} color={statusColors[app.status]?.text} />
                    <span>{app.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEdit(app)}>Edit</button>
                  <button onClick={() => deleteApplication(app.id)}>Delete</button>
                </div>
              </div>
            );
          })}
          {filteredApplications.length === 0 && <p style={{ color: 'white' }}>No applications found.</p>}
        </div>
      </div>
    );
  }

  // -------- DASHBOARD MAIN --------
  return (
    <div style={backgroundStyle}>
      {decorativePattern}
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 style={{ color: 'white' }}>Job Tracker</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={generateShareLink}>Share</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {shareLink && (
          <div style={{ marginBottom: '24px' }}>
            <input type="text" value={shareLink} readOnly />
            <button onClick={copyToClipboard}>{copied ? 'Copied!' : 'Copy'}</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {[
            { label: 'Total', count: stats.total, color: '#0099ff' },
            { label: 'Pending', count: stats.applied, color: '#0369a1' },
            { label: 'Interviews', count: stats.interviews, color: '#7e22ce' },
            { label: 'Offers', count: stats.offers, color: '#15803d' },
            { label: 'Rejected', count: stats.rejected, color: '#b91c1c' }
          ].map((stat, idx) => (
            <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '24px', flex: 1, cursor: 'pointer' }} onClick={() => handleStatusClick(stat.label === 'Pending' ? 'Applied' : stat.label)}>
              <div style={{ color: stat.color, fontWeight: 'bold', fontSize: '24px' }}>{stat.count}</div>
              <div>{stat.label}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setCurrentPage('add')} style={{ marginBottom: '24px' }}>+ Add Application</button>

        {currentPage === 'add' && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px' }}>
            <h2>Add Application</h2>
            <input name="company" placeholder="Company" value={formData.company} onChange={handleInputChange} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
            <input name="position" placeholder="Position" value={formData.position} onChange={handleInputChange} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
            <input name="date" type="date" value={formData.date} onChange={handleInputChange} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
            <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', marginBottom: '12px', padding: '8px' }}>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea name="notes" placeholder="Notes" value={formData.notes} onChange={handleInputChange} style={{ width: '100%', marginBottom: '12px', padding: '8px' }} />
            <button onClick={addApplication}>Save</button>
            <button onClick={() => setCurrentPage('dashboard')}>Cancel</button>
          </div>
        )}

        <div style={{ marginTop: '32px' }}>
          {applications.map(app => {
            if (editingId === app.id) {
              return (
                <div key={app.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                  <input name="company" value={editFormData.company} onChange={handleEditChange} style={{ width: '100%', marginBottom: '8px' }} />
                  <input name="position" value={editFormData.position} onChange={handleEditChange} style={{ width: '100%', marginBottom: '8px' }} />
                  <input name="date" type="date" value={editFormData.date} onChange={handleEditChange} style={{ width: '100%', marginBottom: '8px' }} />
                  <select name="status" value={editFormData.status} onChange={handleEditChange} style={{ width: '100%', marginBottom: '8px' }}>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <textarea name="notes" value={editFormData.notes} onChange={handleEditChange} style={{ width: '100%', marginBottom: '8px' }} />
                  <button onClick={() => saveEdit(app.id)}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              );
            }

            const StatusIcon = statusColors[app.status]?.icon || Briefcase;
            return (
              <div key={app.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3>{app.position}</h3>
                  <p>{app.company}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <StatusIcon size={16} color={statusColors[app.status]?.text} />
                    <span>{app.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEdit(app)}>Edit</button>
                  <button onClick={() => deleteApplication(app.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
