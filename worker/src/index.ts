import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import InitWorkers from './InitWorkers';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
    console.log('User Connected', socket.id);

    socket.on('message', async (data) => {
        const { type } = data;

        switch (type) {
            case 'start-working':
                InitWorkers(io)
                send(socket, 'start-working-response', 'Workers Started')
                break
            default:
                break
        }
    });
});

const send = (ws: Socket, type: string, message: string) => {
    ws.emit('message', { type, message });
};

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    InitWorkers(io)
});