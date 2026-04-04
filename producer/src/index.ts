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
    },
});

io.on('connection', (socket: Socket) => {
    console.log('Producer Client Connected:', socket.id);

    socket.on('message', async (data) => {
        const { type } = data;
        console.log('Got Message', data);

        switch (type) {
            case 'populate-data':
                console.log('Populate Data triggered');
                await PopulateDataInRedis();
                send(
                    socket,
                    'populate-data-response',
                    'Data populated in Redis',
                );
                break;

            default:
                break;
        }
    });
});

const send = (socket: Socket, type: string, message: string) => {
    socket.emit('message', { type, message });
};

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Producer running on port ${PORT}`);
});
