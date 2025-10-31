import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (for server-side)
if (getApps().length === 0) {
  // For Admin SDK, we can use service account or just initialize with project ID
  // Since you're using client SDK credentials, we'll use the project ID directly
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'among-us-irl-86233'
  });
}

const db = getFirestore();

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
    
    // Check if tasks already exist
    const existingTasks = await db.collection('tasks').limit(1).get();
    if (!existingTasks.empty) {
      console.log('⚠️  Tasks collection already has documents. Skipping upload.');
      console.log('   Delete existing tasks first if you want to re-upload.');
      process.exit(0);
    }
    
    const tasksRef = db.collection('tasks');
    
    for (const task of tasks) {
      await tasksRef.add(task);
      console.log(`✓ Added task: ${task.name} (${task.taskId})`);
    }
    
    console.log('\n✅ Successfully uploaded all 10 tasks to Firestore!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error uploading tasks:', error.message);
    console.error(error);
    process.exit(1);
  }
}

uploadTasks();
