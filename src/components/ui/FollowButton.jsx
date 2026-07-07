import { useState } from 'react';
import styles from './FollowButton.module.css';

export function FollowButton({ isFollowing = false }) {
  const [following, setFollowing] = useState(isFollowing);

  return (
    <button 
      className={styles.button} 
      type="button" 
      aria-pressed={following}
      onClick={() => setFollowing(prev => !prev)}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
