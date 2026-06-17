import {
  Bell,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  UsersRound,
} from 'lucide-react';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.navbar} aria-label="Main navigation">
      <div className={styles.left}>
        <button className={styles.iconButton} type="button" aria-label="Go back">
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <button className={styles.iconButton} type="button" aria-label="Go forward">
          <ChevronRight size={22} strokeWidth={2.4} />
        </button>
      </div>

      <div className={styles.center}>
        <button className={styles.homeButton} type="button" aria-label="Home">
          <Home size={26} fill="currentColor" strokeWidth={2.1} />
        </button>

        <label className={styles.searchBox}>
          <Search size={22} strokeWidth={2.2} />
          <input type="text" placeholder="What do you want to play?" aria-label="Search music" />
          <Briefcase size={22} strokeWidth={2.1} />
        </label>
      </div>

      <div className={styles.right}>
        <button className={styles.iconButton} type="button" aria-label="Notifications">
          <Bell size={21} strokeWidth={2.2} />
        </button>
        <button className={styles.iconButton} type="button" aria-label="Friends activity">
          <UsersRound size={22} strokeWidth={2.2} />
        </button>
        <img
          src="https://i.pinimg.com/736x/6c/41/cb/6c41cb3ae4d97eeb68ee2279fe0e0c6f.jpg"
          alt="Profile"
          className={styles.profile}
        />
      </div>
    </header>
  );
}
