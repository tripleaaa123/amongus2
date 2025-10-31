'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { subscribeToGame, submitVote, endVoting, Game, Player } from '@/lib/gameUtils';
import styles from './page.module.css';

export default function VotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const playerNickname = searchParams.get('playerId') || '';

  const [game, setGame] = useState<Game | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = subscribeToGame(gameId, (gameData) => {
      if (gameData) {
        setGame(gameData);
        const player = gameData.players.find(p => p.nickname === playerNickname);
        setLocalPlayer(player || null);
        
        // Set initial vote if player already voted
        if (player?.vote) {
          setSelectedPlayerId(player.vote === 'abstain' ? 'abstain' : player.vote);
        }

        // Redirect back to tasks when voting ends
        if (!gameData.votingOngoing && gameData.votingEndsAt === undefined && timeLeft === 0) {
          setTimeout(() => {
            router.push(`/game/${gameId}/tasks?playerId=${encodeURIComponent(playerNickname)}`);
          }, 2000); // Show result for 2 seconds
        }
      }
    });

    return () => unsubscribe();
  }, [gameId, playerNickname]);

  // Countdown timer
  useEffect(() => {
    if (!game?.votingOngoing || !game.votingEndsAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((game.votingEndsAt! - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Auto-submit abstain if no vote was selected and player is alive
        if (!localPlayer?.vote && localPlayer?.alive !== false) {
          submitVote(gameId, localPlayer!.id, 'abstain');
        }
        // End voting after a short delay to allow all votes to sync
        setTimeout(() => {
          endVoting(gameId);
        }, 1500);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [game?.votingOngoing, game?.votingEndsAt, gameId, localPlayer]);

  const handleVote = async (targetId: string) => {
    if (!localPlayer || localPlayer.alive === false || localPlayer.vote) return;
    
    setSelectedPlayerId(targetId);
    await submitVote(gameId, localPlayer.id, targetId);
  };

  if (!game || !localPlayer) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Only alive players can vote
  if (localPlayer.alive === false) {
    return (
      <div className={styles.container}>
        <div className={styles.deadMessage}>
          <h1>You are dead</h1>
          <p>You cannot vote</p>
        </div>
      </div>
    );
  }

  // Get alive players (excluding self)
  const alivePlayers = game.players.filter(
    p => p.alive !== false && p.id !== localPlayer.id
  );

  const formatTime = (seconds: number) => {
    return seconds.toString().padStart(2, '0');
  };

  return (
    <div className={styles.container}>
      <div className={styles.votingContainer}>
        <h1 className={styles.title}>Vote</h1>
        <div className={styles.timer}>
          <div className={timeLeft <= 10 ? styles.timerUrgent : ''}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <p className={styles.instruction}>Who do you think is the impostor?</p>

        <div className={styles.playerList}>
          {alivePlayers.map((player) => (
            <button
              key={player.id}
              className={`${styles.playerButton} ${
                selectedPlayerId === player.id ? styles.selected : ''
              }`}
              onClick={() => handleVote(player.id)}
              disabled={!!localPlayer.vote}
            >
              <span className={styles.playerName}>{player.nickname}</span>
              {selectedPlayerId === player.id && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}

          <button
            className={`${styles.playerButton} ${styles.abstainButton} ${
              selectedPlayerId === 'abstain' ? styles.selected : ''
            }`}
            onClick={() => handleVote('abstain')}
            disabled={!!localPlayer.vote}
          >
            <span className={styles.playerName}>Abstain</span>
            {selectedPlayerId === 'abstain' && (
              <span className={styles.checkmark}>✓</span>
            )}
          </button>
        </div>

        {localPlayer.vote && (
          <p className={styles.votedMessage}>You have voted</p>
        )}
      </div>
    </div>
  );
}

