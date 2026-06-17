import styles from './FollowButton.module.css';

export function FollowButton({ isFollowing = false }) {
  return (
    <button className={styles.button} type="button" aria-pressed={isFollowing}>
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
