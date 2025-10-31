import { collection, doc, setDoc, getDoc, updateDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
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
  role?: 'crewmate' | 'imposter';
  tasks?: Task[];
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
        isHost: true
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
    isHost: false
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

export function assignRandomTasks(allTasks: Task[], count: number): Task[] {
  // Shuffle tasks
  const shuffled = [...allTasks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Return first 'count' tasks
  return shuffled.slice(0, count);
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

  // Shuffle players
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  // Assign roles and tasks
  players.forEach((player, index) => {
    player.role = index < imposterCount ? 'imposter' : 'crewmate';
    // Everyone gets tasks (including imposters to help them blend in)
    player.tasks = assignRandomTasks(allTasks, 7);
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
  const players = gameData.players.map(player => {
    if (player.id === playerId) {
      const updatedTasks = player.tasks?.map(task => {
        if (task.taskId === taskId) {
          return { ...task, completed: true, proofImageUrl: imageUrl };
        }
        return task;
      });
      return { ...player, tasks: updatedTasks };
    }
    return player;
  });

  await updateDoc(gameRef, { players });

  // Also store proof separately for admin review
  const proofRef = doc(collection(db, 'proofs'));
  await setDoc(proofRef, {
    gameId,
    playerId,
    playerNickname: gameData.players.find(p => p.id === playerId)?.nickname || '',
    taskId,
    imageUrl,
    timestamp: Date.now()
  });
}

export async function triggerSabotage(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, { sabotageOngoing: true });
}

export async function resolveSabotage(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, { sabotageOngoing: false });
}

export async function endGame(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, { gameEnd: true });
}

export async function callMeeting(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, { meetingCalled: true });
}

export async function endMeeting(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  await updateDoc(gameRef, { meetingCalled: false });
}

