import { fork } from 'child_process';
import path from 'path';
import { Server } from 'socket.io';

const InitWorkers = (io: Server) => {
    const NUM_WORKERS = 3;

    for (let i = 0; i < NUM_WORKERS; i++) {
        const worker = fork(path.join(__dirname, 'worker.js'));

        worker.on('message', (msg: any) => {
            io.emit('message', msg)
        });

        worker.on('exit', () => {
            console.log(`Worker ${i + 1} died, restarting...`);
            fork(path.join(__dirname, 'worker.js'));
        });
    }
};

export default InitWorkers;