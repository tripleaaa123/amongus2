'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { subscribeToGame, Game, Task } from '@/lib/gameUtils';
import styles from './page.module.css';

export default function TasksPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const playerNickname = searchParams.get('playerId') || '';
  
  const [game, setGame] = useState<Game | null>(null);
  const [localPlayer, setLocalPlayer] = useState<any>(null);

  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = subscribeToGame(gameId, (gameData) => {
      if (gameData) {
        setGame(gameData);
        const player = gameData.players.find(p => p.nickname === playerNickname);
        setLocalPlayer(player);
      }
    });

    return () => unsubscribe();
  }, [gameId, playerNickname]);

  if (!game || !localPlayer) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const tasks = localPlayer.tasks || [];

  return (
    <div className={styles.container}>
      <div className={styles.tasksContainer}>
        <h1 className={styles.title}>Your Tasks</h1>
        
        <div className={styles.roleInfo}>
          <span className={`${styles.roleBadge} ${localPlayer.role === 'imposter' ? styles.imposter : styles.crewmate}`}>
            {localPlayer.role === 'imposter' ? '🔴 IMPOSTER' : '🔵 CREWMATE'}
          </span>
        </div>

        {localPlayer.role === 'imposter' ? (
          <div className={styles.imposterMessage}>
            <h2>You have no tasks!</h2>
            <p>Your goal is to eliminate crewmates without being caught.</p>
            <p>Sabotage and blend in with the crewmates.</p>
          </div>
        ) : (
          <>
            <p className={styles.taskCount}>You have {tasks.length} tasks to complete:</p>
            <ul className={styles.taskList}>
              {tasks.map((task: Task, index: number) => (
                <li key={task.id || index} className={styles.taskItem}>
                  <span className={styles.taskNumber}>{index + 1}</span>
                  <span className={styles.taskName}>{task.name}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className={styles.gameInfo}>
          <p>Game Code: <strong>{game.code}</strong></p>
          <p>Players: {game.players.length}</p>
        </div>
      </div>
    </div>
  );
}

