import { Maximize2, MoreHorizontal } from 'lucide-react';
import styles from './SidebarHeader.module.css';

export function SidebarHeader({ playlistName }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.playlistName}>{playlistName}</h1>
      <div className={styles.actions} aria-label="Now playing actions">
        <button className={styles.iconButton} type="button" aria-label="More options">
          <MoreHorizontal size={21} strokeWidth={2.1} />
        </button>
        <button className={styles.iconButton} type="button" aria-label="Expand now playing view">
          <Maximize2 size={18} strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
}
