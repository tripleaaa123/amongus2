'use client';

import { useState, useEffect } from 'react';
import { triggerSabotage, Game } from '@/lib/gameUtils';
import styles from './ActionsModal.module.css';

interface ActionsModalProps {
  role: 'crewmate' | 'imposter' | undefined;
  gameId: string;
  game: Game | null;
  onClose: () => void;
}

export default function ActionsModal({ role, gameId, game, onClose }: ActionsModalProps) {
  const [sabotaging, setSabotaging] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Update cooldown timer
  useEffect(() => {
    if (!game?.sabotageCooldownUntil) {
      setCooldownRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((game.sabotageCooldownUntil! - now) / 1000));
      setCooldownRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [game?.sabotageCooldownUntil]);

  const handleSabotage = async () => {
    if (cooldownRemaining > 0) {
      alert(`Sabotage is on cooldown. Please wait ${Math.ceil(cooldownRemaining / 60)} minutes.`);
      return;
    }

    if (!confirm('Trigger sabotage? This will alert all players.')) return;
    
    setSabotaging(true);
    try {
      await triggerSabotage(gameId);
      alert('Sabotage triggered!');
      onClose();
    } catch (error: any) {
      console.error('Sabotage error:', error);
      alert(error.message || 'Failed to trigger sabotage. Please try again.');
    } finally {
      setSabotaging(false);
    }
  };

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            {cooldownRemaining > 0 && (
              <p className={styles.cooldownText}>
                Cooldown: {formatCooldown(cooldownRemaining)}
              </p>
            )}
            <button 
              className={styles.sabotageButton}
              onClick={handleSabotage}
              disabled={sabotaging || cooldownRemaining > 0 || game?.sabotageOngoing}
            >
              {sabotaging ? 'Triggering...' : cooldownRemaining > 0 ? 'On Cooldown' : game?.sabotageOngoing ? 'Sabotage Active' : '⚡ Sabotage'}
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

