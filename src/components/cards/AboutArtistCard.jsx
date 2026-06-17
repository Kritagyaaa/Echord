import { BadgeCheck } from 'lucide-react';
import { FollowButton } from '../ui/FollowButton.jsx';
import styles from './AboutArtistCard.module.css';

export function AboutArtistCard({ artist }) {
  return (
    <section className={styles.card} aria-labelledby="about-artist-title">
      <div className={styles.banner}>
        <img className={styles.bannerImage} src={artist.image} alt={`${artist.name} artist portrait`} />
        <h2 className={styles.overlayTitle} id="about-artist-title">
          About the artist
        </h2>
      </div>
      <div className={styles.content}>
        <div className={styles.topRow}>
          <div className={styles.artistText}>
            <div className={styles.artistNameRow}>
              <h3 className={styles.artistName}>{artist.name}</h3>
              <BadgeCheck className={styles.verifiedIcon} size={18} fill="#3d91f4" strokeWidth={2.3} />
            </div>
            <p className={styles.listeners}>{artist.monthlyListeners} monthly listeners</p>
          </div>
          <FollowButton />
        </div>
        <p className={styles.bio}>{artist.bio}</p>
      </div>
    </section>
  );
}
