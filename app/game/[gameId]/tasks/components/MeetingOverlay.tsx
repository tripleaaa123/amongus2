'use client';

import styles from './MeetingOverlay.module.css';

export default function MeetingOverlay() {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.icon}>🚨</div>
        <h1 className={styles.title}>MEETING CALLED</h1>
        <p className={styles.message}>Go to the meeting room now!</p>
      </div>
    </div>
  );
}

