import { fork } from 'child_process';
import path from 'path';
import { Server } from 'socket.io';

const InitWorkers = (io: Server) => {
  const NUM_WORKERS = 3;

  let activeWorkers = NUM_WORKERS;
  let finishedWorkers = 0;

  console.log(`🚀 Starting ${NUM_WORKERS} workers...\n`);

  for (let i = 0; i < NUM_WORKERS; i++) {
    const worker = fork(path.join(__dirname, 'worker.js'));

    // 🟢 Messages from worker
    worker.on('message', (msg: any) => {
      console.log(`📩 Worker message:`, msg);

      // Forward to frontend
      io.emit('message', msg);

      // Track idle workers
      if (msg.event === 'worker:idle') {
        finishedWorkers++;

        if (finishedWorkers === activeWorkers) {
          console.log(`🎉 All workers finished processing`);

          io.emit('message', {
            type: 'all-jobs-done',
            message: 'All jobs processed successfully',
          });
        }
      }
    });

    // 🔴 Handle exit
    worker.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ Worker ${worker.pid} exited normally`);
      } else {
        console.log(`❌ Worker ${worker.pid} crashed. Restarting...`);

        // Restart ONLY on crash
        const newWorker = fork(path.join(__dirname, 'worker.js'));

        newWorker.on('message', (msg: any) => {
          io.emit('message', msg);
        });
      }
    });
  }
};

export default InitWorkers;