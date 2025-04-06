import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import 'assets/styles/global.css'; // Make sure Tailwind is imported via index.css -> main.tsx

// Define types to match Prisma schema (or generate from Prisma)
interface Completion {
  id: number;
  completedBy: string;
  completedAt: string; // ISO String date
}

interface Task {
  id: number;
  title: string;
  description?: string | null;
  completions: Completion[];
  // Add other fields if needed
}

// Define the server URL (use environment variables for better config)
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Effect for Socket Connection ---
  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server via WebSocket:', newSocket.id);
    });

    // Listen for updates pushed from the server
    newSocket.on('task_updated', (updatedTaskData) => {
      console.log('Received task_updated event:', updatedTaskData);
      // --- TODO: Implement logic to update the specific task in the `tasks` state ---
      // This might involve fetching all tasks again or cleverly merging the update
      fetchTasks(); // Simple approach: refetch all tasks on any update
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []); // Run only once on mount

  // --- Effect for Fetching Initial Tasks ---
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In Docker, this might be http://server:5001 if frontend talks directly to backend container
      // But for browser access via Nginx proxy, use the backend's exposed route
      const response = await fetch(`${SERVER_URL}/api/tasks/today`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Task[] = await response.json();
      setTasks(data);
    } catch (e: any) {
      console.error("Failed to fetch tasks:", e);
      setError(`Failed to load tasks: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(); // Fetch tasks on initial load
  }, []); // Run only once on mount


  // --- Handler for Marking Task Complete ---
  const handleMarkComplete = async (taskId: number) => {
    // --- TODO: Implement User Selection (Simple prompt for now) ---
    const user = prompt("Who is completing this task? (e.g., Mom, Dad, Me)");
    if (!user) return; // User cancelled

    try {
      const response = await fetch(`${SERVER_URL}/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completedBy: user }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // No need to manually update state here if Socket.IO 'task_updated' event
      // triggers a refetch or handles the update directly.
      console.log(`Task ${taskId} marked complete by ${user}`);

    } catch (e: any) {
       console.error("Failed to mark task complete:", e);
       alert(`Error: ${e.message}`); // Show error to user
    }
  };

  // --- Render Logic ---
  if (isLoading) return <div className="p-4 text-center">Loading tasks...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center">Daily Tasks</h1>

      <div className="space-y-4">
        {tasks.length === 0 && <p className="text-center text-gray-500">No tasks found.</p>}

        {tasks.map((task) => (
          <div key={task.id} className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">{task.title}</h2>
            {task.description && <p className="text-gray-600 mb-3">{task.description}</p>}

            {/* --- TODO: Add better logic to check if completed *today* --- */}
            {task.completions.length > 0 ? (
              <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                Completed by: <strong>{task.completions[0].completedBy}</strong> at {new Date(task.completions[0].completedAt).toLocaleTimeString()}
                {/* Show only the latest completion for now */}
              </div>
            ) : (
              <button
                onClick={() => handleMarkComplete(task.id)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Mark as Done
              </button>
            )}

             {/* Optional: Show completion history if needed */}
             {/* {task.completions.length > 1 && ( ... show older ones ... )} */}
          </div>
        ))}
      </div>

      {/* --- TODO: Add form/button to create new tasks --- */}
    </div>
  );
}

export default App;