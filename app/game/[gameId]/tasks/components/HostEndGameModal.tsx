'use client';

import { useState } from 'react';
import { endGameManually } from '@/lib/gameUtils';
import styles from './HostEndGameModal.module.css';

interface HostEndGameModalProps {
  gameId: string;
  onClose: () => void;
}

export default function HostEndGameModal({ gameId, onClose }: HostEndGameModalProps) {
  const [selectedWinner, setSelectedWinner] = useState<'imposters' | 'crewmates' | 'snitch' | null>(null);
  const [ending, setEnding] = useState(false);

  const handleEndGame = async () => {
    if (!selectedWinner) return;
    
    setEnding(true);
    try {
      await endGameManually(gameId, selectedWinner);
      onClose();
    } catch (error: any) {
      console.error('Error ending game:', error);
      alert('Failed to end game. Please try again.');
    } finally {
      setEnding(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <h2 className={styles.title}>End Game</h2>
        <p className={styles.description}>Select the winner:</p>

        <div className={styles.options}>
          <button
            className={`${styles.optionButton} ${selectedWinner === 'imposters' ? styles.selected : ''}`}
            onClick={() => setSelectedWinner('imposters')}
          >
            🔴 Imposters Win
          </button>
          <button
            className={`${styles.optionButton} ${selectedWinner === 'crewmates' ? styles.selected : ''}`}
            onClick={() => setSelectedWinner('crewmates')}
          >
            🔵 Crewmates Win
          </button>
          <button
            className={`${styles.optionButton} ${selectedWinner === 'snitch' ? styles.selected : ''}`}
            onClick={() => setSelectedWinner('snitch')}
          >
            🕵️ Snitch Wins
          </button>
        </div>

        <button
          className={styles.endButton}
          onClick={handleEndGame}
          disabled={!selectedWinner || ending}
        >
          {ending ? 'Ending Game...' : 'End Game'}
        </button>
      </div>
    </div>
  );
}

