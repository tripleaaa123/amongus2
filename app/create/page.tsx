'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGame } from '@/lib/gameUtils';
import styles from './page.module.css';

export default function CreateGame() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [imposterCount, setImposterCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const gameId = await createGame(nickname.trim(), imposterCount);
      router.push(`/game/${gameId}?playerId=${encodeURIComponent(nickname.trim())}`);
    } catch (err: any) {
      console.error('Create game error:', err);
      setError(err.message || 'Failed to create game. Please check Firebase configuration.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create Game</h1>
      <div className={styles.form}>
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
        <div className={styles.inputGroup}>
          <label htmlFor="imposters">Number of Imposters</label>
          <input
            id="imposters"
            type="number"
            value={imposterCount}
            onChange={(e) => setImposterCount(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="10"
            disabled={loading}
          />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button 
          className={styles.button}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Game'}
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

