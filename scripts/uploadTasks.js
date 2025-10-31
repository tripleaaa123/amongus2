const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tasks = [
  { name: "Fix the Reactor", taskId: "reactor_fix" },
  { name: "Submit Scan", taskId: "submit_scan" },
  { name: "Fuel Engines", taskId: "fuel_engines" },
  { name: "Clear Asteroids", taskId: "clear_asteroids" },
  { name: "Inspect Sample", taskId: "inspect_sample" },
  { name: "Calibrate Distributor", taskId: "calibrate_distributor" },
  { name: "Empty Garbage", taskId: "empty_garbage" },
  { name: "Align Engine Output", taskId: "align_engine" },
  { name: "Prime Shields", taskId: "prime_shields" },
  { name: "Start Reactor", taskId: "start_reactor" }
];

async function uploadTasks() {
  try {
    console.log('Starting task upload...');
    const tasksRef = collection(db, 'tasks');
    
    for (const task of tasks) {
      await addDoc(tasksRef, task);
      console.log(`✓ Added task: ${task.name} (${task.taskId})`);
    }
    
    console.log('\n✅ Successfully uploaded all 10 tasks to Firestore!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading tasks:', error.message);
    process.exit(1);
  }
}

uploadTasks();

