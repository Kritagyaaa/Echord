import { ListFilter, Plus, Search } from 'lucide-react';
import styles from './LibrarySidebar.module.css';
import { playlists } from '../../data/playlists';
import placeholder from '../../assets/music-placeholder.jpg';


const filters = ['Playlists', 'Artists', 'Albums', 'Podcasts'];

export function LibrarySidebar({
  onPlaylistSelect,
  selectedPlaylist,
}) {
  return (
    <aside className={styles.sidebar} aria-label="Your library">
      <div className={styles.sidebarHeader}>
        <div className={styles.libraryTitle}>
          <h2>Your Library</h2>
          <span className={styles.tooltip}>Collapse Your Library</span>
        </div>
        <button className={styles.createButton} type="button">
          <Plus size={17} strokeWidth={2.5} />
          <span>Create</span>
        </button>
      </div>

      <div className={styles.filterButtons} aria-label="Library filters">
        {filters.map((filter) => (
          <button type="button" key={filter}>
            {filter}
          </button>
        ))}
      </div>

      <div className={styles.sidebarControls}>
        <button className={styles.controlButton} type="button" aria-label="Search your library">
          <Search size={18} strokeWidth={2.2} />
        </button>
        <button className={styles.recentsButton} type="button">
          Recents
          <ListFilter size={18} strokeWidth={2.1} />
        </button>
      </div>

      <div className={styles.libraryList}>
        {playlists.map((item) => (
          <button
  className={`${styles.libraryItem} ${
  selectedPlaylist?.id === item.id
    ? styles.activePlaylist
    : ""
}`}
  type="button"
  key={item.id}
  onClick={() => onPlaylistSelect(item)}
>
            <img src={item.image || placeholder} alt="" />
            <span className={styles.itemInfo}>
              <span className={styles.itemTitle}>{item.title}</span>
              <span className={styles.itemSubtitle}>{item.subtitle}</span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
