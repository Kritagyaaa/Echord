import { AboutArtistCard } from '../cards/AboutArtistCard.jsx';
import { CreditsCard } from '../cards/CreditsCard.jsx';
import { NowPlayingCard } from '../cards/NowPlayingCard.jsx';
import { SidebarHeader } from './SidebarHeader.jsx';
import styles from './RightSidebar.module.css';
import { RecommendationCard } from "../cards/RecommendationCard";

const defaultSong = {
  id: 'song-001',
  title: 'Midnight City',
  artist: 'M83',
  albumCover:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=90',
  duration: '4:03',
  artistInfo: {
    name: 'M83',
    image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=90',
    monthlyListeners: '9,847,233',
    bio: 'M83 is the widescreen electronic project led by Anthony Gonzalez, blending shoegaze, synth-pop, and cinematic textures.',
  },
  credits: [
    {
      id: 'credit-001',
      name: 'Anthony Gonzalez',
      role: 'Main artist, composer, producer',
      isFollowing: false,
    },
  ],
};

export function RightSidebar({ song = defaultSong, playlistName = 'Today\'s Top Hits' }) {
  return (
    <aside className={styles.sidebar} aria-label="Now playing">
      <SidebarHeader playlistName={playlistName} />
      <div className={styles.scrollArea}>
        <NowPlayingCard song={song} />
        <AboutArtistCard artist={song.artistInfo} />
        <CreditsCard credits={song.credits} />
         <RecommendationCard />
      </div>
    </aside>
  );
}
