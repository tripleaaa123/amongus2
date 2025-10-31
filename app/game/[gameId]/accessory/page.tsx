'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { subscribeToGame, resolveSabotage, endGame, callMeeting, endMeeting, startVoting, Game } from '@/lib/gameUtils';
import styles from './page.module.css';

interface Puzzle {
  num1: number;
  num2: number;
  answer: number;
  userAnswer: string;
}

export default function AccessoryPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [game, setGame] = useState<Game | null>(null);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerActiveRef = useRef<boolean>(false);

  // Generate 3 random 2-digit addition puzzles
  const generatePuzzles = (): Puzzle[] => {
    const newPuzzles: Puzzle[] = [];
    for (let i = 0; i < 3; i++) {
      const num1 = Math.floor(Math.random() * 90) + 10; // 10-99
      const num2 = Math.floor(Math.random() * 90) + 10; // 10-99
      newPuzzles.push({
        num1,
        num2,
        answer: num1 + num2,
        userAnswer: ''
      });
    }
    return newPuzzles;
  };

  // Play alarm sound
  const playAlarm = () => {
    if (alarmAudioRef.current && !alarmPlaying) {
      alarmAudioRef.current.volume = 1.0;
      alarmAudioRef.current.loop = true;
      alarmAudioRef.current.play().catch(err => {
        console.error('Error playing alarm:', err);
      });
      setAlarmPlaying(true);
    }
  };

  // Stop alarm sound
  const stopAlarm = () => {
    if (alarmAudioRef.current && alarmPlaying) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
      setAlarmPlaying(false);
    }
  };

  useEffect(() => {
    if (!gameId) return;

    const unsubscribe = subscribeToGame(gameId, (gameData) => {
      if (gameData) {
        setGame(gameData);

        // When sabotage starts
        if (gameData.sabotageOngoing && puzzles.length === 0) {
          const newPuzzles = generatePuzzles();
          setPuzzles(newPuzzles);
          setTimeLeft(60);
          playAlarm();
        }

        // When sabotage is resolved
        if (!gameData.sabotageOngoing && puzzles.length > 0) {
          stopAlarm();
          setPuzzles([]);
          setTimeLeft(60);
          timerActiveRef.current = false;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    });

    return () => {
      unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopAlarm();
    };
  }, [gameId, puzzles.length]);

  // Separate useEffect for countdown timer
  useEffect(() => {
    // Only start timer when sabotage is ongoing, we have puzzles, and timer isn't already active
    if (game?.sabotageOngoing && puzzles.length > 0 && !timerActiveRef.current) {
      timerActiveRef.current = true;
      
      // Start countdown
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            // Time's up!
            timerActiveRef.current = false;
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            endGame(gameId);
            stopAlarm();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }

    // Stop timer if conditions aren't met
    if (!game?.sabotageOngoing || puzzles.length === 0) {
      timerActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      timerActiveRef.current = false;
    };
  }, [game?.sabotageOngoing, puzzles.length, gameId]);

  const updateAnswer = (index: number, value: string) => {
    // Only allow numbers
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    setPuzzles(prev => prev.map((puzzle, i) => 
      i === index ? { ...puzzle, userAnswer: value } : puzzle
    ));
  };

  const checkAllSolved = () => {
    return puzzles.every(puzzle => 
      puzzle.userAnswer.trim() !== '' && 
      parseInt(puzzle.userAnswer) === puzzle.answer
    );
  };

  // Check if all puzzles are solved in real-time
  useEffect(() => {
    if (puzzles.length > 0 && checkAllSolved() && game?.sabotageOngoing) {
      const submitAsync = async () => {
        await resolveSabotage(gameId);
        setPuzzles([]);
        setTimeLeft(60);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        stopAlarm();
      };
      submitAsync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzles, game?.sabotageOngoing, gameId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!game) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Connecting...</div>
      </div>
    );
  }

  const showPuzzles = game.sabotageOngoing && puzzles.length > 0;
  const showMeetingControls = game.meetingCalled;

  const handleCallMeeting = async () => {
    await callMeeting(gameId);
  };

  const handleEndMeeting = async () => {
    await endMeeting(gameId);
  };

  const handleGoToVote = async () => {
    await startVoting(gameId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Accessory Device</h1>
        <p className={styles.subtitle}>Game Code: <strong>{game.code}</strong></p>

        {!showPuzzles && !showMeetingControls && (
          <div className={styles.waiting}>
            <p>Waiting for sabotage...</p>
            <p className={styles.status}>Status: {game.sabotageOngoing ? 'SABOTAGE!' : 'Normal'}</p>
            <button 
              className={styles.callMeetingButton}
              onClick={handleCallMeeting}
            >
              📢 Call Meeting
            </button>
          </div>
        )}

        {showMeetingControls && (
          <div className={styles.meetingContainer}>
            <h2 className={styles.meetingTitle}>Meeting in Progress</h2>
            <div className={styles.meetingButtons}>
              <button 
                className={styles.meetingButton}
                onClick={handleGoToVote}
              >
                Go to Vote
              </button>
              <button 
                className={styles.meetingButton}
                onClick={handleEndMeeting}
              >
                End Meeting
              </button>
            </div>
          </div>
        )}

        {showPuzzles && (
          <div className={styles.puzzleContainer}>
            <div className={styles.countdown}>
              <div className={timeLeft <= 10 ? styles.countdownUrgent : ''}>
                Time: {formatTime(timeLeft)}
              </div>
            </div>

            <h2 className={styles.puzzleTitle}>Solve the Puzzles!</h2>

            <div className={styles.puzzles}>
              {puzzles.map((puzzle, index) => {
                const isCorrect = puzzle.userAnswer.trim() !== '' && 
                                  parseInt(puzzle.userAnswer) === puzzle.answer;
                return (
                  <div 
                    key={index} 
                    className={`${styles.puzzleItem} ${isCorrect ? styles.correct : ''}`}
                  >
                    <div className={styles.puzzleQuestion}>
                      <span>{puzzle.num1}</span>
                      <span>+</span>
                      <span>{puzzle.num2}</span>
                      <span>=</span>
                    </div>
                    <input
                      type="text"
                      value={puzzle.userAnswer}
                      onChange={(e) => updateAnswer(index, e.target.value)}
                      className={styles.answerInput}
                      maxLength={3}
                      autoFocus={index === 0}
                    />
                    {isCorrect && <span className={styles.checkmark}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hidden audio element for alarm */}
        <audio ref={alarmAudioRef} preload="auto">
          <source src="/alarm.mp3" type="audio/mpeg" />
          <source src="/alarm.ogg" type="audio/ogg" />
        </audio>
      </div>
    </div>
  );
}

