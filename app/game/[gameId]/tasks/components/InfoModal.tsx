'use client';

import styles from './InfoModal.module.css';

interface InfoModalProps {
  role: 'crewmate' | 'imposter' | undefined;
  onClose: () => void;
}

export default function InfoModal({ role, onClose }: InfoModalProps) {
  if (!role) return null;

  const isCrewmate = role === 'crewmate';
  const title = isCrewmate ? 'CREWMATE' : 'IMPOSTER';
  const icon = isCrewmate ? '🔵' : '🔴';
  const goal = isCrewmate
    ? 'Complete all your tasks and identify the imposters before they eliminate all crewmates.'
    : 'Eliminate all crewmates without being caught. Blend in and sabotage their tasks.';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <div className={`${styles.roleCard} ${isCrewmate ? styles.crewmate : styles.imposter}`}>
          <div className={styles.roleIcon}>{icon}</div>
          <h2 className={styles.roleTitle}>{title}</h2>
          <div className={styles.goalSection}>
            <h3>Your Goal:</h3>
            <p>{goal}</p>
          </div>
        </div>
        <button className={styles.okButton} onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

