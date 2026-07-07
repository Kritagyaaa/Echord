import { Disc } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./AlbumsView.module.css";

export function AlbumsView() {
  const navigate = useNavigate();

  return (
    <div className={styles.albumsContainer}>
      <div className={styles.emptyStateCard}>
        <div className={styles.iconCircle}>
          <Disc size={48} className={styles.discIcon} />
        </div>
        <h1 className={styles.title}>No Albums Yet</h1>
        <p className={styles.description}>
          You haven't added or created any albums to show yet.
        </p>
        <button 
          className={styles.exploreButton}
          onClick={() => navigate("/browse")}
        >
          Explore Music
        </button>
      </div>
    </div>
  );
}
