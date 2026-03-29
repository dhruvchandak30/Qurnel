"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RedisManager_1 = require("./RedisManager");
const redis = new RedisManager_1.RedisManager();
const workerId = `worker-${process.pid}`;
const processJob = async (job) => {
    await new Promise(r => setTimeout(r, job.timeToProcess));
};
const startWorker = async () => {
    console.log(`[${workerId}] Started`);
    while (true) {
        const job = await redis.pop();
        if (job) {
            console.log(`[${workerId}] Picked up job → type: ${job.jobType} | priority: ${job.priority}`);
            process.send?.({ event: 'job:started', job, workerId });
            await processJob(job);
            console.log(`[${workerId}] Completed job → type: ${job.jobType} | took: ${job.timeToProcess}ms`);
            process.send?.({ event: 'job:completed', job, workerId });
        }
        else {
            console.log(`[${workerId}] No jobs found, polling again in 1s...`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
};
startWorker();
