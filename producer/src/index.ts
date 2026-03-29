import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import PopulateDataInRedis from './PopulateDataInRedis';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

let ws = null;

io.on('connection', (socket) => {
    console.log('User Connected', socket.id);
    ws = socket;

    socket.on('message', async (data) => {
        const { type, message } = data;

        switch (type) {
            case 'populate-data':
                await PopulateDataInRedis();
                send(
                    socket,
                    'populate-data-response',
                    'Populated Data in Redis Queues',
                );
                break;
            case 'get-updates':
                break;
            default:
                send;
                break;
        }
    });
});

const send = (ws: Socket, type: string, message: string) => {
    const msg = {
        type,
        message,
    };

    ws.emit('message', msg);
};

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`WS Server running on port ${PORT}`);
    PopulateDataInRedis()
});
