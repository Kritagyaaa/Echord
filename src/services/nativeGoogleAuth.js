import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeGoogleAuth = registerPlugin('NativeGoogleAuth');
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export function isNativeGoogleAuth() {
  return Capacitor.isNativePlatform();
}

export async function authenticateWithNativeGoogle(role = 'user') {
  const { idToken, nonce } = await NativeGoogleAuth.signIn();
  if (!idToken || !nonce) {
    throw new Error('Google did not return an ID token.');
  }

  const response = await fetch(`${API_URL}/auth/social-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken, nonce, role }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Google authentication failed.');
  }
  return data;
}