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
  ExternalLink,
  Diamond
} from 'lucide-react';
import './AccountPage.css';
import logo from '../../assets/logo.svg';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function AccountPage({ user, onProfileUpdate, onLogout, onBackToMain }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'edit', 'password', 'notifications', 'sessions'
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [picture, setPicture] = useState(user?.profile_picture && !user.profile_picture.includes('googleusercontent.com') ? user.profile_picture : '');
  const [profileImgError, setProfileImgError] = useState(false);
  const [pictureImgError, setPictureImgError] = useState(false);

  useEffect(() => {
    setProfileImgError(false);
  }, [user?.profile_picture]);

  useEffect(() => {
    setPictureImgError(false);
  }, [picture]);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const settingCategories = [
    {
      title: 'Account',
      items: [
        { label: 'Edit personal info', icon: User, action: () => setActiveTab('edit') },
        { label: 'Recover playlists', icon: RotateCcw, action: () => triggerMockToast('Recover playlists') },
        { label: 'Address', icon: MapPin, action: () => triggerMockToast('Address') }
      ]
    },
    {
      title: 'Subscription',
      items: [
        { label: 'Manage your subscription', icon: CreditCard, action: () => triggerMockToast('Manage your subscription') },
        { label: 'Manage members', icon: Users, action: () => triggerMockToast('Manage members') },
        { label: 'Cancel subscription', icon: XCircle, action: () => triggerMockToast('Cancel subscription') }
      ]
    },
    {
      title: 'Payment',
      items: [
        { label: 'Payment history', icon: FileText, action: () => triggerMockToast('Payment history') }
      ]
    },
    {
      title: 'Security and privacy',
      items: [
        { label: 'Manage apps', icon: Grid, action: () => triggerMockToast('Manage apps') },
        { label: 'Notification settings', icon: Bell, action: () => setActiveTab('notifications') },
        { label: 'Account privacy', icon: Eye, action: () => triggerMockToast('Account privacy') },
        { label: 'Edit login methods', icon: Key, action: () => triggerMockToast('Edit login methods') },
        { label: 'Set device password', icon: Lock, action: () => setActiveTab('password') },
        { label: 'Delete account', icon: Trash2, action: () => triggerMockToast('Delete account') },
        { label: 'Sign out everywhere (Sessions)', icon: LogOut, action: () => setActiveTab('sessions') }
      ]
    },
    {
      title: 'Advertising',
      items: [
        { label: 'Ad preferences', icon: Sliders, action: () => triggerMockToast('Ad preferences') }
      ]
    },
    {
      title: 'Help',
      items: [
        { label: 'ECHORD support', icon: HelpCircle, action: () => triggerMockToast('ECHORD support') }
      ]
    }
  ];

  const helpArticles = [
    { title: "How to change your account password", content: "Navigate to Security and privacy > Set device password. Enter your current password and choose a new secure password." },
    { title: "Updating your display name, email, or phone number", content: "Go to Account > Edit personal info to modify your profile picture, display name, email address, or phone number." },
    { title: "Managing active devices and sessions", content: "Under Security and privacy, choose Sign out everywhere (Sessions) to view, configure inactivity logout timeout, or log out of individual devices." },
    { title: "Canceling your Premium plan subscription", content: "Navigate to Subscription > Cancel subscription to cancel your subscription and transition to a free plan." },
    { title: "Recovering recently deleted playlists", content: "Go to Account > Recover playlists to find and restore deleted playlists." },
    { title: "Updating your account billing address", content: "Go to Account > Address to update your billing details and address information." }
  ];

  const filteredCategories = settingCategories.map(cat => {
    const titleMatches = cat.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchedItems = cat.items.filter(item => 
      titleMatches || item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, items: matchedItems };
  }).filter(cat => cat.items.length > 0);

  const filteredArticles = searchQuery.trim() 
    ? helpArticles.filter(art => 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        art.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
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

      {/* Echord Top Header */}
      <header className="echord-account-header">
        <div className="header-inner">
          <div className="echord-logo-clickable" onClick={onBackToMain} style={{ cursor: 'pointer' }}>
            <img src={logo} alt="ECHORD Logo" style={{ width: '36px', height: '36px' }} />
            <span className="logo-text">E C H O R D</span>
          </div>

          <nav className="header-nav-links">
            <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Download'); }}>Download</a>
            <span className="divider">|</span>
            <div className="header-profile-dropdown" onClick={onBackToMain} style={{ cursor: 'pointer' }}>
              <div className="header-avatar-circle profile-default-avatar">
                {user?.profile_picture && !user.profile_picture.includes('googleusercontent.com') && !profileImgError ? (
                  <img 
                    src={user.profile_picture} 
                    alt="Avatar" 
                    className="header-avatar-img" 
                    onError={() => setProfileImgError(true)}
                  />
                ) : (
                  <span className="profile-letter-avatar">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <span className="profile-name">{user?.name || 'Username'}</span>
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="clear-search-btn"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Show Plan Section and categories only if we aren't searching support articles specifically or if we have settings matches */}
            {(!searchQuery || filteredCategories.length > 0) && (
              <>
                {/* Plan Section */}
                <div className="plan-overview-container">
                  {/* Free Plan Card */}
                  <div className="free-plan-card">
                    <div className="plan-card-header">
                      <span className="plan-badge-grey">Your plan</span>
                    </div>
                    <div className="free-plan-card-body">
                      <div className="plan-logo-and-title">
                        <img src={logo} alt="Echord Logo" style={{ width: '24px', height: '24px' }} />
                        <h2 className="plan-title-free">Echord Free</h2>
                      </div>
                      <button className="explore-plans-btn" onClick={() => triggerMockToast('Explore plans')}>
                        Explore plans
                      </button>
                    </div>
                  </div>

                  {/* Join Premium Card */}
                  <div className="join-premium-card" onClick={() => triggerMockToast('Join Premium')}>
                    <div className="join-premium-content">
                      <Diamond size={28} className="premium-diamond-icon" />
                      <span className="join-premium-text">Join Premium</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Account settings categorized lists */}
            <div className="account-settings-categories">
              {filteredCategories.map((cat, catIdx) => (
                <div key={catIdx} className="setting-category-block">
                  <h3>{cat.title}</h3>
                  <div className="setting-rows-list">
                    {cat.items.map((item, itemIdx) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={itemIdx} className="setting-row-item" onClick={item.action}>
                          <div className="row-left">
                            <IconComponent className="row-icon" size={20} />
                            <span className="row-label">{item.label}</span>
                          </div>
                          <ChevronRight className="row-chevron" size={20} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Help Articles Section */}
            {searchQuery && filteredArticles.length > 0 && (
              <div className="help-articles-section">
                <h3>Matching Help Articles</h3>
                <div className="help-articles-list">
                  {filteredArticles.map((art, idx) => (
                    <div key={idx} className="help-article-item">
                      <h4>{art.title}</h4>
                      <p>{art.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results placeholder */}
            {searchQuery && filteredCategories.length === 0 && filteredArticles.length === 0 && (
              <div className="search-no-results">
                <p>No settings or help articles found matching "<strong>{searchQuery}</strong>"</p>
                <button className="clear-search-btn-large" onClick={() => setSearchQuery('')}>
                  Clear search
                </button>
              </div>
            )}

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
                      {!pictureImgError ? (
                        <img 
                          src={picture} 
                          alt="Upload Preview" 
                          onError={() => setPictureImgError(true)}
                        />
                      ) : (
                        <div className="profile-upload-preview-fallback" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#282828', border: '1px solid #404040' }}>
                          <User size={32} color="#aaa" />
                          <span style={{ fontSize: '10px', color: '#aaa', marginTop: '4px', textAlign: 'center' }}>Error</span>
                        </div>
                      )}
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
                  <LogOut size={16} />
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
                  Choose how long your account can remain unused before your session automatically expires (minimum 15 seconds, maximum 365 days).
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
                      <th>DEVICE & IP</th>
                      <th>FIRST LOGGED IN</th>
                      <th>LAST ACTIVE</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className={s.is_current ? 'current-row' : ''}>
                        <td>
                          <div className="device-cell">
                            <Monitor size={18} className="device-icon" />
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
                            <span className="current-badge">
                              <span className="status-dot green-dot"></span>
                              Current Device
                            </span>
                          ) : (
                            <span className="active-status-badge">
                              <span className="status-dot blue-dot"></span>
                              Active
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className={`revoke-btn ${s.is_current ? 'end-session-btn' : 'logout-device-btn'}`}
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

      {/* Echord Footer */}
      <footer className="echord-account-footer">
        <div className="footer-top">
          <div className="footer-logo-col">
            <div className="footer-logo" onClick={onBackToMain} style={{ cursor: 'pointer' }}>
              <img src="/logo.svg" alt="ECHORD Logo" style={{ width: '32px', height: '32px' }} />
              <span>ECHORD</span>
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
              <h4>ECHORD Plans</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Premium Standard'); }}>Premium Standard</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Premium Platinum'); }}>Premium Platinum</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('Premium Student'); }}>Premium Student</a>
              <a href="#" onClick={(e) => { e.preventDefault(); triggerMockToast('ECHORD Free'); }}>ECHORD Free</a>
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
            <p className="copyright">&copy; {new Date().getFullYear()} ECHORD AB</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AccountPage;
