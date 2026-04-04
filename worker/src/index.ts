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
    cors: { origin: '*' },
});

io.on('connection', (socket: Socket) => {
    console.log('Worker Client Connected:', socket.id);

    socket.on('message', async (data) => {
        const { type } = data;

        switch (type) {
            case 'start-working':
                send(socket, 'start-working-response', 'Workers Started');
                InitWorkers(io);
                break;

            default:
                break;
        }
    });
});

const send = (socket: Socket, type: string, message: string) => {
    socket.emit('message', { type, message });
};

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Worker server running on port ${PORT}`);
});
