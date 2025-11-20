import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Briefcase, CheckCircle, Clock, TrendingUp, AlertCircle, User, Calendar, LogOut, Share2, Copy, Check } from 'lucide-react';

export default function JobTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'tracker'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [applications, setApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
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

  // Load user from localStorage on mount
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

  const loadUserApplications = (userId) => {
    try {
      const saved = localStorage.getItem(`job-apps-${userId}`);
      if (saved) {
        setApplications(JSON.parse(saved));
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.log('Error loading applications:', error);
    }
  };

  // Save applications to localStorage
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(`job-apps-${currentUser.id}`, JSON.stringify(applications));
      } catch (error) {
        console.log('Error saving applications:', error);
      }
    }
  }, [applications, currentUser]);

  const handleSignup = (e) => {
    e.preventDefault();
    setAuthError('');

    if (!email || !password) {
      setAuthError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    // Check if user already exists
    const existingUser = localStorage.getItem(`user-${email}`);
    if (existingUser) {
      setAuthError('Email already registered');
      return;
    }

    const userId = Date.now().toString();
    const user = { id: userId, email, password };
    localStorage.setItem(`user-${email}`, JSON.stringify(user));
    localStorage.setItem('job-tracker-user', JSON.stringify(user));
    
    setCurrentUser(user);
    setAuthMode('tracker');
    setEmail('');
    setPassword('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');

    if (!email || !password) {
      setAuthError('Please fill in all fields');
      return;
    }

    const savedUser = localStorage.getItem(`user-${email}`);
    if (!savedUser) {
      setAuthError('Email not found');
      return;
    }

    const user = JSON.parse(savedUser);
    if (user.password !== password) {
      setAuthError('Incorrect password');
      return;
    }

    localStorage.setItem('job-tracker-user', JSON.stringify(user));
    setCurrentUser(user);
    setAuthMode('tracker');
    loadUserApplications(user.id);
    setEmail('');
    setPassword('');
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

  const addApplication = () => {
    if (formData.company.trim() && formData.position.trim()) {
      const newApp = { ...formData, id: Date.now() };
      setApplications(prev => [...prev, newApp]);
      
      setFormData({
        company: '',
        position: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Applied',
        notes: ''
      });
      setCurrentPage('dashboard');
    }
  };

  const updateStatus = (id, newStatus) => {
    setApplications(prev =>
      prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
    );
  };

  const deleteApplication = (id) => {
    setApplications(prev => prev.filter(app => app.id !== id));
  };

  const startEdit = (app) => {
    setEditingId(app.id);
    setEditFormData({
      company: app.company,
      position: app.position,
      date: app.date,
      status: app.status,
      notes: app.notes
    });
  };

  const saveEdit = (id) => {
    setApplications(prev =>
      prev.map(app => app.id === id ? { ...app, ...editFormData } : app)
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      company: '',
      position: '',
      date: '',
      status: '',
      notes: ''
    });
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
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.1,
        pointerEvents: 'none'
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
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
        <div style={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              padding: 'clamp(24px, 6vw, 40px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
                  padding: '16px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Briefcase size={32} color="white" />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>
                  Job Tracker
                </h1>
                <p style={{ color: '#666', margin: 0 }}>
                  {authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}
                </p>
              </div>

              {authError && (
                <div style={{
                  background: '#fee2e2',
                  color: '#b91c1c',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  {authError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#0099ff', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                      background: '#f9fafb',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0099ff';
                      e.target.style.background = '#f0f4ff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = '#f9fafb';
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#0099ff', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                      background: '#f9fafb',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0099ff';
                      e.target.style.background = '#f0f4ff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = '#f9fafb';
                    }}
                  />
                </div>

                <button
                  onClick={authMode === 'login' ? handleLogin : handleSignup}
                  style={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 25%, #6366f1 75%, #ec4899 100%)',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.3s',
                    marginTop: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 24px rgba(0, 212, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <p style={{ color: '#666', margin: '0 0 12px 0', fontSize: '14px' }}>
                    {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  </p>
                  <button
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setAuthError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0099ff',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      textDecoration: 'underline'
                    }}
                  >
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

  // SHARE VIEW (read-only)
  const urlParams = new URLSearchParams(window.location.search);
  const sharedUserId = urlParams.get('share');

  if (sharedUserId && sharedUserId !== currentUser?.id) {
    const sharedApps = (() => {
      try {
        const saved = localStorage.getItem(`job-apps-${sharedUserId}`);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    })();

    const sharedStats = {
      total: sharedApps.length,
      applied: sharedApps.filter(a => a.status === 'Applied').length,
      interviews: sharedApps.filter(a => ['Interview Scheduled', 'Interviewing'].includes(a.status)).length,
      offers: sharedApps.filter(a => a.status === 'Offer Received').length,
      rejected: sharedApps.filter(a => a.status === 'Rejected').length
    };

    const filteredApps = selectedStatus 
      ? sharedApps.filter(a => a.status === selectedStatus)
      : sharedApps;

    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {currentUser && (
            <button
              onClick={() => window.location.href = window.location.pathname}
              style={{
                marginBottom: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Back to My Tracker
            </button>
          )}

          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
              Shared Job Applications
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
              Viewing shared tracking dashboard
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth < 640 ? '1fr 1fr' : 'repeat(5, 1fr)', 
            gap: '16px', 
            marginBottom: '32px' 
          }}>
            {[
              { label: 'Total Applied', count: sharedStats.total, icon: Briefcase, color: '#0099ff' },
              { label: 'Pending Review', count: sharedStats.applied, icon: Clock, color: '#0369a1' },
              { label: 'Interviews', count: sharedStats.interviews, icon: Calendar, color: '#7e22ce' },
              { label: 'Offers', count: sharedStats.offers, icon: TrendingUp, color: '#15803d' },
              { label: 'Rejected', count: sharedStats.rejected, icon: AlertCircle, color: '#b91c1c' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px', 
                  padding: '24px', 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}>
                  <Icon size={24} color={stat.color} style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color }}>
                    {stat.count}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredApps.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                color: '#999',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <p style={{ fontSize: '16px' }}>No applications to display</p>
              </div>
            ) : (
              filteredApps.map(app => {
                const StatusIcon = statusColors[app.status].icon;
                return (
                  <div key={app.id} style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    display: 'flex',
                    flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: window.innerWidth < 640 ? 'flex-start' : 'flex-start',
                    gap: '16px'
                  }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: '16px' }}>
                      <div style={{
                        background: statusColors[app.status].bg,
                        padding: '12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '48px',
                        height: '48px',
                        flexShrink: 0
                      }}>
                        <StatusIcon size={24} color={statusColors[app.status].text} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: '#333',
                          margin: 0
                        }}>
                          {app.position}
                        </h3>
                        <p style={{ color: '#666', margin: '4px 0 0 0' }}>
                          {app.company}
                        </p>
                        <p style={{ fontSize: '14px', color: '#999', margin: '6px 0 0 0' }}>
                          Applied: {new Date(app.date).toLocaleDateString()}
                        </p>
                        {app.notes && <p style={{ fontSize: '14px', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
                          📝 {app.notes}
                        </p>}
                      </div>
                    </div>
                    <div style={{
                      background: statusColors[app.status].bg,
                      color: statusColors[app.status].text,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {app.status}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ADD APPLICATION PAGE
  if (currentPage === 'add') {
    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <button
              onClick={() => setCurrentPage('dashboard')}
              style={{
                marginBottom: '24px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                width: '100%'
              }}
            >
              ← Back to Dashboard
            </button>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '20px',
                background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)',
                padding: '12px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Briefcase size={24} color="white" />
              </div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#0099ff', 
                marginBottom: '24px',
                marginTop: '12px'
              }}>
                Add New Application
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#0099ff', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Company</label>
                    <input
                      type="text"
                      name="company"
                      placeholder="Company Name"
                      value={formData.company}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#f9fafb',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0099ff';
                        e.target.style.background = '#f0f4ff';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.background = '#f9fafb';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#0099ff', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Position</label>
                    <input
                      type="text"
                      name="position"
                      placeholder="Job Position"
                      value={formData.position}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#f9fafb',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0099ff';
                        e.target.style.background = '#f0f4ff';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.background = '#f9fafb';
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#0099ff', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Date Applied</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#f9fafb',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0099ff';
                        e.target.style.background = '#f0f4ff';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.background = '#f9fafb';
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#0099ff', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#f9fafb',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0099ff';
                        e.target.style.background = '#f0f4ff';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.background = '#f9fafb';
                      }}
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#0099ff', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Notes</label>
                  <textarea
                    name="notes"
                    placeholder="Add any notes about this application (optional)"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      outline: 'none',
                      background: '#f9fafb',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0099ff';
                      e.target.style.background = '#f0f4ff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = '#f9fafb';
                    }}
                  />
                </div>
                <button
                  onClick={addApplication}
                  style={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 25%, #6366f1 75%, #ec4899 100%)',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.3s',
                    boxShadow: '0 8px 16px rgba(0, 212, 255, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 24px rgba(0, 212, 255, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 16px rgba(0, 212, 255, 0.4)';
                  }}
                >
                  Save Application
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST PAGE
  if (currentPage === 'list') {
    const filteredApps = selectedStatus 
      ? applications.filter(a => a.status === selectedStatus)
      : applications;

    const listTitle = selectedStatus 
      ? `${selectedStatus} Applications (${filteredApps.length})`
      : `All Applications (${filteredApps.length})`;

    return (
      <div style={backgroundStyle}>
        {decorativePattern}
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => {
              setCurrentPage('dashboard');
              setSelectedStatus(null);
            }}
            style={{
              marginBottom: '24px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back to Dashboard
          </button>

          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '32px'
          }}>
            {listTitle}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredApps.length === 0 ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                color: '#999',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <Briefcase size={48} color="#ddd" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: '16px' }}>No applications with this status yet.</p>
              </div>
            ) : (
              filteredApps.map(app => {
                const StatusIcon = statusColors[app.status].icon;
                return (
                  <div
                    key={app.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      padding: '24px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                      justifyContent: 'space-between',
                      alignItems: window.innerWidth < 640 ? 'flex-start' : 'flex-start',
                      gap: '16px',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      if (editingId !== app.id) {
                        e.currentTarget.style.transform = 'translateX(5px)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (editingId !== app.id) {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  >
                    {editingId === app.id ? (
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                          <input
                            type="text"
                            name="company"
                            value={editFormData.company}
                            onChange={handleEditChange}
                            style={{
                              padding: '12px 16px',
                              border: '2px solid #00d4ff',
                              borderRadius: '8px',
                              outline: 'none',
                              background: '#f0f4ff',
                              fontSize: '14px',
                              fontFamily: 'inherit'
                            }}
                          />
                          <input
                            type="text"
                            name="position"
                            value={editFormData.position}
                            onChange={handleEditChange}
                            style={{
                              padding: '12px 16px',
                              border: '2px solid #00d4ff',
                              borderRadius: '8px',
                              outline: 'none',
                              background: '#f0f4ff',
                              fontSize: '14px',
                              fontFamily: 'inherit'
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                          <input
                            type="date"
                            name="date"
                            value={editFormData.date}
                            onChange={handleEditChange}
                            style={{
                              padding: '12px 16px',
                              border: '2px solid #00d4ff',
                              borderRadius: '8px',
                              outline: 'none',
                              background: '#f0f4ff',
                              fontSize: '14px',
                              fontFamily: 'inherit'
                            }}
                          />
                          <select
                            name="status"
                            value={editFormData.status}
                            onChange={handleEditChange}
                            style={{
                              padding: '12px 16px',
                              border: '2px solid #00d4ff',
                              borderRadius: '8px',
                              outline: 'none',
                              background: '#f0f4ff',
                              fontSize: '14px',
                              fontFamily: 'inherit'
                            }}
                          >
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <textarea
                          name="notes"
                          value={editFormData.notes}
                          onChange={handleEditChange}
                          rows="3"
                          style={{
                            padding: '12px 16px',
                            border: '2px solid #00d4ff',
                            borderRadius: '8px',
                            outline: 'none',
                            background: '#f0f4ff',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            width: '100%',
                            marginBottom: '16px',
                            boxSizing: 'border-box'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => saveEdit(app.id)}
                            style={{
                              background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
                              color: 'white',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              border: 'none',
                              fontWeight: '600',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{
                              background: '#e5e7eb',
                              color: '#374151',
                              padding: '10px 20px',
                              borderRadius: '8px',
                              border: 'none',
                              fontWeight: '600',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#d1d5db'}
                            onMouseLeave={(e) => e.target.style.background = '#e5e7eb'}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: '16px' }}>
                          <div style={{
                            background: statusColors[app.status].bg,
                            padding: '12px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '48px',
                            height: '48px',
                            flexShrink: 0
                          }}>
                            <StatusIcon size={24} color={statusColors[app.status].text} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <h3 style={{ 
                              fontSize: '18px', 
                              fontWeight: '600', 
                              color: '#333',
                              margin: 0
                            }}>
                              {app.position}
                            </h3>
                            <p style={{ color: '#666', margin: '4px 0 0 0' }}>
                              {app.company}
                            </p>
                            <p style={{ fontSize: '14px', color: '#999', margin: '6px 0 0 0' }}>
                              Applied: {new Date(app.date).toLocaleDateString()}
                            </p>
                            {app.notes && <p style={{ fontSize: '14px', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
                              📝 {app.notes}
                            </p>}
                          </div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          flexShrink: 0
                        }}>
                          <button
                            onClick={() => startEdit(app)}
                            style={{
                              color: '#0369a1',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '8px',
                              transition: 'all 0.2s',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.2)';
                              e.target.style.color = '#0099ff';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.color = '#0369a1';
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deleteApplication(app.id)}
                            style={{
                              color: '#ef4444',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '8px',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.3) rotate(10deg)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1) rotate(0deg)';
                            }}
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD PAGE
  return (
    <div style={backgroundStyle}>
      {decorativePattern}
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          alignItems: window.innerWidth < 768 ? 'flex-start' : 'center', 
          justifyContent: 'space-between', 
          marginBottom: '32px',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '12px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <Briefcase size={28} color="white" />
              </div>
              <h1 style={{ 
                fontSize: 'clamp(24px, 6vw, 36px)', 
                fontWeight: 'bold', 
                color: 'white', 
                margin: 0
              }}>
                Job Application Tracker
              </h1>
            </div>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '16px',
              marginLeft: '52px',
              margin: 0
            }}>
              {currentUser.email}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                generateShareLink();
              }}
              style={{
                background: 'white',
                color: '#0099ff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
              }}
            >
              <Share2 size={18} /> Share
            </button>
            <button
              onClick={() => setCurrentPage('add')}
              style={{
                background: 'white',
                color: '#0099ff',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
              }}
            >
              <Plus size={18} /> Add Application
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {shareLink && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: '#333', marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
              Share Your Tracking
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={shareLink}
                readOnly
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: '#f9fafb'
                }}
              />
              <button
                onClick={copyToClipboard}
                style={{
                  background: copied ? '#15803d' : '#0099ff',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s'
                }}
              >
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
              </button>
            </div>
            <p style={{ color: '#666', fontSize: '12px', marginTop: '12px', margin: '12px 0 0 0' }}>
              Anyone with this link can view your job tracking dashboard
            </p>
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 640 ? '1fr 1fr' : window.innerWidth < 1024 ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', 
          gap: '16px', 
          marginBottom: '32px' 
        }}>
          {[
            { label: 'Total Applied', count: stats.total, icon: Briefcase, color: '#0099ff', status: null },
            { label: 'Pending Review', count: stats.applied, icon: Clock, color: '#0369a1', status: 'Applied' },
            { label: 'Interviews', count: stats.interviews, icon: Calendar, color: '#7e22ce', status: 'Interview Scheduled' },
            { label: 'Offers', count: stats.offers, icon: TrendingUp, color: '#15803d', status: 'Offer Received' },
            { label: 'Rejected', count: stats.rejected, icon: AlertCircle, color: '#b91c1c', status: 'Rejected' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} 
                onClick={() => {
                  setSelectedStatus(stat.status);
                  setCurrentPage('list');
                }}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px', 
                  padding: '24px', 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  opacity: 0.1
                }}>
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