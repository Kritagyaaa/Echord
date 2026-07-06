import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Key, 
  Bell, 
  Monitor, 
  ChevronRight, 
  Search, 
  RotateCcw, 
  MapPin, 
  CreditCard, 
  Users, 
  XCircle, 
  FileText, 
  Grid, 
  Lock, 
  Eye, 
  Trash2, 
  LogOut, 
  Sliders, 
  HelpCircle, 
  Globe,
  ExternalLink
} from 'lucide-react';
import './AccountPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function AccountPage({ user, onProfileUpdate, onLogout, onBackToMain }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'edit', 'password', 'notifications', 'sessions'
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [picture, setPicture] = useState(user?.profile_picture && !user.profile_picture.includes('googleusercontent.com') ? user.profile_picture : '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem(`notifications_${user?.id}`);
    return saved ? JSON.parse(saved) : {
      news: true,
      concerts: false,
      playlists: true,
      security: true
    };
  });

  const [sessions, setSessions] = useState([]);
  const [sessionTimeoutSeconds, setSessionTimeoutSeconds] = useState(604800);
  const [customValue, setCustomValue] = useState('15');
  const [customUnit, setCustomUnit] = useState('seconds');
  const [timeoutMessage, setTimeoutMessage] = useState('');
  const [timeoutError, setTimeoutError] = useState('');
  const [updatingTimeout, setUpdatingTimeout] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/user/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch sessions');
      setSessions(data.sessions || []);
      if (data.session_timeout_seconds) {
        setSessionTimeoutSeconds(data.session_timeout_seconds);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTimeoutLabel = (seconds) => {
    const secs = Number(seconds);
    if (!secs || secs <= 0) return '7 Days';
    if (secs < 60) return `${secs} Second${secs === 1 ? '' : 's'}`;
    if (secs < 3600) {
      const mins = Math.floor(secs / 60);
      const remSecs = secs % 60;
      return `${mins} Minute${mins === 1 ? '' : 's'}${remSecs ? ` ${remSecs}s` : ''}`;
    }
    if (secs < 86400) {
      const hrs = Math.floor(secs / 3600);
      const remMins = Math.floor((secs % 3600) / 60);
      return `${hrs} Hour${hrs === 1 ? '' : 's'}${remMins ? ` ${remMins}m` : ''}`;
    }
    const days = Math.floor(secs / 86400);
    const remHrs = Math.floor((secs % 86400) / 3600);
    return `${days} Day${days === 1 ? '' : 's'}${remHrs ? ` ${remHrs}h` : ''}`;
  };

  const handleSaveSessionTimeout = async (seconds) => {
    setUpdatingTimeout(true);
    setTimeoutError('');
    setTimeoutMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/user/session-timeout`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ session_timeout_seconds: seconds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update session timeout');
      setSessionTimeoutSeconds(seconds);
      setTimeoutMessage('Session inactivity timeout updated successfully.');
    } catch (err) {
      setTimeoutError(err.message);
    } finally {
      setUpdatingTimeout(false);
    }
  };

  const handleCustomTimeoutSubmit = (e) => {
    e.preventDefault();
    setTimeoutError('');
    setTimeoutMessage('');
    const val = parseInt(customValue);
    if (isNaN(val) || val <= 0) {
      setTimeoutError('Please enter a valid positive number.');
      return;
    }
    let multiplier = 1;
    if (customUnit === 'minutes') multiplier = 60;
    if (customUnit === 'hours') multiplier = 3600;
    if (customUnit === 'days') multiplier = 86400;

    const totalSeconds = val * multiplier;
    handleSaveSessionTimeout(totalSeconds);
  };

  const [showMockToast, setShowMockToast] = useState(false);
  const [mockToastMessage, setMockToastMessage] = useState('');

  const triggerMockToast = (featureName) => {
    setMockToastMessage(`"${featureName}" is a mock setting in this clone!`);
    setShowMockToast(true);
    setTimeout(() => setShowMockToast(false), 3000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file is too large (max 2MB).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and Email are required.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone_number: phone, profile_picture: picture }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile update failed.');
      onProfileUpdate?.(data.user);
      setMessage('Profile updated successfully!');
      setActiveTab('overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/user/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');
      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotification = (key) => {
    const updated = { ...notificationSettings, [key]: !notificationSettings[key] };
    setNotificationSettings(updated);
    localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updated));
    setMessage('Notification settings saved.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRevokeSession = async (sessionId, isCurrent) => {
    const confirmMsg = isCurrent 
      ? 'Are you sure you want to end your CURRENT session? This will immediately log you out of the application.'
      : 'Are you sure you want to terminate this remote session?';
      
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/user/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke session');
      
      if (isCurrent) {
        onLogout?.();
      } else {
        setMessage('Session terminated successfully.');
        fetchSessions();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevokeAllSessions = async () => {
    const confirmMsg = 'Are you sure you want to log out of ALL devices and sessions? This will immediately log you out of this device as well.';
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/user/sessions`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke all sessions');
      
      onLogout?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="account-container-new">
      {/* Mock Toast */}
      {showMockToast && (
        <div className="mock-toast">
          {mockToastMessage}
        </div>
      )}

      {/* Spotify Top Header */}
      <header className="spotify-account-header">
        <div className="header-inner">
          <div className="spotify-logo-clickable" onClick={onBackToMain} style={{ cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" style={{ width: '36px', height: '36px', fill: '#1db954' }}>
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.67-.138-.747-.473-.075-.335.138-.67.473-.746 3.854-.88 7.148-.507 9.82 1.13.295.18.387.563.207.864zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.185-.412.125-.845-.107-.97-.52-.125-.413.108-.847.52-.972 3.666-1.11 8.24-.564 11.34 1.345.367.228.487.708.26 1.072zm.105-2.833C14.383 8.8 8.44 8.604 5.01 9.645c-.53.16-1.09-.142-1.25-.67-.16-.53.14-1.09.67-1.25 3.96-1.202 10.51-.976 14.59 1.45.476.282.63.896.347 1.373-.28.477-.895.63-1.373.348z" />
            </svg>
            <span className="logo-text">Spotify</span>
          </div>

          <nav className="header-nav-links">
            <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Premium plans'); }}>Premium plans</a>
            <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Support'); }}>Support</a>
            <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Download'); }}>Download</a>
            <span className="divider">|</span>
            <div className="header-profile-dropdown" onClick={onBackToMain} style={{ cursor: 'pointer' }}>
              <div className="header-avatar-circle">
                {user?.profile_picture && !user.profile_picture.includes('googleusercontent.com') ? (
                  <img src={user.profile_picture} alt="Avatar" className="header-avatar-img" />
                ) : (
                  <User size={16} />
                )}
              </div>
              <span className="profile-name">Profile ∨</span>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="account-main-layout">
        
        {/* Dynamic sub-view header when not in overview */}
        {activeTab !== 'overview' && (
          <div className="sub-view-back-container">
            <button className="back-to-overview-btn" onClick={() => { setActiveTab('overview'); setError(''); setMessage(''); }}>
              <ArrowLeft size={16} />
              Back to Account Overview
            </button>
          </div>
        )}

        {error && <div className="feedback-message error-msg global-feedback">{error}</div>}
        {message && <div className="feedback-message success-msg global-feedback">{message}</div>}

        {/* Tab 1: Account Overview */}
        {activeTab === 'overview' && (
          <div className="account-overview-view">
            
            {/* Search Bar */}
            <div className="search-section">
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search account or help articles" 
                  onClick={() => triggerMockToast('Account search')}
                  readOnly
                />
              </div>
            </div>

            {/* Plan Section */}
            <div className="plan-section-card">
              <div className="plan-card-header">
                <span className="plan-badge-green">Your plan</span>
              </div>
              <div className="plan-card-body">
                <div className="plan-details-left">
                  <div className="plan-icon-logo">
                    <svg viewBox="0 0 24 24" style={{ width: '40px', height: '40px', fill: '#1db954' }}>
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.67-.138-.747-.473-.075-.335.138-.67.473-.746 3.854-.88 7.148-.507 9.82 1.13.295.18.387.563.207.864zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.185-.412.125-.845-.107-.97-.52-.125-.413.108-.847.52-.972 3.666-1.11 8.24-.564 11.34 1.345.367.228.487.708.26 1.072zm.105-2.833C14.383 8.8 8.44 8.604 5.01 9.645c-.53.16-1.09-.142-1.25-.67-.16-.53.14-1.09.67-1.25 3.96-1.202 10.51-.976 14.59 1.45.476.282.63.896.347 1.373-.28.477-.895.63-1.373.348z" />
                    </svg>
                    <span className="plan-name-spotify">Premium</span>
                  </div>
                  <h2 className="plan-family-title">Family</h2>
                  <p className="plan-family-desc">You're a member of a Family plan.</p>
                </div>
                <div className="plan-members-right">
                  <div className="family-members-stack">
                    <div className="member-avatar" style={{ backgroundColor: '#1db954', zIndex: 6 }}>👩</div>
                    <div className="member-avatar" style={{ backgroundColor: '#4a90e2', zIndex: 5 }}>🧑</div>
                    <div className="member-avatar" style={{ backgroundColor: '#f5a623', zIndex: 4 }}>👧</div>
                    <div className="member-avatar" style={{ backgroundColor: '#e28490', zIndex: 3 }}>🧒</div>
                    <div className="member-avatar" style={{ backgroundColor: '#9b59b6', zIndex: 2 }}>👶</div>
                    <div className="member-avatar" style={{ backgroundColor: '#1abc9c', zIndex: 1 }}>👵</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account settings categorized lists */}
            <div className="account-settings-categories">
              
              {/* Category: Account */}
              <div className="setting-category-block">
                <h3>Account</h3>
                <div className="setting-rows-list">
                  <div className="setting-row-item" onClick={() => setActiveTab('edit')}>
                    <div className="row-left">
                      <User className="row-icon" size={20} />
                      <span className="row-label">Edit personal info</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                  <div className="setting-row-item" onClick={() => triggerMockToast('Recover playlists')}>
                    <div className="row-left">
                      <RotateCcw className="row-icon" size={20} />
                      <span className="row-label">Recover playlists</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                  <div className="setting-row-item" onClick={() => triggerMockToast('Address')}>
                    <div className="row-left">
                      <MapPin className="row-icon" size={20} />
                      <span className="row-label">Address</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                </div>
              </div>

              {/* Category: Subscription */}
              <div className="setting-category-block">
                <h3>Subscription</h3>
                <div className="setting-rows-list">
                  <div className="setting-row-item" onClick={() => triggerMockToast('Manage your subscription')}>
                    <div className="row-left">
                      <CreditCard className="row-icon" size={20} />
                      <span className="row-label">Manage your subscription</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                  <div className="setting-row-item" onClick={() => triggerMockToast('Manage members')}>
                    <div className="row-left">
                      <Users className="row-icon" size={20} />
                      <span className="row-label">Manage members</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                  <div className="setting-row-item" onClick={() => triggerMockToast('Cancel subscription')}>
                    <div className="row-left">
                      <XCircle className="row-icon" size={20} />
                      <span className="row-label">Cancel subscription</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                </div>
              </div>

              {/* Category: Payment */}
              <div className="setting-category-block">
                <h3>Payment</h3>
                <div className="setting-rows-list">
                  <div className="setting-row-item" onClick={() => triggerMockToast('Payment history')}>
                    <div className="row-left">
                      <FileText className="row-icon" size={20} />
                      <span className="row-label">Payment history</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                </div>
              </div>

              {/* Category: Security and privacy */}
              <div className="setting-category-block">
                <h3>Security and privacy</h3>
                <div className="setting-rows-list">
                  <div className="setting-row-item" onClick={() => triggerMockToast('Manage apps')}>
                    <div className="row-left">
                      <Grid className="row-icon" size={20} />
                      <span className="row-label">Manage apps</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                  <div className="setting-row-item" onClick={() => setActiveTab('notifications')}>
                    <div className="row-left">
                      <Bell className="row-icon" size={20} />
                      <span className="row-label">Notification settings</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                  <div className="setting-row-item" onClick={() => triggerMockToast('Account privacy')}>
                    <div className="row-left">
                      <Eye className="row-icon" size={20} />
                      <span className="row-label">Account privacy</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                  <div className="setting-row-item" onClick={() => triggerMockToast('Edit login methods')}>
                    <div className="row-left">
                      <Key className="row-icon" size={20} />
                      <span className="row-label">Edit login methods</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                  <div className="setting-row-item" onClick={() => setActiveTab('password')}>
                    <div className="row-left">
                      <Lock className="row-icon" size={20} />
                      <span className="row-label">Set device password</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                  <div className="setting-row-item" onClick={() => triggerMockToast('Delete account')}>
                    <div className="row-left">
                      <Trash2 className="row-icon" size={20} />
                      <span className="row-label">Delete account</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                  <div className="setting-row-item" onClick={() => setActiveTab('sessions')}>
                    <div className="row-left">
                      <LogOut className="row-icon" size={20} />
                      <span className="row-label">Sign out everywhere (Sessions)</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                </div>
              </div>

              {/* Category: Advertising */}
              <div className="setting-category-block">
                <h3>Advertising</h3>
                <div className="setting-rows-list">
                  <div className="setting-row-item" onClick={() => triggerMockToast('Ad preferences')}>
                    <div className="row-left">
                      <Sliders className="row-icon" size={20} />
                      <span className="row-label">Ad preferences</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                </div>
              </div>

              {/* Category: Help */}
              <div className="setting-category-block">
                <h3>Help</h3>
                <div className="setting-rows-list">
                  <div className="setting-row-item" onClick={() => triggerMockToast('Spotify support')}>
                    <div className="row-left">
                      <HelpCircle className="row-icon" size={20} />
                      <span className="row-label">Spotify support</span>
                    </div>
                    <ChevronRight className="row-chevron" size={20} />
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Edit Profile */}
        {activeTab === 'edit' && (
          <div className="account-pane sub-view-card">
            <h2>Edit Personal Details</h2>
            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+1234567890"
                />
              </div>

              <div className="form-group">
                <label>Profile Picture</label>
                <div className="profile-upload-container">
                  {picture && (
                    <div className="profile-upload-preview">
                      <img src={picture} alt="Upload Preview" />
                      <button 
                        type="button" 
                        className="remove-preview-btn" 
                        onClick={() => setPicture('')}
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="file-input"
                    id="profile-pic-upload"
                  />
                  <label htmlFor="profile-pic-upload" className="file-input-label">
                    {picture ? 'Change Image' : 'Choose Image'}
                  </label>
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => { setActiveTab('overview'); setError(''); setMessage(''); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Change Password */}
        {activeTab === 'password' && (
          <div className="account-pane sub-view-card">
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => { setActiveTab('overview'); setError(''); setMessage(''); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === 'notifications' && (
          <div className="account-pane sub-view-card">
            <h2>Notification Settings</h2>
            <p className="section-description">Choose how you want to stay updated on Meowsick announcements and alerts.</p>
            
            <div className="notification-list">
              <div className="notification-item">
                <div className="notification-info">
                  <h4>Product and Feature Updates</h4>
                  <p>Get tips and stay informed on new features added to the streaming web app.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="switch-checkbox"
                  checked={notificationSettings.news}
                  onChange={() => handleToggleNotification('news')}
                />
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Recommended Concerts & Tours</h4>
                  <p>Get notified about upcoming events for artists you listen to regularly.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="switch-checkbox"
                  checked={notificationSettings.concerts}
                  onChange={() => handleToggleNotification('concerts')}
                />
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Playlists & Releases</h4>
                  <p>Receive updates when your playlists receive new songs or artists drop new songs.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="switch-checkbox"
                  checked={notificationSettings.playlists}
                  onChange={() => handleToggleNotification('playlists')}
                />
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Security Warnings</h4>
                  <p>Get important alerts regarding account sign-ins, resets, and login attempts.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="switch-checkbox"
                  checked={notificationSettings.security}
                  onChange={() => handleToggleNotification('security')}
                />
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <button className="cancel-btn" onClick={() => { setActiveTab('overview'); setError(''); setMessage(''); }}>Back</button>
            </div>
          </div>
        )}

        {/* Tab 5: Session Management */}
        {activeTab === 'sessions' && (
          <div className="account-pane sub-view-card">
            <div className="sessions-header-row">
              <div>
                <h2>Session Management / Sign out everywhere</h2>
                <p className="section-description">
                  Track all device connections and set how long an account can remain idle before automatically timing out.
                </p>
              </div>
              {sessions.length > 0 && (
                <button className="revoke-all-btn" onClick={handleRevokeAllSessions}>
                  Log Out of All Devices
                </button>
              )}
            </div>

            {/* Inactivity Timeout Config Card */}
            <div className="timeout-config-card">
              <div className="timeout-config-info">
                <div className="timeout-title-row">
                  <h3>Automatic Inactivity Logout Timeout</h3>
                  <span className="active-timeout-pill">
                    Current Setting: {formatTimeoutLabel(sessionTimeoutSeconds)}
                  </span>
                </div>
                <p>
                  Choose how long your account can remain unused before your session automatically expires (minimum 15 seconds, maximum 7 days).
                </p>
              </div>

              {timeoutError && <div className="card-feedback card-error-msg">{timeoutError}</div>}
              {timeoutMessage && <div className="card-feedback card-success-msg">{timeoutMessage}</div>}

              <div className="timeout-presets">
                {[
                  { label: '15 Sec', value: 15 },
                  { label: '1 Min', value: 60 },
                  { label: '1 Hour', value: 3600 },
                  { label: '1 Day', value: 86400 },
                  { label: '7 Days', value: 604800 }
                ].map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    className={`timeout-preset-btn ${sessionTimeoutSeconds === preset.value ? 'active' : ''}`}
                    onClick={() => handleSaveSessionTimeout(preset.value)}
                    disabled={updatingTimeout}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCustomTimeoutSubmit} className="custom-timeout-row">
                <label htmlFor="customValue">Custom duration:</label>
                <input
                  id="customValue"
                  type="number"
                  min="1"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="timeout-input"
                  placeholder="e.g. 15"
                  required
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="timeout-unit-select"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
                <button
                  type="submit"
                  className="save-timeout-btn"
                  disabled={updatingTimeout}
                >
                  {updatingTimeout ? 'Saving...' : 'Save Timeout'}
                </button>
              </form>
            </div>

            {/* Active Sessions Table */}
            <div className="sessions-table-container">
              <h3>Active Device Sessions</h3>
              <p className="table-subtitle">
                View all devices currently logged into your account. Click "End Session" on any device to log out that session.
              </p>

              {sessions.length === 0 ? (
                <p style={{ color: '#b3b3b3', marginTop: '12px' }}>No active sessions found.</p>
              ) : (
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>Device & IP</th>
                      <th>First Logged In</th>
                      <th>Last Active</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className={s.is_current ? 'current-row' : ''}>
                        <td>
                          <div className="device-cell">
                            <Monitor size={18} color={s.is_current ? "#1db954" : "#b3b3b3"} />
                            <div>
                              <div className="device-name">{s.device_info}</div>
                              <div className="device-ip">{s.ip_address}</div>
                            </div>
                          </div>
                        </td>
                        <td>{new Date(s.created_at).toLocaleString()}</td>
                        <td>{s.last_used_at ? new Date(s.last_used_at).toLocaleString() : 'Just now'}</td>
                        <td>
                          {s.is_current ? (
                            <span className="current-badge">Current Device</span>
                          ) : (
                            <span className="active-status-badge">Active</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="revoke-btn"
                            onClick={() => handleRevokeSession(s.id, s.is_current)}
                          >
                            {s.is_current ? 'End Session' : 'Log Out Device'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ marginTop: '24px' }}>
              <button className="cancel-btn" onClick={() => { setActiveTab('overview'); setError(''); setMessage(''); }}>Back</button>
            </div>
          </div>
        )}

      </div>

      {/* Spotify Footer */}
      <footer className="spotify-account-footer">
        <div className="footer-top">
          <div className="footer-logo-col">
            <div className="footer-logo">
              <svg viewBox="0 0 24 24" style={{ width: '32px', height: '32px', fill: 'white' }}>
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.67-.138-.747-.473-.075-.335.138-.67.473-.746 3.854-.88 7.148-.507 9.82 1.13.295.18.387.563.207.864zm1.225-2.72c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.185-.412.125-.845-.107-.97-.52-.125-.413.108-.847.52-.972 3.666-1.11 8.24-.564 11.34 1.345.367.228.487.708.26 1.072zm.105-2.833C14.383 8.8 8.44 8.604 5.01 9.645c-.53.16-1.09-.142-1.25-.67-.16-.53.14-1.09.67-1.25 3.96-1.202 10.51-.976 14.59 1.45.476.282.63.896.347 1.373-.28.477-.895.63-1.373.348z" />
              </svg>
              <span>Spotify</span>
            </div>
          </div>
          
          <div className="footer-links-cols">
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('About'); }}>About</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Jobs'); }}>Jobs</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('For the Record'); }}>For the Record</a>
            </div>
            <div className="footer-col">
              <h4>Communities</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('For Artists'); }}>For Artists</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Developers'); }}>Developers</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Advertising'); }}>Advertising</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Investors'); }}>Investors</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Vendors'); }}>Vendors</a>
            </div>
            <div className="footer-col">
              <h4>Useful links</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Support'); }}>Support</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Web Player'); }}>Web Player</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Free Mobile App'); }}>Free Mobile App</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Import your music'); }}>Import your music</a>
            </div>
            <div className="footer-col">
              <h4>Spotify Plans</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Premium Standard'); }}>Premium Standard</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Premium Family'); }}>Premium Family</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Premium Student'); }}>Premium Student</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Spotify Free'); }}>Spotify Free</a>
            </div>
          </div>

          <div className="footer-social-col">
            <a href="#" className="social-icon-btn" onClick={(e) => { e.preventDefault(); triggerMockToast('Instagram'); }}>
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'white' }}>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a href="#" className="social-icon-btn" onClick={(e) => { e.preventDefault(); triggerMockToast('Twitter / X'); }}>
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'white' }}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="social-icon-btn" onClick={(e) => { e.preventDefault(); triggerMockToast('Facebook'); }}>
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'white' }}>
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
              </svg>
            </a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Legal'); }}>Legal</a>
            <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Safety & Privacy'); }}>Safety & Privacy Center</a>
            <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Privacy Policy'); }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Cookies'); }}>Cookies</a>
            <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('About Ads'); }}>About Ads</a>
            <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Accessibility'); }}>Accessibility</a>
          </div>
          <div className="footer-bottom-right">
            <div className="country-selector" onClick={() => triggerMockToast('Country Selector')}>
              <Globe size={16} />
              <span>India (English)</span>
            </div>
            <p className="copyright">&copy; {new Date().getFullYear()} Spotify AB</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AccountPage;
