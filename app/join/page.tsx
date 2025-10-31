'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinGame } from '@/lib/gameUtils';
import styles from './page.module.css';

export default function JoinGame() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const gameId = await joinGame(gameCode.trim().toUpperCase(), nickname.trim());
      if (gameId) {
        router.push(`/game/${gameId}?playerId=${encodeURIComponent(nickname.trim())}`);
      } else {
        setError('Game not found or game already started');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to join game. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Join Game</h1>
      <div className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="gameCode">Game Code</label>
          <input
            id="gameCode"
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="Enter game code"
            maxLength={6}
            disabled={loading}
            style={{ textTransform: 'uppercase' }}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="nickname">Your Nickname</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Enter your nickname"
            maxLength={20}
            disabled={loading}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button 
          className={styles.button}
          onClick={handleJoin}
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Join Game'}
        </button>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
          disabled={loading}
        >
          Back
        </button>
      </div>
    </div>
  );
}

