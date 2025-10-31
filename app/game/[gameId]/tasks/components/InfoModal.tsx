'use client';

import styles from './InfoModal.module.css';

interface InfoModalProps {
  role: 'crewmate' | 'imposter' | 'snitch' | undefined;
  onClose: () => void;
}

export default function InfoModal({ role, onClose }: InfoModalProps) {
  if (!role) return null;

  const isCrewmate = role === 'crewmate';
  const isSnitch = role === 'snitch';
  const isImposter = role === 'imposter';
  
  const title = isSnitch ? 'SNITCH' : isCrewmate ? 'CREWMATE' : 'IMPOSTER';
  const icon = isSnitch ? '🕵️' : isCrewmate ? '🔵' : '🔴';
  
  let goal = '';
  if (isSnitch) {
    goal = 'Catch cheaters cheating on camera and win the game automatically. Otherwise, play as a normal crewmate.';
  } else if (isCrewmate) {
    goal = 'Complete all your tasks and identify the imposters before they eliminate all crewmates.';
  } else {
    goal = 'Eliminate all crewmates without being caught. Blend in and sabotage their tasks.';
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <div className={`${styles.roleCard} ${isImposter ? styles.imposter : styles.crewmate}`}>
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

