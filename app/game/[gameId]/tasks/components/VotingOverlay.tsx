'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import styles from './VotingOverlay.module.css';

interface VotingOverlayProps {
  gameId: string;
  playerNickname: string;
}

export default function VotingOverlay({ gameId, playerNickname }: VotingOverlayProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to vote page after a brief moment to show the overlay
    const timer = setTimeout(() => {
      router.push(`/game/${gameId}/vote?playerId=${encodeURIComponent(playerNickname)}`);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameId, playerNickname, router]);

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.icon}>🗳️</div>
        <h1 className={styles.title}>VOTING TIME</h1>
        <p className={styles.message}>Redirecting to voting...</p>
      </div>
    </div>
  );
}

