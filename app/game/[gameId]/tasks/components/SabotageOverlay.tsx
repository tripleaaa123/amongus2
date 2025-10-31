'use client';

import styles from './SabotageOverlay.module.css';

export default function SabotageOverlay() {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.icon}>⚡</div>
        <h1 className={styles.title}>SABOTAGE ONGOING</h1>
        <p className={styles.message}>All players must wait for sabotage to be resolved</p>
      </div>
    </div>
  );
}

