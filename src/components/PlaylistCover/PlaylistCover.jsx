import React from 'react';

export function PlaylistCover({ playlist, className, fallbackPlaceholder }) {
  const coverUrl = playlist?.cover_url;
  
  // Extract covers from songs list or song_covers array
  let covers = [];
  if (playlist?.songs && playlist.songs.length > 0) {
    covers = playlist.songs.map(s => s.cover_url).filter(Boolean);
  } else if (playlist?.song_covers && playlist.song_covers.length > 0) {
    covers = playlist.song_covers.filter(Boolean);
  }

  // If the playlist has a custom cover image, render it
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={playlist.name}
        className={className}
        onError={(e) => {
          if (fallbackPlaceholder) {
            e.target.src = fallbackPlaceholder;
          }
        }}
      />
    );
  }

  // If the playlist has no custom cover image, but has 4 or more songs with cover URLs, render a 2x2 collage
  if (covers.length >= 4) {
    return (
      <div 
        className={`${className} playlist-collage-grid`}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          overflow: 'hidden',
          aspectRatio: '1',
          gap: '1px',
          background: '#282828'
        }}
      >
        <img src={covers[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <img src={covers[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <img src={covers[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <img src={covers[3]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }

  // If the playlist has 1 to 3 songs with cover URLs, render the first song's cover
  if (covers.length >= 1) {
    return (
      <img
        src={covers[0]}
        alt={playlist.name}
        className={className}
        onError={(e) => {
          if (fallbackPlaceholder) {
            e.target.src = fallbackPlaceholder;
          }
        }}
      />
    );
  }

  // Fallback to the default placeholder image
  return (
    <img
      src={fallbackPlaceholder}
      alt={playlist.name}
      className={className}
    />
  );
}
