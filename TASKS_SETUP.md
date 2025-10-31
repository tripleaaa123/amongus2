# Task Setup Guide

## Firestore Structure

Tasks are stored in a Firestore collection called `tasks`. Each task document should have the following structure:

```javascript
{
  name: "Task Display Name",  // This is shown to players
  taskId: "unique-task-id"      // This is used for later functionality
}
```

## Adding Tasks to Firestore

You need to add **10 tasks** to the Firestore `tasks` collection. Here's how:

### Option 1: Using Firebase Console (Easiest)

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `among-us-irl-86233`
3. Go to **Firestore Database** → **Data**
4. Click **Start collection** (if `tasks` doesn't exist)
5. Collection ID: `tasks`
6. For each task, click **Add document**:
   - Click **Auto-ID** to generate a document ID
   - Add these fields:
     - `name` (string): The task name displayed to players (e.g., "Fix the Reactor")
     - `taskId` (string): Unique identifier (e.g., "reactor_fix")
   - Click **Save**

Repeat for all 10 tasks.

### Option 2: Using Firebase Admin SDK (Programmatic)

If you prefer to add tasks programmatically, you can use a script. Example:

```javascript
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

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

tasks.forEach(async (task) => {
  await addDoc(collection(db, 'tasks'), task);
});
```

### Example Task Documents

Here are 10 example tasks you can add:

1. **name**: "Fix the Reactor" | **taskId**: "reactor_fix"
2. **name**: "Submit Scan" | **taskId**: "submit_scan"
3. **name**: "Fuel Engines" | **taskId**: "fuel_engines"
4. **name**: "Clear Asteroids" | **taskId**: "clear_asteroids"
5. **name**: "Inspect Sample" | **taskId**: "inspect_sample"
6. **name**: "Calibrate Distributor" | **taskId**: "calibrate_distributor"
7. **name**: "Empty Garbage" | **taskId**: "empty_garbage"
8. **name**: "Align Engine Output" | **taskId**: "align_engine"
9. **name**: "Prime Shields" | **taskId**: "prime_shields"
10. **name**: "Start Reactor" | **taskId**: "start_reactor"

## How It Works

- When the host starts the game, the system:
  1. Fetches all 10 tasks from Firestore
  2. Randomly assigns 7 tasks to each **crewmate**
  3. Imposters get **no tasks**

- Each player will see their assigned tasks on the tasks page after role assignment.

