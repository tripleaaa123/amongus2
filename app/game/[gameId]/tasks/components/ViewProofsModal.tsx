'use client';

import { useEffect, useState } from 'react';
import { getGameProofs, Proof, Game } from '@/lib/gameUtils';
import styles from './ViewProofsModal.module.css';

interface ViewProofsModalProps {
  gameId: string;
  game: Game;
  onClose: () => void;
}

export default function ViewProofsModal({ gameId, game, onClose }: ViewProofsModalProps) {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProofs = async () => {
      try {
        const gameProofs = await getGameProofs(gameId);
        setProofs(gameProofs);
      } catch (error) {
        console.error('Error loading proofs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProofs();
  }, [gameId]);

  // Group proofs by player
  const proofsByPlayer = proofs.reduce((acc, proof) => {
    if (!acc[proof.playerNickname]) {
      acc[proof.playerNickname] = [];
    }
    acc[proof.playerNickname].push(proof);
    return acc;
  }, {} as Record<string, Proof[]>);

  // Get task name from player's tasks
  const getTaskName = (taskId: string, playerNickname: string): string => {
    const player = game.players.find(p => p.nickname === playerNickname);
    if (player?.tasks) {
      const task = player.tasks.find(t => t.taskId === taskId);
      return task?.name || `Task ${taskId}`;
    }
    return `Task ${taskId}`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <h2 className={styles.title}>Task Proofs</h2>
        
        {loading ? (
          <div className={styles.loading}>Loading proofs...</div>
        ) : proofs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No proofs submitted yet.</p>
          </div>
        ) : (
          <div className={styles.proofsContainer}>
            {Object.entries(proofsByPlayer).map(([playerNickname, playerProofs]) => (
              <div key={playerNickname} className={styles.playerSection}>
                <h3 className={styles.playerName}>{playerNickname}</h3>
                <div className={styles.proofsGrid}>
                  {playerProofs.map((proof) => (
                    <div key={proof.id} className={styles.proofCard}>
                      <p className={styles.taskName}>{getTaskName(proof.taskId, playerNickname)}</p>
                      <img 
                        src={proof.imageUrl} 
                        alt={`Proof for ${proof.taskId}`}
                        className={styles.proofImage}
                        loading="lazy"
                      />
                      <p className={styles.timestamp}>
                        {new Date(proof.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

