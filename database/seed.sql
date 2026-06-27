-- =====================================
-- SEED DATA
-- =====================================

-- Disable FK checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM history;
DELETE FROM likes;
DELETE FROM playlist_songs;
DELETE FROM playlists;
DELETE FROM songs;
DELETE FROM albums;
DELETE FROM genres;
DELETE FROM artists;
DELETE FROM creators;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================
-- CREATOR
-- =====================================

INSERT INTO creators (
    id,
    name,
    email
)
VALUES
(
    1,
    'Admin',
    'admin@spotifyghost.com'
);

-- =====================================
-- ARTISTS
-- =====================================

INSERT INTO artists (id, name, bio) VALUES
(1, 'Michael Jackson', 'King of Pop'),
(2, 'Guns N'' Roses', 'American hard rock band from Los Angeles'),
(3, 'The Beatles', 'Legendary British rock band from Liverpool'),
(4, 'Yo Yo Honey Singh', 'Indian rapper, singer and music producer'),
(5, 'Lady Gaga', 'American singer, songwriter and actress'),
(6, 'Frank Sinatra', 'Iconic American singer and actor'),
(7, 'Miles Davis', 'American jazz trumpeter and composer');

-- =====================================
-- GENRES
-- =====================================

INSERT INTO genres (id, name) VALUES
(1, 'Pop'),
(2, 'Rock'),
(3, 'Folk'),
(4, 'Hip Hop'),
(5, 'Country'),
(6, 'Jazz');

-- =====================================
-- ALBUMS
-- =====================================

INSERT INTO albums (id, title, artist_id) VALUES
(1, 'Michael Jackson Collection', 1),
(2, 'Appetite For Destruction', 2),
(3, 'Use Your Illusion I', 2),
(4, 'Abbey Road (Remastered)', 3),
(5, 'The Beatles (Remastered)', 3),
(6, 'Rubber Soul (Remastered 2009)', 3),
(7, 'Help! (Remastered)', 3),
(8, 'Blue Eyes', 4),
(9, 'International Villager', 4),
(10, 'The Fame Monster (Deluxe Edition)', 5),
(11, 'The Fame', 5),
(12, 'Joanne (Deluxe)', 5),
(13, 'Come Dance With Me! (Remastered)', 6),
(14, 'BD Music Presents Kind of Blue', 7),
(15, 'Nothing But The Best (2008 Remastered)', 6),
(16, 'Desi Kalakaar', 4);

-- =====================================
-- SONGS (Existing: IDs 1-12, Michael Jackson)
-- =====================================

INSERT INTO songs (id, title, artist_id, album_id, genre_id, duration, b2_key, uploaded_by, play_count) VALUES
(1, 'Billie Jean', 1, 1, 1, 294, '1.mp3', 1, 0),
(2, 'Smooth Criminal', 1, 1, 1, 257, '2.mp3', 1, 0),
(3, 'Don''t Stop ''Til You Get Enough', 1, 1, 1, 366, '3.mp3', 1, 0),
(4, 'Dirty Diana', 1, 1, 1, 282, '4.mp3', 1, 0),
(5, 'Human Nature', 1, 1, 1, 245, '5.mp3', 1, 0),
(6, 'Thriller', 1, 1, 1, 358, '6.mp3', 1, 0),
(7, 'Wanna Be Startin'' Somethin''', 1, 1, 1, 362, '7.mp3', 1, 0),
(8, 'Liberian Girl', 1, 1, 1, 231, '8.mp3', 1, 0),
(9, 'Smooth Criminal (Version 2)', 1, 1, 1, 257, '9.mp3', 1, 0),
(10, 'Bad', 1, 1, 1, 247, '10.mp3', 1, 0),
(11, 'Man in the Mirror', 1, 1, 1, 320, '11.mp3', 1, 0),
(12, 'Who Is It', 1, 1, 1, 391, '12.mp3', 1, 0),

-- =====================================
-- NEW SONGS (IDs 13-30)
-- =====================================

-- Rock (Songs 13-16)
(13, 'Sweet Child O'' Mine', 2, 2, 2, 356, '13.mp3', 1, 0),
(14, 'November Rain', 2, 3, 2, 536, '14.mp3', 1, 0),
(15, 'Come Together - Remastered 2009', 3, 4, 2, 259, '15.mp3', 1, 0),
(16, 'Revolution 1 - Remastered 2009', 3, 5, 2, 255, '16.mp3', 1, 0),

-- Folk (Songs 17-19)
(17, 'Norwegian Wood (This Bird Has Flown)', 3, 6, 3, 124, '17.mp3', 1, 0),
(18, 'Blackbird - Remastered 2009', 3, 5, 3, 138, '18.mp3', 1, 0),
(19, 'You''ve Got To Hide Your Love Away', 3, 7, 3, 129, '19.mp3', 1, 0),

-- Hip Hop (Songs 20-22)
(20, 'Blue Eyes', 4, 8, 4, 220, '20.mp3', 1, 0),
(21, 'Brown Rang', 4, 9, 4, 179, '21.mp3', 1, 0),
(22, 'Angreji Beat', 4, 9, 4, 256, '22.mp3', 1, 0),

-- Pop (Songs 23-25)
(23, 'Bad Romance', 5, 10, 1, 294, '23.mp3', 1, 0),
(24, 'Poker Face', 5, 11, 1, 237, '24.mp3', 1, 0),
(25, 'Just Dance', 5, 11, 1, 241, '25.mp3', 1, 0),

-- Country (Song 26)
(26, 'Million Reasons', 5, 12, 5, 205, '26.mp3', 1, 0),

-- Jazz (Songs 27-29)
(27, 'Cheek To Cheek - 1998 Remastered', 6, 13, 6, 186, '27.mp3', 1, 0),
(28, 'So What', 7, 14, 6, 565, '28.mp3', 1, 0),
(29, 'Fly Me To The Moon - 2008 Remastered', 6, 15, 6, 147, '29.mp3', 1, 0),

-- Hip Hop (Song 30)
(30, 'Love Dose', 4, 16, 4, 224, '30.mp3', 1, 0);

-- =====================================
-- VERIFY
-- =====================================

SELECT COUNT(*) AS artists FROM artists;
SELECT COUNT(*) AS albums FROM albums;
SELECT COUNT(*) AS genres FROM genres;
SELECT COUNT(*) AS songs FROM songs;

SELECT id, title, b2_key FROM songs ORDER BY id;