"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const InitWorkers = (io) => {
    const NUM_WORKERS = 3;
    for (let i = 0; i < NUM_WORKERS; i++) {
        const worker = (0, child_process_1.fork)(path_1.default.join(__dirname, 'worker.js'));
        worker.on('message', (msg) => {
            io.emit('message', msg);
        });
        worker.on('exit', () => {
            console.log(`Worker ${i + 1} died, restarting...`);
            (0, child_process_1.fork)(path_1.default.join(__dirname, 'worker.js'));
        });
    }
};
exports.default = InitWorkers;
