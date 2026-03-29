"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RedisManager_1 = require("./RedisManager");
const JOB_TYPES = [
    'email-send',
    'sms-send',
    'report-gen',
    'image-resize',
    'data-export',
    'invoice-gen',
    'notification-push',
];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generatePayload = (priority) => {
    const timeToProcess = {
        HIGH: randomInt(2000, 4500),
        MEDIUM: randomInt(3800, 8000),
        LOW: randomInt(7000, 12000),
    }[priority];
    return {
        priority,
        timeToProcess,
        jobType: JOB_TYPES[randomInt(0, JOB_TYPES.length - 1)],
        data: {
            userId: randomInt(1000, 9999),
            retries: 0,
            createdAt: Date.now(),
        },
    };
};
const PopulateDataInRedis = () => {
    const high = Array.from({ length: randomInt(5, 15) }, () => generatePayload('HIGH'));
    const medium = Array.from({ length: randomInt(5, 15) }, () => generatePayload('MEDIUM'));
    const low = Array.from({ length: randomInt(5, 15) }, () => generatePayload('LOW'));
    const redis = new RedisManager_1.RedisManager();
    for (let i = 0; i < high.length; i++) {
        redis.push('HIGH', high[i]);
    }
    console.log(`Pushed ${high.length} Records in High Priority Queue`);
    for (let i = 0; i < medium.length; i++) {
        redis.push('MEDIUM', medium[i]);
    }
    console.log(`Pushed ${medium.length} Records in medium Priority Queue`);
    for (let i = 0; i < low.length; i++) {
        redis.push('LOW', low[i]);
    }
    console.log(`Pushed ${low.length} Records in low Priority Queue`);
};
exports.default = PopulateDataInRedis;
