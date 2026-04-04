"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const InitWorkers = (io) => {
    const NUM_WORKERS = 3;
    let activeWorkers = NUM_WORKERS;
    let finishedWorkers = 0;
    console.log(`🚀 Starting ${NUM_WORKERS} workers...\n`);
    for (let i = 0; i < NUM_WORKERS; i++) {
        const worker = (0, child_process_1.fork)(path_1.default.join(__dirname, 'worker.js'));
        // 🟢 Messages from worker
        worker.on('message', (msg) => {
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
            }
            else {
                console.log(`❌ Worker ${worker.pid} crashed. Restarting...`);
                // Restart ONLY on crash
                const newWorker = (0, child_process_1.fork)(path_1.default.join(__dirname, 'worker.js'));
                newWorker.on('message', (msg) => {
                    io.emit('message', msg);
                });
            }
        });
    }
};
exports.default = InitWorkers;
