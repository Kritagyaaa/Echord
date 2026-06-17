import { currentSong } from '../../data/songData.js';
import { AboutArtistCard } from '../cards/AboutArtistCard.jsx';
import { CreditsCard } from '../cards/CreditsCard.jsx';
import { NowPlayingCard } from '../cards/NowPlayingCard.jsx';
import { SidebarHeader } from './SidebarHeader.jsx';
import styles from './RightSidebar.module.css';

export function RightSidebar({ song = currentSong, playlistName = 'Today\'s Top Hits' }) {
  return (
    <aside className={styles.sidebar} aria-label="Now playing">
      <SidebarHeader playlistName={playlistName} />
      <div className={styles.scrollArea}>
        <NowPlayingCard song={song} />
        <AboutArtistCard artist={song.artistInfo} />
        <CreditsCard credits={song.credits} />
      </div>
    </aside>
  );
}
