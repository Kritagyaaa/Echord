// C:\Users\krita\.gemini\antigravity-ide\brain\82adb017-5bf0-4c94-be39-10dd8b2e53f5/scratch/test_api_like.js
const pool = require('c:/Users/krita/Documents/Codex/2026-06-17/spotify-clone/backend/db');

async function testApi() {
  try {
    // 1. Perform login
    console.log("Attempting to log in...");
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testlike@example.com',
        password: 'Password123!'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log("Logged in successfully! Token:", loginData.token.substring(0, 15) + "...");
    
    // 2. Call like endpoint for song ID 12
    console.log("Toggling like for song 12...");
    const likeResponse = await fetch('http://localhost:5000/api/songs/12/like', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (!likeResponse.ok) {
      const errText = await likeResponse.text();
      throw new Error(`Like failed: ${likeResponse.status} ${errText}`);
    }
    
    const likeData = await likeResponse.json();
    console.log("Like response:", likeData);
    
    // 3. Query the database to verify
    const [likes] = await pool.query('SELECT * FROM likes WHERE user_id = ? AND song_id = 12', [loginData.user.id]);
    console.log("Likes in DB for this user & song 12:", likes);
    
    const [songs] = await pool.query('SELECT title, like_count FROM songs WHERE id = 12');
    console.log("Song info in DB:", songs[0]);
    
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

testApi();
