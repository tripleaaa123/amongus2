'use client';

import { Game } from '@/lib/gameUtils';
import styles from './EndGameOverlay.module.css';

interface EndGameOverlayProps {
  game: Game;
}

export default function EndGameOverlay({ game }: EndGameOverlayProps) {
  if (!game.winner) return null;

  const isImposterWin = game.winner === 'imposters';

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.icon}>
          {isImposterWin ? '🔴' : '🔵'}
        </div>
        <h1 className={styles.title}>
          {isImposterWin ? 'IMPOSTERS WIN!' : 'CREWMATES WIN!'}
        </h1>
        <div className={styles.reveal}>
          <h2 className={styles.revealTitle}>Role Reveal</h2>
          <div className={styles.playersList}>
            {game.players.map((player) => (
              <div 
                key={player.id} 
                className={`${styles.playerCard} ${
                  player.role === 'imposter' ? styles.imposter : styles.crewmate
                }`}
              >
                <div className={styles.playerInfo}>
                  <span className={styles.playerName}>{player.nickname}</span>
                  <span className={styles.playerRole}>
                    {player.role === 'imposter' ? '🔴 IMPOSTER' : '🔵 CREWMATE'}
                  </span>
                  {player.alive === false && (
                    <span className={styles.deadBadge}>☠️ ELIMINATED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

