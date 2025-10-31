import { collection, doc, setDoc, getDoc, updateDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  role?: 'crewmate' | 'imposter';
}

export interface Game {
  id: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  imposterCount: number;
  createdAt: number;
}

export function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createGame(hostNickname: string, imposterCount: number): Promise<string> {
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
}

export async function joinGame(gameCode: string, nickname: string): Promise<string | null> {
  const gamesRef = collection(db, 'games');
  const q = query(gamesRef, where('code', '==', gameCode.toUpperCase()));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const gameDoc = querySnapshot.docs[0];
  const gameData = gameDoc.data() as Game;
  
  if (gameData.status !== 'waiting') {
    return null;
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

export async function assignRoles(gameId: string) {
  const gameRef = doc(db, 'games', gameId);
  const gameSnap = await getDoc(gameRef);
  
  if (!gameSnap.exists()) return;

  const gameData = gameSnap.data() as Game;
  const players = [...gameData.players];
  const imposterCount = gameData.imposterCount;

  // Shuffle players
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  // Assign roles
  players.forEach((player, index) => {
    player.role = index < imposterCount ? 'imposter' : 'crewmate';
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

