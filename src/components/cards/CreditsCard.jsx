import { FollowButton } from '../ui/FollowButton.jsx';
import styles from './CreditsCard.module.css';

export function CreditsCard({ credits }) {
  return (
    <section className={styles.card} aria-labelledby="credits-title">
      <div className={styles.header}>
        <h2 className={styles.title} id="credits-title">
          Credits
        </h2>
        <button className={styles.showAllButton} type="button">
          Show all
        </button>
      </div>
      <ul className={styles.creditList}>
        {credits.map((credit) => (
          <li className={styles.creditItem} key={credit.id}>
            <div className={styles.creditText}>
              <h3 className={styles.name}>{credit.name}</h3>
              <p className={styles.role}>{credit.role}</p>
            </div>
            <FollowButton isFollowing={credit.isFollowing} />
          </li>
        ))}
      </ul>
    </section>
  );
}
