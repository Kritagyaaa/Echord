const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { JWT_SECRET } = require('./authMiddleware');

// Clean up old test data if exists
async function cleanup() {
  await pool.query("DELETE FROM users WHERE email = 'testuser@example.com'");
  await pool.query("DELETE FROM users WHERE email = 'resetuser@example.com'");
  await pool.query("DELETE FROM users WHERE email = 'dummygoogle@example.com'");
  await pool.query("DELETE FROM users WHERE email = 'verifyuser@example.com'");
  await pool.query("DELETE FROM users WHERE email = 'creatoruser@example.com'");
  await pool.query("DELETE FROM creators WHERE email = 'creatoruser@example.com'");
  await pool.query("DELETE FROM users WHERE email = 'sessionuser@example.com'");
}

async function runTests() {
  console.log('Starting Authentication Module Tests...\n');
  await cleanup();

  // Test 1: User Registration Hashing
  console.log('Test 1: User Registration Hashing');
  const password = 'mySecretPassword123';
  const hashedPassword = bcrypt.hashSync(password, 10);
  assert.ok(bcrypt.compareSync(password, hashedPassword), 'Password hashing compare should match original password');
  assert.notEqual(password, hashedPassword, 'Stored password should not be plain text');
  console.log('  -> PASS');

  // Test 2: Database Insertion for Registration
  console.log('Test 2: Database User Insertion');
  const [regResult] = await pool.query(
    "INSERT INTO users (name, email, phone_number, password, is_verified) VALUES (?, ?, ?, ?, 1)",
    ['Test User', 'testuser@example.com', '+1234567890', hashedPassword]
  );
  
  const userId = regResult.insertId;
  assert.ok(userId > 0, 'User ID should be auto-incremented positive integer');

  const [userRecords] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  const userRecord = userRecords[0];
  assert.equal(userRecord.name, 'Test User', 'Name should match inserted name');
  assert.equal(userRecord.email, 'testuser@example.com', 'Email should match inserted email');
  assert.equal(userRecord.phone_number, '+1234567890', 'Phone number should match inserted phone number');
  assert.equal(userRecord.role, 'user', 'Default role should be user');
  console.log('  -> PASS');

  // Test 3: JWT Token Creation
  console.log('Test 3: JWT Token Creation and Verification');
  const token = jwt.sign({ id: userRecord.id, email: userRecord.email, role: userRecord.role }, JWT_SECRET, { expiresIn: '1h' });
  const decoded = jwt.verify(token, JWT_SECRET);
  assert.equal(decoded.id, userId, 'Decoded user ID should match');
  assert.equal(decoded.email, 'testuser@example.com', 'Decoded email should match');
  console.log('  -> PASS');

  // Test 4: Session Creation and Revocation
  console.log('Test 4: Session Creation and Revocation');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  const [sessionResult] = await pool.query(
    "INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)",
    [userId, token, 'Mozilla/Chrome', '127.0.0.1', expiresAt]
  );

  const sessionId = sessionResult.insertId;
  assert.ok(sessionId > 0, 'Session ID should be generated');

  // Check active session lookup
  const now = new Date();
  const [sessionRecords] = await pool.query(
    "SELECT * FROM sessions WHERE token = ? AND is_active = 1 AND expires_at > ?",
    [token, now]
  );
  const sessionRecord = sessionRecords[0];
  assert.ok(sessionRecord, 'Session should be active and valid');

  // Revoke session
  await pool.query("UPDATE sessions SET is_active = 0 WHERE id = ?", [sessionId]);
  const [inactiveSessionRecords] = await pool.query(
    "SELECT * FROM sessions WHERE token = ? AND is_active = 1 AND expires_at > ?",
    [token, now]
  );
  const inactiveSession = inactiveSessionRecords[0];
  assert.ok(!inactiveSession, 'Session should be inactive after revocation');
  console.log('  -> PASS');

  // Test 5: Dummy OTP verification
  console.log('Test 5: Dummy OTP verification flow');
  const dummyOtp = '123456';
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  
  const [otpResult] = await pool.query(
    "INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES (?, ?, 'login', ?)",
    [userId, dummyOtp, otpExpires]
  );

  const otpId = otpResult.insertId;
  assert.ok(otpId > 0, 'OTP ID should be generated');

  // Verify unused OTP
  const [validOtpRecords] = await pool.query(
    "SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = 'login' AND is_used = 0 AND expires_at > ?",
    [userId, dummyOtp, now]
  );
  const validOtp = validOtpRecords[0];
  assert.ok(validOtp, 'OTP should be valid');

  // Mark used
  await pool.query("UPDATE otp_verifications SET is_used = 1 WHERE id = ?", [otpId]);
  const [usedOtpRecords] = await pool.query(
    "SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = 'login' AND is_used = 0 AND expires_at > ?",
    [userId, dummyOtp, now]
  );
  const usedOtp = usedOtpRecords[0];
  assert.ok(!usedOtp, 'OTP should be invalid after usage');
  console.log('  -> PASS');

  // Test 6: Consolidated Password Reset via Dummy OTP
  console.log('Test 6: Consolidated Password Reset via Dummy OTP');
  // Re-create user and reset OTP
  const hashedTempPassword = bcrypt.hashSync('tempPassword123', 10);
  const [userSetup] = await pool.query(
    "INSERT INTO users (name, email, phone_number, password, is_verified) VALUES (?, ?, ?, ?, 1)",
    ['Reset User', 'resetuser@example.com', '+1234567890', hashedTempPassword]
  );
  const tempUserId = userSetup.insertId;
  
  const resetOtp = '123456';
  const resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    "INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES (?, ?, 'reset', ?)",
    [tempUserId, resetOtp, resetOtpExpires]
  );

  // Validate OTP in reset password table query
  const testNow = new Date();
  const [resetOtpRecords] = await pool.query(
    "SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = 'reset' AND is_used = 0 AND expires_at > ?",
    [tempUserId, resetOtp, testNow]
  );
  const resetOtpRecord = resetOtpRecords[0];
  assert.ok(resetOtpRecord, 'Reset OTP should be valid before reset');

  // Perform reset simulation
  const newPassword = 'newSecretPassword123';
  const newPasswordHash = bcrypt.hashSync(newPassword, 10);
  await pool.query("UPDATE otp_verifications SET is_used = 1 WHERE id = ?", [resetOtpRecord.id]);
  await pool.query("UPDATE users SET password = ?, updated_at = ? WHERE id = ?", [newPasswordHash, new Date(), tempUserId]);

  // Verify
  const [updatedUserRecords] = await pool.query("SELECT password FROM users WHERE id = ?", [tempUserId]);
  const updatedUserRecord = updatedUserRecords[0];
  assert.ok(bcrypt.compareSync(newPassword, updatedUserRecord.password), 'New password should be correctly hashed and stored');
  console.log('  -> PASS');

  // Test 7: Social Login Database Storage
  console.log('Test 7: Social Login Database Storage');
  const googleId = 'g-123456';
  const emailGoogle = 'dummygoogle@example.com';
  const nameGoogle = 'Dummy Google User';
  const profilePicGoogle = 'https://example.com/pic.jpg';
  
  const [existingSocialUsers] = await pool.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, emailGoogle]);
  assert.equal(existingSocialUsers.length, 0, 'User should not exist initially');
  
  const [regSocialResult] = await pool.query(
    'INSERT INTO users (name, email, is_google_user, google_id, profile_picture, is_verified) VALUES (?, ?, 1, ?, ?, 1)',
    [nameGoogle, emailGoogle, googleId, profilePicGoogle]
  );
  const socialUserId = regSocialResult.insertId;
  assert.ok(socialUserId > 0, 'Google User ID should be generated');
  
  const [insertedSocialUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [socialUserId]);
  const insertedSocialUser = insertedSocialUsers[0];
  assert.equal(insertedSocialUser.is_google_user, 1, 'is_google_user should be 1');
  assert.equal(insertedSocialUser.google_id, googleId, 'google_id should match');
  assert.equal(insertedSocialUser.profile_picture, profilePicGoogle, 'profile_picture should match');
  
  const mockToken = jwt.sign({ id: insertedSocialUser.id, email: insertedSocialUser.email, role: insertedSocialUser.role }, JWT_SECRET, { expiresIn: '24h' });
  const expiresAtSocial = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  const [socialSessionResult] = await pool.query(
    'INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)',
    [insertedSocialUser.id, mockToken, 'Mozilla/Chrome', '127.0.0.1', expiresAtSocial]
  );
  assert.ok(socialSessionResult.insertId > 0, 'Session should be created for Google user');
  
  const [socialActivityLogs] = await pool.query(
    'INSERT INTO login_activity (user_id, ip_address, device_info, status) VALUES (?, ?, ?, ?)',
    [socialUserId, '127.0.0.1', 'Mozilla/Chrome', 'success']
  );
  assert.ok(socialActivityLogs.insertId > 0, 'Login activity log should be created for Google user');
  
  console.log('  -> PASS');

  // Test 8: Registration OTP Verification Flow
  console.log('Test 8: Registration OTP Verification Flow');
  const [regOtpRes] = await pool.query(
    "INSERT INTO users (name, email, password, is_verified) VALUES ('Verify User', 'verifyuser@example.com', 'pwd123', 0)"
  );
  const verifyUserId = regOtpRes.insertId;
  
  const [verifyUserBefore] = await pool.query("SELECT is_verified FROM users WHERE id = ?", [verifyUserId]);
  assert.equal(verifyUserBefore[0].is_verified, 0, 'User should be unverified initially');

  const verifyOtp = '987654';
  const verifyOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    "INSERT INTO otp_verifications (user_id, otp_code, purpose, expires_at) VALUES (?, ?, 'verify', ?)",
    [verifyUserId, verifyOtp, verifyOtpExpires]
  );

  const [otpVerifyRecords] = await pool.query(
    "SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND purpose = 'verify' AND is_used = 0 AND expires_at > ?",
    [verifyUserId, verifyOtp, new Date()]
  );
  assert.ok(otpVerifyRecords[0], 'Verify OTP should exist');

  await pool.query("UPDATE otp_verifications SET is_used = 1 WHERE id = ?", [otpVerifyRecords[0].id]);
  await pool.query("UPDATE users SET is_verified = 1 WHERE id = ?", [verifyUserId]);

  const [verifyUserAfter] = await pool.query("SELECT is_verified FROM users WHERE id = ?", [verifyUserId]);
  assert.equal(verifyUserAfter[0].is_verified, 1, 'User should be verified after OTP verification');
  console.log('  -> PASS');

  // Test 9: Password Reset Token Flow
  console.log('Test 9: Password Reset Token Flow');
  const resetToken = 'mySecretCryptographicResetToken';
  const tokenExpires = new Date(Date.now() + 60 * 60 * 1000);

  const [tokenRes] = await pool.query(
    "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
    [verifyUserId, resetToken, tokenExpires]
  );
  assert.ok(tokenRes.insertId > 0, 'Password reset token should be inserted');

  const [tokenLookups] = await pool.query(
    "SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > ?",
    [resetToken, new Date()]
  );
  const tokenRecord = tokenLookups[0];
  assert.ok(tokenRecord, 'Reset token should be valid');

  const newPwdHash = bcrypt.hashSync('myNewAwesomePassword', 10);
  await pool.query("UPDATE users SET password = ? WHERE id = ?", [newPwdHash, tokenRecord.user_id]);
  await pool.query("DELETE FROM password_reset_tokens WHERE id = ?", [tokenRecord.id]);

  const [pwdCheck] = await pool.query("SELECT password FROM users WHERE id = ?", [verifyUserId]);
  assert.ok(bcrypt.compareSync('myNewAwesomePassword', pwdCheck[0].password), 'Password should be updated');

  const [tokenCheck] = await pool.query("SELECT * FROM password_reset_tokens WHERE id = ?", [tokenRecord.id]);
  assert.ok(!tokenCheck[0], 'Token should be deleted after reset');
  console.log('  -> PASS');

  // Test 10: Creator Registration and Creators Sync Flow
  console.log('Test 10: Creator Registration and Creators Sync Flow');
  
  // 1. Register a user as creator via handleRegister (using mock request objects)
  const reqMock = {
    body: {
      name: 'Test Creator',
      email: 'creatoruser@example.com',
      password: 'creatorPassword123',
      role: 'creator'
    }
  };
  
  let registerResponseCode = null;
  let registerResponsePayload = null;
  const resMock = {
    writeHead: (code, headers) => { registerResponseCode = code; },
    end: (str) => { registerResponsePayload = JSON.parse(str); }
  };
  
  const authController = require('./authController');
  await authController.handleRegister(reqMock, resMock);
  
  assert.equal(registerResponseCode, 201, 'Creator registration response status should be 201');
  assert.ok(registerResponsePayload.otp, 'Creator registration should return an OTP');
  
  const [dbUserRecords] = await pool.query("SELECT * FROM users WHERE email = 'creatoruser@example.com'");
  const dbUser = dbUserRecords[0];
  assert.ok(dbUser, 'Creator user should be saved in database');
  assert.equal(dbUser.role, 'creator', 'Creator user role should be creator');
  assert.equal(dbUser.is_verified, 0, 'Creator user should be initially unverified');
  
  // Verify creators table is still empty for this creator
  const [creatorsBefore] = await pool.query("SELECT * FROM creators WHERE email = 'creatoruser@example.com'");
  assert.equal(creatorsBefore.length, 0, 'Creators table should not have the creator before verification');

  // 2. Verify OTP via handleVerifyOtp (using mock request objects)
  const verifyReqMock = {
    body: {
      email: 'creatoruser@example.com',
      otp_code: registerResponsePayload.otp,
      purpose: 'verify'
    }
  };
  
  let verifyResponseCode = null;
  const verifyResMock = {
    writeHead: (code, headers) => { verifyResponseCode = code; },
    end: (str) => {}
  };
  
  await authController.handleVerifyOtp(verifyReqMock, verifyResMock);
  assert.equal(verifyResponseCode, 200, 'OTP verification response status should be 200');
  
  // 3. Verify user is now verified
  const [dbUserAfter] = await pool.query("SELECT is_verified FROM users WHERE email = 'creatoruser@example.com'");
  assert.equal(dbUserAfter[0].is_verified, 1, 'Creator user is_verified should be updated to 1');
  
  // 4. Verify creator record is successfully synced to creators table
  const [creatorsAfter] = await pool.query("SELECT * FROM creators WHERE email = 'creatoruser@example.com'");
  const creatorRecord = creatorsAfter[0];
  assert.ok(creatorRecord, 'Creator record should be synced to creators table');
  assert.equal(creatorRecord.name, 'Test Creator', 'Creator name should match');
  console.log('  -> PASS');

  // Test 11: 7-Day Session Expiry, Current Flagging, Expired Cleanup, and Revoke All Flow
  console.log('Test 11: 7-Day Session Expiry, Current Flagging, Expired Cleanup, and Revoke All Flow');
  
  // Re-create user
  const pwdHash = bcrypt.hashSync('pass123', 10);
  const [sessionUserRes] = await pool.query(
    "INSERT INTO users (name, email, password, is_verified) VALUES ('Session User', 'sessionuser@example.com', ?, 1)",
    [pwdHash]
  );
  const sessionUserId = sessionUserRes.insertId;

  // Create two sessions: one active (current), one active but expires_at is in the past
  const nowTime = new Date();
  const tokenCurrent = jwt.sign({ id: sessionUserId, email: 'sessionuser@example.com', role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  const tokenExpired = jwt.sign({ id: sessionUserId, email: 'sessionuser@example.com', role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  
  const expiresAtCurrent = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiresAtExpired = new Date(Date.now() - 1000); // Expired 1 second ago

  const [sessionCurrentRes] = await pool.query(
    "INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at, is_active) VALUES (?, ?, 'Chrome/Win', '127.0.0.1', ?, 1)",
    [sessionUserId, tokenCurrent, expiresAtCurrent]
  );
  const sessionCurrentId = sessionCurrentRes.insertId;

  const [sessionExpiredRes] = await pool.query(
    "INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at, is_active) VALUES (?, ?, 'Firefox/Mac', '192.168.1.1', ?, 1)",
    [sessionUserId, tokenExpired, expiresAtExpired]
  );
  const sessionExpiredId = sessionExpiredRes.insertId;

  // Run cleanup (as done in authenticateRequest)
  await pool.query(
    'UPDATE sessions SET is_active = 0 WHERE expires_at <= ? AND is_active = 1',
    [nowTime]
  );

  // Check that the expired session is now inactive
  const [expiredSessionInDb] = await pool.query("SELECT is_active FROM sessions WHERE id = ?", [sessionExpiredId]);
  assert.equal(expiredSessionInDb[0].is_active, 0, 'Expired session should have been set to inactive');

  // Verify handleGetSessions flags the current session correctly
  const getSessionsReq = {
    user: { id: sessionUserId },
    sessionId: sessionCurrentId
  };
  let sessionsResponsePayload = null;
  const getSessionsRes = {
    writeHead: (code, headers) => {},
    end: (str) => { sessionsResponsePayload = JSON.parse(str); }
  };
  
  await authController.handleGetSessions(getSessionsReq, getSessionsRes);
  const sessionsList = sessionsResponsePayload.sessions;
  
  // Only the active session should be returned (since handleGetSessions filters is_active = 1)
  assert.equal(sessionsList.length, 1, 'Only active session should be returned');
  assert.equal(sessionsList[0].id, sessionCurrentId, 'Active session ID should match');
  assert.equal(sessionsList[0].is_current, true, 'is_current should be true for the current active session');

  // Test Revoke All Sessions
  const revokeAllReq = {
    user: { id: sessionUserId }
  };
  let revokeAllResponseCode = null;
  const revokeAllRes = {
    writeHead: (code, headers) => { revokeAllResponseCode = code; },
    end: (str) => {}
  };
  
  await authController.handleRevokeAllSessions(revokeAllReq, revokeAllRes);
  assert.equal(revokeAllResponseCode, 200, 'Revoke all sessions status should be 200');

  // Check sessions table - all should be inactive now
  const [userSessionsAfterRevoke] = await pool.query("SELECT is_active FROM sessions WHERE user_id = ?", [sessionUserId]);
  for (const s of userSessionsAfterRevoke) {
    assert.equal(s.is_active, 0, 'All sessions should be inactive');
  }

  console.log('  -> PASS');

  // Test 12: Inactivity Timeout & Older Session Protection Rule
  console.log('Test 12: Inactivity Timeout & Older Session Protection Rule');
  
  // 1. Create older session (created 10 minutes ago)
  const createdOld = new Date(Date.now() - 10 * 60 * 1000);
  const tokenOld = jwt.sign({ id: sessionUserId, email: 'sessionuser@example.com', role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  const [resOld] = await pool.query(
    "INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at, created_at, is_active) VALUES (?, ?, 'Old Device', '1.1.1.1', ?, ?, 1)",
    [sessionUserId, tokenOld, expiresAtCurrent, createdOld]
  );
  const oldSessionId = resOld.insertId;

  // 2. Create newer session (created now)
  const createdNew = new Date();
  const tokenNew = jwt.sign({ id: sessionUserId, email: 'sessionuser@example.com', role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  const [resNew] = await pool.query(
    "INSERT INTO sessions (user_id, token, device_info, ip_address, expires_at, created_at, is_active) VALUES (?, ?, 'New Device', '2.2.2.2', ?, ?, 1)",
    [sessionUserId, tokenNew, expiresAtCurrent, createdNew]
  );
  const newSessionId = resNew.insertId;

  // 3. Request handleGetSessions from NEW session
  const reqFromNew = {
    user: { id: sessionUserId, session_timeout_seconds: 604800 },
    sessionId: newSessionId
  };
  let sessionsFromNew = null;
  await authController.handleGetSessions(reqFromNew, {
    writeHead: () => {},
    end: (str) => { sessionsFromNew = JSON.parse(str).sessions; }
  });

  const oldSessionMeta = sessionsFromNew.find(s => s.id === oldSessionId);
  const newSessionMeta = sessionsFromNew.find(s => s.id === newSessionId);

  assert.equal(oldSessionMeta.can_revoke, false, 'Newer session should NOT be allowed to revoke older session');
  assert.equal(newSessionMeta.can_revoke, true, 'Current session can revoke itself');

  // 4. Attempt to revoke older session from newer session (backend 403 test)
  const revokeAttemptReq = {
    user: { id: sessionUserId },
    sessionId: newSessionId
  };
  let revokeAttemptCode = null;
  let revokeAttemptError = null;
  await authController.handleRevokeSession(revokeAttemptReq, {
    writeHead: (code) => { revokeAttemptCode = code; },
    end: (str) => { revokeAttemptError = JSON.parse(str).error; }
  }, oldSessionId);

  assert.equal(revokeAttemptCode, 403, 'Attempting to revoke an older session should return 403 Forbidden');
  assert.ok(revokeAttemptError.includes('Protection Rule Violation'), 'Error message should explain older session protection');

  // 5. Test handleUpdateSessionTimeout
  const updateTimeoutReq = {
    user: { id: sessionUserId },
    body: { timeout_seconds: 120 }
  };
  let updateTimeoutCode = null;
  await authController.handleUpdateSessionTimeout(updateTimeoutReq, {
    writeHead: (code) => { updateTimeoutCode = code; },
    end: () => {}
  });
  assert.equal(updateTimeoutCode, 200, 'Updating session timeout should succeed with 200');

  const [timeoutCheck] = await pool.query("SELECT session_timeout_seconds FROM users WHERE id = ?", [sessionUserId]);
  assert.equal(timeoutCheck[0].session_timeout_seconds, 120, 'Timeout in DB should be updated to 120');

  console.log('  -> PASS');

  // Cleanup
  await cleanup();
  console.log('\nAll tests completed successfully!');
  process.exit(0);
}

runTests().catch(error => {
  console.error('\nTest failed with error:', error);
  process.exit(1);
});
