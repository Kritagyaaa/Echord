import { useState, useEffect } from 'react';
import { ArrowLeft, User, Shield, Key, Bell, Monitor } from 'lucide-react';
import './AccountPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function AccountPage({ user, onProfileUpdate, onLogout, onBackToMain }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'edit', 'password', 'notifications', 'sessions'
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [picture, setPicture] = useState(user?.profile_picture || '');
  
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

  const handleSaveSessionTimeout = async (targetSeconds) => {
    const seconds = Number(targetSeconds);
    if (isNaN(seconds) || seconds < 15) {
      setTimeoutError('Minimum inactivity timeout is 15 seconds.');
      return;
    }
    if (seconds > 604800) {
      setTimeoutError('Maximum inactivity timeout is 7 days (604,800 seconds).');
      return;
    }

    try {
      setUpdatingTimeout(true);
      setTimeoutError('');
      setTimeoutMessage('');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/user/session-timeout`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ timeout_seconds: seconds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update session timeout.');
      setSessionTimeoutSeconds(seconds);
      setTimeoutMessage(`Inactivity timeout saved: ${formatTimeoutLabel(seconds)}`);
      setTimeout(() => setTimeoutMessage(''), 4000);
    } catch (err) {
      setTimeoutError(err.message);
    } finally {
      setUpdatingTimeout(false);
    }
  };

  const handleCustomTimeoutSubmit = (e) => {
    e.preventDefault();
    const val = Number(customValue);
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
    <div className="account-container">
      {/* Sidebar Navigation */}
      <div className="account-sidebar">
        <button className="back-btn" onClick={onBackToMain}>
          <ArrowLeft size={18} />
          Back to Music
        </button>

        <div className="sidebar-profile">
          <img 
            src={user?.profile_picture || "https://i.pinimg.com/736x/6c/41/cb/6c41cb3ae4d97eeb68ee2279fe0e0c6f.jpg"} 
            alt="User Avatar"
            className="sidebar-avatar" 
            referrerPolicy="no-referrer"
          />
          <h3>{user?.name}</h3>
          <p>{user?.role?.toUpperCase()}</p>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setError(''); setMessage(''); }}
          >
            <User size={18} />
            Account Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => { setActiveTab('edit'); setError(''); setMessage(''); }}
          >
            <Shield size={18} />
            Edit Profile
          </button>
          <button 
            className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => { setActiveTab('password'); setError(''); setMessage(''); }}
          >
            <Key size={18} />
            Change Password
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => { setActiveTab('notifications'); setError(''); setMessage(''); }}
          >
            <Bell size={18} />
            Notifications
          </button>
          <button 
            className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('sessions'); setError(''); setMessage(''); }}
          >
            <Monitor size={18} />
            Session Management
          </button>
        </nav>
      </div>

      {/* Main Content Pane */}
      <div className="account-main-content">
        {error && <div className="feedback-message error-msg">{error}</div>}
        {message && <div className="feedback-message success-msg">{message}</div>}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="account-pane">
            <h2>Account Overview</h2>

            {/* Plan Card */}
            <div className="plan-card">
              <div className="plan-badge">Your Plan</div>
              <h3>Premium Family</h3>
              <p>You're a member of a Family subscription plan. Ad-free, offline music, and on-demand streaming.</p>
              <div className="family-members">
                <span className="member-avatar">👩</span>
                <span className="member-avatar">🧑</span>
                <span className="member-avatar">👧</span>
                <span className="member-avatar">🧒</span>
              </div>
            </div>

            {/* Details Profile */}
            <div className="info-section">
              <h3>Profile Details</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Username / Name</span>
                  <span className="info-value">{user?.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone Number</span>
                  <span className="info-value">{user?.phone_number || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Role Account Type</span>
                  <span className="info-value" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
              </div>
              <button className="edit-profile-btn" onClick={() => setActiveTab('edit')}>
                Edit Profile Info
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Edit Profile */}
        {activeTab === 'edit' && (
          <div className="account-pane">
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
                <label>Profile Picture URL</label>
                <input 
                  type="url" 
                  value={picture} 
                  onChange={(e) => setPicture(e.target.value)} 
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setActiveTab('overview')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Change Password */}
        {activeTab === 'password' && (
          <div className="account-pane">
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
                <button type="button" className="cancel-btn" onClick={() => setActiveTab('overview')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === 'notifications' && (
          <div className="account-pane">
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
          </div>
        )}

        {/* Tab 5: Session Management */}
        {activeTab === 'sessions' && (
          <div className="account-pane">
            <div className="sessions-header-row">
              <div>
                <h2>Session Management</h2>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountPage;
