'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Among Us IRL</h1>
      <div className={styles.buttonGroup}>
        <button 
          className={styles.button}
          onClick={() => router.push('/create')}
        >
          Create Game
        </button>
        <button 
          className={styles.button}
          onClick={() => router.push('/join')}
        >
          Join Game
        </button>
      </div>
    </div>
  );
}

