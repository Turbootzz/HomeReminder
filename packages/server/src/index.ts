import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

dotenv.config();

const prisma = new PrismaClient();
const app: Express = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: "*", // Allow all origins for now - restrict in production!
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5001;

// Middleware
app.use(cors()); // Use cors middleware
app.use(express.json()); // Parse JSON bodies

// Basic Routes (Example - Expand Later)
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP' });
});

// --- Task Routes (Add these later in a separate file/router) ---
// GET /api/tasks -> Fetch active tasks and today's completions
// POST /api/tasks -> Create a new task
// PUT /api/tasks/:id -> Update a task (e.g., archive)
// POST /api/tasks/:id/complete -> Mark task as complete

// --- Socket.IO Logic ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

});

// Function to broadcast updates (call this after DB changes)
export const broadcastUpdate = (event: string, data: any) => {
    io.emit(event, data);
    console.log(`Broadcasted event: ${event}`)
}


// Start Server
server.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server')
    await prisma.$disconnect();
    server.close(() => {
        console.log('HTTP server closed')
        process.exit(0)
    })
})

// --- TODO: Add Actual API Endpoints using Prisma ---
// Example endpoint placeholder
app.get('/api/tasks/today', async (req: Request, res: Response) => {
    try {
        // Basic example: Fetch non-archived tasks
        const tasks = await prisma.task.findMany({
            where: { archived: false },
            include: {
                completions: {
                    // Add filtering for 'today' later
                    orderBy: { completedAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});