import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

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

export async function GET() {
  try {
    // Check if tasks already exist
    const existingTasks = await getDocs(collection(db, 'tasks'));
    if (!existingTasks.empty) {
      return NextResponse.json({ 
        message: 'Tasks already exist in Firestore',
        count: existingTasks.size 
      });
    }

    // Upload tasks
    const tasksRef = collection(db, 'tasks');
    const uploaded = [];

    for (const task of tasks) {
      const docRef = await addDoc(tasksRef, task);
      uploaded.push({ id: docRef.id, ...task });
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully uploaded ${uploaded.length} tasks`,
      tasks: uploaded
    });
  } catch (error: any) {
    console.error('Error uploading tasks:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

