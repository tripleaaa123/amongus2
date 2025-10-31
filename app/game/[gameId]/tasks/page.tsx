'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { subscribeToGame, Game, Task } from '@/lib/gameUtils';
import InfoModal from './components/InfoModal';
import ScanModal from './components/ScanModal';
import ActionsModal from './components/ActionsModal';
import SabotageOverlay from './components/SabotageOverlay';
import MeetingOverlay from './components/MeetingOverlay';
import VotingOverlay from './components/VotingOverlay';
import EndGameOverlay from './components/EndGameOverlay';
import HostEndGameModal from './components/HostEndGameModal';
import styles from './page.module.css';

export default function TasksPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const playerNickname = searchParams.get('playerId') || '';
  
  const [game, setGame] = useState<Game | null>(null);
  const [localPlayer, setLocalPlayer] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showHostEndGame, setShowHostEndGame] = useState(false);

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

  const handleTaskComplete = () => {
    // Task completion updates come from Firestore subscription
    // This just forces a refresh if needed
  };

  if (!game || !localPlayer) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const tasks = localPlayer.tasks || [];
  const completedCount = tasks.filter((t: Task) => t.completed).length;

  return (
    <div className={styles.container}>
      <div className={styles.tasksContainer}>
        <h1 className={styles.title}>Your Tasks</h1>
        
        <p className={styles.taskCount}>
          {completedCount} of {tasks.length} tasks completed
        </p>
        <ul className={styles.taskList}>
          {tasks.map((task: Task, index: number) => (
            <li 
              key={task.id || index} 
              className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}
            >
              <span className={styles.taskNumber}>{index + 1}</span>
              <span className={styles.taskName}>{task.name}</span>
              {task.completed && <span className={styles.checkmark}>✓</span>}
            </li>
          ))}
        </ul>

        <div className={styles.gameInfo}>
          <p>Game Code: <strong>{game.code}</strong></p>
          <p>Players: {game.players.length}</p>
        </div>

        <nav className={styles.navBar}>
          <button className={styles.navButton} onClick={() => setShowInfo(true)}>
            Info
          </button>
          <button className={styles.navButton} onClick={() => setShowScan(true)}>
            Scan
          </button>
          {localPlayer?.alive !== false && (
            <button className={styles.navButton} onClick={() => setShowActions(true)}>
              Actions
            </button>
          )}
          {localPlayer?.isHost && (
            <button className={styles.hostButton} onClick={() => setShowHostEndGame(true)}>
              End Game
            </button>
          )}
        </nav>
      </div>

      {showInfo && (
        <InfoModal 
          role={localPlayer.role} 
          onClose={() => setShowInfo(false)} 
        />
      )}

      {showScan && (
        <ScanModal
          gameId={gameId}
          playerId={localPlayer.id}
          playerTasks={tasks}
          onClose={() => setShowScan(false)}
          onTaskComplete={handleTaskComplete}
        />
      )}

      {showActions && (
        <ActionsModal
          role={localPlayer.role}
          gameId={gameId}
          onClose={() => setShowActions(false)}
        />
      )}

      {showHostEndGame && (
        <HostEndGameModal
          gameId={gameId}
          onClose={() => setShowHostEndGame(false)}
        />
      )}

      {game?.status === 'finished' && game?.winner && (
        <EndGameOverlay game={game} />
      )}
      {game?.status === 'playing' && game?.sabotageOngoing && localPlayer?.alive !== false && <SabotageOverlay />}
      {game?.status === 'playing' && game?.meetingCalled && !game?.sabotageOngoing && localPlayer?.alive !== false && <MeetingOverlay />}
      {game?.status === 'playing' && game?.votingOngoing && !game?.sabotageOngoing && localPlayer?.alive !== false && (
        <VotingOverlay gameId={gameId} playerNickname={playerNickname} />
      )}
    </div>
  );
}

