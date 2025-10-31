'use client';

import { useState } from 'react';
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

export default function UploadTasksPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleUpload = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Check if tasks already exist
      const existingTasks = await getDocs(collection(db, 'tasks'));
      if (!existingTasks.empty) {
        setMessage(`⚠️ Tasks already exist (${existingTasks.size} tasks found). Delete them first if you want to re-upload.`);
        setLoading(false);
        return;
      }

      // Upload tasks
      const tasksRef = collection(db, 'tasks');
      let uploaded = 0;

      for (const task of tasks) {
        await addDoc(tasksRef, task);
        uploaded++;
      }

      setMessage(`✅ Successfully uploaded ${uploaded} tasks to Firestore!`);
    } catch (err: any) {
      console.error('Error uploading tasks:', err);
      setError(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        minWidth: '400px',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Upload Tasks to Firestore
        </h1>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '1rem' }}>This will upload {tasks.length} tasks:</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {tasks.map((task, i) => (
              <li key={i} style={{ 
                padding: '0.5rem', 
                marginBottom: '0.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '5px'
              }}>
                {i + 1}. {task.name} ({task.taskId})
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.1rem',
            background: loading 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem'
          }}
        >
          {loading ? 'Uploading...' : 'Upload Tasks'}
        </button>

        {message && (
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 107, 107, 0.2)',
            borderRadius: '8px',
            color: '#ff6b6b',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

