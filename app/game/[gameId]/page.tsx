'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { subscribeToGame, assignRoles, updateImposterCount, Game } from '@/lib/gameUtils';
import SabotageOverlay from './tasks/components/SabotageOverlay';
import styles from './page.module.css';

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const playerNickname = searchParams.get('playerId') || '';
  
  const [game, setGame] = useState<Game | null>(null);
  const [localPlayer, setLocalPlayer] = useState<any>(null);
  const [roleShown, setRoleShown] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = subscribeToGame(gameId, (gameData) => {
      if (gameData) {
        setGame(gameData);
        // Find local player by nickname
        const player = gameData.players.find(p => p.nickname === playerNickname);
        setLocalPlayer(player);
        
        // If game is playing and player has role but hasn't seen it yet, show role then redirect
        if (gameData.status === 'playing' && player?.role && !roleShown) {
          setRoleShown(true);
          // Show role for 3 seconds, then redirect to tasks
          setTimeout(() => {
            router.push(`/game/${gameId}/tasks?playerId=${encodeURIComponent(playerNickname)}`);
          }, 3000);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId, playerNickname, router, roleShown]);
  
  const handleStartGame = async () => {
    if (!game || !localPlayer?.isHost) return;
    setError('');
    try {
      await assignRoles(gameId);
    } catch (err: any) {
      setError(err.message || 'Failed to start game. Make sure tasks are added to Firestore.');
      console.error('Start game error:', err);
    }
  };

  const handleUpdateImposterCount = async (count: number) => {
    if (!game || !localPlayer?.isHost || game.status !== 'waiting') return;
    await updateImposterCount(gameId, count);
  };

  if (!game) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading game...</div>
      </div>
    );
  }

  if (game.status === 'playing' && localPlayer?.role) {
    return (
      <div className={styles.container}>
        <div className={styles.roleContainer}>
          <h1 className={styles.roleTitle}>Your Role</h1>
          <div className={`${styles.roleCard} ${localPlayer.role === 'imposter' ? styles.imposter : styles.crewmate}`}>
            <div className={styles.roleIcon}>
              {localPlayer.role === 'imposter' ? '🔴' : '🔵'}
            </div>
            <h2 className={styles.roleName}>
              {localPlayer.role === 'imposter' ? 'IMPOSTER' : 'CREWMATE'}
            </h2>
            <p className={styles.roleDescription}>
              {localPlayer.role === 'imposter' 
                ? 'You are an Imposter! Your goal is to eliminate crewmates without being caught.'
                : 'You are a Crewmate! Find and vote out the imposters.'
              }
            </p>
          </div>
          <div className={styles.gameInfo}>
            <p>Game Code: <strong>{game.code}</strong></p>
            <p>Players: {game.players.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.lobby}>
        <h1 className={styles.lobbyTitle}>Game Lobby</h1>
        <div className={styles.gameCode}>
          <span className={styles.codeLabel}>Game Code:</span>
          <span className={styles.codeValue}>{game.code}</span>
        </div>

        {localPlayer?.isHost && game.status === 'waiting' && (
          <div className={styles.hostControls}>
            <div className={styles.inputGroup}>
              <label htmlFor="imposters">Number of Imposters: {game.imposterCount}</label>
              <input
                id="imposters"
                type="range"
                min="1"
                max={Math.min(game.players.length - 1, 10)}
                value={game.imposterCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  handleUpdateImposterCount(count);
                }}
              />
            </div>
            <button 
              className={styles.startButton}
              onClick={handleStartGame}
              disabled={game.players.length < 2}
            >
              Start Game
            </button>
            {game.players.length < 2 && (
              <p className={styles.warning}>Need at least 2 players to start</p>
            )}
            {error && (
              <div className={styles.error}>{error}</div>
            )}
          </div>
        )}

        <div className={styles.playersList}>
          <h2 className={styles.playersTitle}>Players ({game.players.length})</h2>
          <ul className={styles.players}>
            {game.players.map((player) => (
              <li key={player.id} className={styles.player}>
                <span className={styles.playerName}>
                  {player.nickname}
                  {player.isHost && <span className={styles.hostBadge}> (Host)</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {game.status === 'waiting' && (
          <p className={styles.waitingText}>
            {localPlayer?.isHost 
              ? 'Adjust imposters and click Start Game when ready'
              : 'Waiting for host to start the game...'
            }
          </p>
        )}
      </div>
      {game?.sabotageOngoing && <SabotageOverlay />}
    </div>
  );
}

