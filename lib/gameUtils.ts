import { collection, doc, setDoc, getDoc, updateDoc, onSnapshot, query, where, getDocs, deleteField } from 'firebase/firestore';
import { db } from '../firebase';

export interface Task {
  id: string;
  name: string;
  taskId: string;
  completed?: boolean;
  proofImageUrl?: string;
}

export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  role?: 'crewmate' | 'imposter' | 'snitch';
  tasks?: Task[];
  alive?: boolean;
  vote?: string; // playerId of who they voted for, or 'abstain'
  completedAllTasks?: boolean;
}

export interface Game {
  id: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  imposterCount: number;
  createdAt: number;
  sabotageOngoing?: boolean;
  gameEnd?: boolean;
  meetingCalled?: boolean;
  votingOngoing?: boolean;
  votingEndsAt?: number;
  winner?: 'imposters' | 'crewmates' | 'snitch';
  sabotageCooldownUntil?: number;
}

export function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createGame(hostNickname: string, imposterCount: number): Promise<string> {
  try {
    const gameCode = generateGameCode();
    const hostId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const gameData: Omit<Game, 'id'> = {
      code: gameCode,
      hostId: hostId,
      status: 'waiting',
      players: [{
        id: hostId,
        nickname: hostNickname,
        isHost: true,
        alive: true
      }],
      imposterCount: imposterCount,
      createdAt: Date.now()
    };

    const gameRef = doc(collection(db, 'games'));
    await setDoc(gameRef, gameData);
    
    return gameRef.id;
  } catch (error: any) {
    console.error('Error creating game:', error);
    throw new Error(`Failed to create game: ${error.message || 'Unknown error'}`);
  }
}

export async function joinGame(gameCode: string, nickname: string, isAccessory: boolean = false): Promise<string | null> {
  const gamesRef = collection(db, 'games');
  const q = query(gamesRef, where('code', '==', gameCode.toUpperCase()));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const gameDoc = querySnapshot.docs[0];
  const gameData = gameDoc.data() as Game;
  
  if (gameData.status !== 'waiting' && !isAccessory) {
    return null;
  }

  if (isAccessory) {
    // Accessory devices don't join as players, just return game ID
    return gameDoc.id;
  }

  const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const newPlayer: Player = {
    id: playerId,
    nickname: nickname,
    isHost: false,
    alive: true
  };

  await updateDoc(gameDoc.ref, {
    players: [...gameData.players, newPlayer]
  });

  return gameDoc.id;
}

export async function updateGameStatus(gameId: string, status: Game['status']) {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, { status });
}

export async function updateImposterCount(gameId: string, imposterCount: number) {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) return;
  
  const gameData = gameSnap.data() as Game;
  const maxImposters = Math.min(gameData.players.length - 1, 10);
  const validCount = Math.max(1, Math.min(imposterCount, maxImposters));
  
  await updateDoc(gameRef, { imposterCount: validCount });
}

export async function getAllTasks(): Promise<Task[]> {
  const tasksRef = collection(db, 'tasks');
  const querySnapshot = await getDocs(tasksRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

export function getCrewmateTasks(allTasks: Task[]): Task[] {
  // Get task_9 (always assigned) and tasks 1-7 (for random selection)
  const task9 = allTasks.find(task => task.taskId === 'task_9');
  const tasks1to7 = allTasks.filter(task => {
    const taskNum = parseInt(task.taskId.replace('task_', ''));
    return taskNum >= 1 && taskNum <= 7;
  });
  
  // Shuffle tasks 1-7 and pick 3 random ones
  const shuffled = [...tasks1to7];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const randomTasks = shuffled.slice(0, 3);
  
  // Combine task_9 with 3 random tasks from 1-7
  const result: Task[] = [];
  if (task9) result.push(task9);
  result.push(...randomTasks);
  
  // Sort by task number for consistency
  return result.sort((a, b) => {
    const numA = parseInt(a.taskId.replace('task_', ''));
    const numB = parseInt(b.taskId.replace('task_', ''));
    return numA - numB;
  });
}

export function getTask8(allTasks: Task[]): Task | null {
  return allTasks.find(task => task.taskId === 'task_8') || null;
}

export async function assignRoles(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) return;

  const gameData = gameSnap.data() as Game;
  const players = [...gameData.players];
  const imposterCount = gameData.imposterCount;

  // Get all tasks from Firestore
  const allTasks = await getAllTasks();
  
  if (allTasks.length === 0) {
    throw new Error('No tasks found in database. Please add tasks first.');
  }

  // Get task_9 (common for everyone) and tasks 1-7 (for random selection)
  const task9 = allTasks.find(task => task.taskId === 'task_9');
  if (!task9) {
    throw new Error('Task 9 not found in database.');
  }
  
  const tasks1to7 = allTasks.filter(task => {
    const taskNum = parseInt(task.taskId.replace('task_', ''));
    return taskNum >= 1 && taskNum <= 7;
  });
  
  if (tasks1to7.length < 3) {
    throw new Error(`Need at least 3 tasks from task_1 to task_7, found ${tasks1to7.length}`);
  }

  // Shuffle players
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  // Assign roles and tasks
  // All players get task_9 + 3 random tasks from 1-7 (task_8 is only for dead crewmates)
  players.forEach((player, index) => {
    if (index < imposterCount) {
      player.role = 'imposter';
    }
    
    // Each player gets task_9 + 3 random tasks from 1-7
    const shuffled = [...tasks1to7];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const randomTasks = shuffled.slice(0, 3);
    
    // Combine task_9 with 3 random tasks
    const playerTasks: Task[] = [{ ...task9 }, ...randomTasks.map(t => ({ ...t }))];
    
    // Sort by task number for consistency
    player.tasks = playerTasks.sort((a, b) => {
      const numA = parseInt(a.taskId.replace('task_', ''));
      const numB = parseInt(b.taskId.replace('task_', ''));
      return numA - numB;
    });
    
    if (player.role !== 'imposter') {
      player.completedAllTasks = false;
    }
  });

  // Randomly assign one snitch from the non-imposter players
  const nonImposterPlayers = players.filter((_, index) => index >= imposterCount);
  if (nonImposterPlayers.length > 0) {
    const snitchIndex = Math.floor(Math.random() * nonImposterPlayers.length);
    nonImposterPlayers[snitchIndex].role = 'snitch';
  }

  // Assign remaining non-imposter, non-snitch players as crewmates
  players.forEach((player) => {
    if (!player.role) {
      player.role = 'crewmate';
    }
  });

  await updateDoc(gameRef, {
    players: players,
    status: 'playing'
  });
}

export function subscribeToGame(gameId: string, callback: (game: Game | null) => void) {
  const gameRef = doc(db, 'games', gameId);
  return onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Game);
    } else {
      callback(null);
    }
  });
}

export async function completeTask(gameId: string, playerId: string, taskId: string, imageUrl: string) {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) return;

  const gameData = gameSnap.data() as Game;
  const player = gameData.players.find(p => p.id === playerId);
  
  const players = gameData.players.map(p => {
    if (p.id === playerId) {
      const updatedTasks = p.tasks?.map(task => {
        if (task.taskId === taskId) {
          return { ...task, completed: true, proofImageUrl: imageUrl };
        }
        return task;
      });
      
      let completedAllTasks = p.completedAllTasks || false;
      
      // If completing task_8, mark as completed all tasks
      if (taskId === 'task_8') {
        completedAllTasks = true;
      } else {
        // Check if all assigned tasks are completed (task_9 is always assigned, plus their 3 random tasks from 1-7)
        // We check all their assigned tasks (excluding task_8 which is only for dead crewmates)
        const assignedTasks = updatedTasks?.filter(t => {
          const taskNum = parseInt(t.taskId.replace('task_', ''));
          return taskNum !== 8; // Exclude task_8 from completion check
        }) || [];
        completedAllTasks = assignedTasks.length > 0 && assignedTasks.every(t => t.completed === true);
      }
      
      return { ...p, tasks: updatedTasks, completedAllTasks };
    }
    return p;
  });

  await updateDoc(gameRef, { players });

  // Also store proof separately for admin review
  const proofRef = doc(collection(db, 'proofs'));
  await setDoc(proofRef, {
    gameId,
    playerId,
    playerNickname: player?.nickname || '',
    taskId,
    imageUrl,
    timestamp: Date.now()
  });

  // Check win conditions after task completion (for crewmates and snitch)
  if (player?.role === 'crewmate' || player?.role === 'snitch') {
    await checkWinConditions(gameId);
  }
}

export async function triggerSabotage(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) return;
  
  const gameData = gameSnap.data() as Game;
  
  // Check if cooldown is active
  const now = Date.now();
  if (gameData.sabotageCooldownUntil && now < gameData.sabotageCooldownUntil) {
    throw new Error('Sabotage is on cooldown. Please wait before triggering again.');
  }
  
  await updateDoc(gameRef, { sabotageOngoing: true });
}

export async function resolveSabotage(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  // Set cooldown for 2 minutes (120000 ms) from now
  const cooldownUntil = Date.now() + 120000;
  await updateDoc(gameRef, { 
    sabotageOngoing: false,
    sabotageCooldownUntil: cooldownUntil
  });
}

export async function endGame(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  // When sabotage timer hits 0, imposters win
  await updateDoc(gameRef, { 
    gameEnd: true,
    status: 'finished',
    winner: 'imposters'
  });
}

export async function callMeeting(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, { meetingCalled: true });
}

export async function endMeeting(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, { meetingCalled: false });
}

export async function startVoting(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  const votingEndsAt = Date.now() + 30000; // 30 seconds from now
  await updateDoc(gameRef, { 
    votingOngoing: true,
    votingEndsAt: votingEndsAt,
    meetingCalled: false
  });
}

export async function submitVote(gameId: string, voterId: string, targetId: string) {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) return;

  const gameData = gameSnap.data() as Game;
  const players = gameData.players.map(player => {
    if (player.id === voterId) {
      return { ...player, vote: targetId };
    }
    return player;
  });

  await updateDoc(gameRef, { players });
}

export async function endVoting(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) return;

  const gameData = gameSnap.data() as Game;
  
  // Count votes from alive players only
  const alivePlayers = gameData.players.filter(p => p.alive !== false);
  const votes: Record<string, number> = {};
  let abstainCount = 0;

  alivePlayers.forEach(player => {
    if (!player.vote || player.vote === 'abstain') {
      abstainCount++;
    } else {
      votes[player.vote] = (votes[player.vote] || 0) + 1;
    }
  });

  // Find player(s) with most votes
  const maxVotes = Object.keys(votes).length > 0 ? Math.max(...Object.values(votes)) : 0;
  const topVotees = maxVotes > 0 
    ? Object.entries(votes)
        .filter(([_, count]) => count === maxVotes)
        .map(([playerId]) => playerId)
    : [];

  // Only kill if there's a clear winner (not a tie)
  // Get task_8 for crewmates who need it
  const allTasks = await getAllTasks();
  const task8 = getTask8(allTasks);
  
  const players = gameData.players.map(player => {
    if (topVotees.length === 1 && topVotees[0] === player.id && maxVotes > 0) {
      // Player was voted out - mark as dead
      const updatedPlayer = { ...player, alive: false };
      delete updatedPlayer.vote;
      
      // Handle task reassignment for crewmates/snitch who didn't complete all tasks
      if ((player.role === 'crewmate' || player.role === 'snitch') && task8) {
        // Check if they completed all their assigned tasks (task_9 + 3 random from 1-7)
        // If they didn't complete all tasks, assign task_8
        if (!player.completedAllTasks) {
          // Remove all tasks and assign only task_8
          updatedPlayer.tasks = [{ ...task8, completed: false }];
          updatedPlayer.completedAllTasks = false;
        }
      }
      
      return updatedPlayer;
    }
    // Clear votes for next round
    const updatedPlayer = { ...player };
    delete updatedPlayer.vote;
    return updatedPlayer;
  });

  await updateDoc(gameRef, { 
    players,
    votingOngoing: false,
    votingEndsAt: deleteField()
  });

  // Check win conditions after voting
  await checkWinConditions(gameId);
}

export async function checkWinConditions(gameId: string): Promise<boolean> {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) return false;

  const gameData = gameSnap.data() as Game;
  
  // Only check if game is still playing
  if (gameData.status !== 'playing') return false;

  const alivePlayers = gameData.players.filter(p => p.alive !== false);
  const aliveImposters = alivePlayers.filter(p => p.role === 'imposter');
  const aliveCrewmates = alivePlayers.filter(p => p.role === 'crewmate' || p.role === 'snitch');

  let winner: 'imposters' | 'crewmates' | undefined;

  // Condition 1: Imposters >= Crewmates (Imposter win)
  if (aliveImposters.length >= aliveCrewmates.length && aliveCrewmates.length > 0) {
    winner = 'imposters';
  }
  // Condition 2: All imposters are dead (Crewmate win)
  else if (aliveImposters.length === 0) {
    winner = 'crewmates';
  }
  // Condition 3: All crewmate tasks completed (Crewmate win) - includes snitch (dead or alive)
  else {
    const crewmatePlayers = gameData.players.filter(p => p.role === 'crewmate' || p.role === 'snitch');
    const allCrewmateTasksCompleted = crewmatePlayers.length > 0 && 
      crewmatePlayers.every(crewmate => crewmate.completedAllTasks === true);

    if (allCrewmateTasksCompleted) {
      winner = 'crewmates';
    }
  }

  // If there's a winner, end the game
  if (winner) {
    await updateDoc(gameRef, {
      status: 'finished',
      winner: winner,
      gameEnd: true
    });
    return true;
  }

  return false;
}

export async function endGameManually(gameId: string, winner: 'imposters' | 'crewmates' | 'snitch') {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, {
    status: 'finished',
    winner: winner,
    gameEnd: true
  });
}

export async function markPlayerAsDead(gameId: string, playerId: string) {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) return;

  const gameData = gameSnap.data() as Game;
  const allTasks = await getAllTasks();
  const task8 = getTask8(allTasks);
  
  const players = gameData.players.map(player => {
    if (player.id === playerId) {
      // Only handle task reassignment for crewmates and snitch
      if (player.role === 'crewmate' || player.role === 'snitch') {
        // Check if they completed all their assigned tasks (task_9 + 3 random from 1-7)
        // If they didn't complete all tasks, assign task_8
        if (!player.completedAllTasks && task8) {
          // Remove all tasks and assign only task_8
          return {
            ...player,
            alive: false,
            tasks: [{ ...task8, completed: false }],
            completedAllTasks: false
          };
        }
        // If already completed all tasks, just mark as dead
        return { ...player, alive: false };
      }
      // For imposters, just mark as dead
      return { ...player, alive: false };
    }
    return player;
  });

  await updateDoc(gameRef, { players });

  // Check win conditions after marking someone as dead
  await checkWinConditions(gameId);
}

export interface Proof {
  id: string;
  gameId: string;
  playerId: string;
  playerNickname: string;
  taskId: string;
  imageUrl: string;
  timestamp: number;
}

export async function getGameProofs(gameId: string): Promise<Proof[]> {
  const proofsRef = collection(db, 'proofs');
  const q = query(proofsRef, where('gameId', '==', gameId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proof));
}

