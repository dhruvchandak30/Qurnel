"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RedisManager_1 = require("./RedisManager");
const redis = new RedisManager_1.RedisManager();
const workerId = `worker-${process.pid}`;
const processJob = async (job) => {
    await new Promise((r) => setTimeout(r, job.timeToProcess));
};
const startWorker = async () => {
    console.log(`[${workerId}] Started`);
    try {
        while (true) {
            const job = await redis.pop();
            if (!job) {
                console.log(`[${workerId}] No jobs left. Exiting...`);
                process.send?.({
                    event: 'worker:idle',
                    workerId,
                });
                process.exit(0);
            }
            console.log(`[${workerId}] Picked job → type: ${job.jobType} | priority: ${job.priority}`);
            process.send?.({
                event: 'job:started',
                job,
                workerId,
            });
            await processJob(job);
            console.log(`[${workerId}] Completed job → type: ${job.jobType}`);
            process.send?.({
                event: 'job:completed',
                job,
                workerId,
            });
        }
    }
    catch (err) {
        console.error(`[${workerId}] Error:`, err);
        process.send?.({
            event: 'worker:error',
            workerId,
            error: String(err),
        });
        process.exit(1);
    }
};
startWorker();
