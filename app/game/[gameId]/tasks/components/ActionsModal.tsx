'use client';

import { useState } from 'react';
import { triggerSabotage } from '@/lib/gameUtils';
import styles from './ActionsModal.module.css';

interface ActionsModalProps {
  role: 'crewmate' | 'imposter' | undefined;
  gameId: string;
  onClose: () => void;
}

export default function ActionsModal({ role, gameId, onClose }: ActionsModalProps) {
  const [sabotaging, setSabotaging] = useState(false);

  const handleSabotage = async () => {
    if (!confirm('Trigger sabotage? This will alert all players.')) return;
    
    setSabotaging(true);
    try {
      await triggerSabotage(gameId);
      alert('Sabotage triggered!');
      onClose();
    } catch (error: any) {
      console.error('Sabotage error:', error);
      alert('Failed to trigger sabotage. Please try again.');
    } finally {
      setSabotaging(false);
    }
  };

  if (!role) return null;

  const isImposter = role === 'imposter';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        {isImposter ? (
          <div className={styles.imposterActions}>
            <h2>Imposter Actions</h2>
            <p className={styles.description}>Use sabotage to create chaos among crewmates.</p>
            <button 
              className={styles.sabotageButton}
              onClick={handleSabotage}
              disabled={sabotaging}
            >
              {sabotaging ? 'Triggering...' : '⚡ Sabotage'}
            </button>
          </div>
        ) : (
          <div className={styles.crewmateActions}>
            <h2>Actions</h2>
            <p className={styles.noActions}>No actions available for you.</p>
          </div>
        )}
      </div>
    </div>
  );
}

