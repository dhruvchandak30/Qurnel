import { fork } from 'child_process';
import path from 'path';
import { Server } from 'socket.io';

const InitWorkers = (io: Server) => {
    const NUM_WORKERS = 3;

    let finishedWorkers = 0;

    console.log(`Starting ${NUM_WORKERS} workers...`);

    for (let i = 0; i < NUM_WORKERS; i++) {
        const worker = fork(path.join(__dirname, 'worker.js'));

        worker.on('message', (msg: any) => {
            console.log('Worker message:', msg);

            io.emit('message', msg);

            if (msg.event === 'worker:idle') {
                finishedWorkers++;

                if (finishedWorkers === NUM_WORKERS) {
                    console.log('All workers finished processing');

                    io.emit('message', {
                        type: 'all-jobs-done',
                        message: 'All jobs processed successfully',
                    });
                }
            }
        });

        worker.on('exit', (code) => {
            if (code === 0) {
                console.log(`Worker ${worker.pid} exited normally`);
            } else {
                console.log(`Worker ${worker.pid} crashed. Restarting...`);

                const newWorker = fork(path.join(__dirname, 'worker.js'));

                newWorker.on('message', (msg: any) => {
                    io.emit('message', msg);
                });
            }
        });
    }
};

export default InitWorkers;
