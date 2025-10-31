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
  const [isAccessory, setIsAccessory] = useState(false);

  const handleJoin = async () => {
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }
    if (!isAccessory && !nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const gameId = await joinGame(gameCode.trim().toUpperCase(), nickname.trim(), isAccessory);
      if (gameId) {
        if (isAccessory) {
          router.push(`/game/${gameId}/accessory`);
        } else {
          router.push(`/game/${gameId}?playerId=${encodeURIComponent(nickname.trim())}`);
        }
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
        {!isAccessory && (
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
        )}
        <div className={styles.accessoryToggle}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isAccessory}
              onChange={(e) => setIsAccessory(e.target.checked)}
              disabled={loading}
            />
            <span>Join as Accessory</span>
          </label>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button 
          className={styles.button}
          onClick={handleJoin}
          disabled={loading}
        >
          {loading ? 'Joining...' : isAccessory ? 'Join as Accessory' : 'Join Game'}
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

