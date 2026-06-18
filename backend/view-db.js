const { createDatabase } = require('./db');

const database = createDatabase();

console.log('\n========== MUSIC_FILES TABLE ==========\n');
const musicFiles = database.prepare('SELECT * FROM music_files').all();
console.table(musicFiles);

console.log('\n========== SONGS TABLE ==========\n');
const songs = database.prepare('SELECT * FROM songs').all();
console.table(songs);

console.log('\n========== PLAYLISTS TABLE ==========\n');
const playlists = database.prepare('SELECT * FROM playlists').all();
console.table(playlists);

console.log('\n========== PLAYLIST_SONGS TABLE ==========\n');
const playlistSongs = database.prepare('SELECT * FROM playlist_songs').all();
console.table(playlistSongs);

console.log('\n========== SUMMARY ==========\n');
console.log(`Total Music Files: ${musicFiles.length}`);
console.log(`Total Songs: ${songs.length}`);
console.log(`Total Playlists: ${playlists.length}`);
console.log(`Total Playlist-Song Links: ${playlistSongs.length}`);

console.log('\n========== SONGS WITH FILE INFO ==========\n');
const songsWithFiles = database
  .prepare(
    `SELECT 
      songs.id,
      songs.title,
      songs.artist_name,
      songs.album_name,
      songs.duration,
      songs.genre,
      music_files.file_name,
      music_files.file_url
    FROM songs
    JOIN music_files ON songs.music_file_id = music_files.id
    ORDER BY songs.id`,
  )
  .all();
console.table(songsWithFiles);

console.log('\n========== PLAYLISTS WITH SONG COUNT ==========\n');
const playlistsWithCount = database
  .prepare(
    `SELECT 
      playlists.id,
      playlists.name,
      playlists.user_id,
      playlists.description,
      COUNT(playlist_songs.id) as song_count
    FROM playlists
    LEFT JOIN playlist_songs ON playlists.id = playlist_songs.playlist_id
    GROUP BY playlists.id
    ORDER BY playlists.id`,
  )
  .all();
console.table(playlistsWithCount);
