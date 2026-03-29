"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisManager = void 0;
const redis_1 = require("@upstash/redis");
const JOB_TYPES = [
    'email-send',
    'sms-send',
    'report-gen',
    'image-resize',
    'data-export',
    'invoice-gen',
    'notification-push',
];
class RedisManager {
    redis;
    constructor() {
        this.redis = new redis_1.Redis({
            url: process.env.REDIS_REST_URL,
            token: process.env.REDIS_REST_TOKEN,
        });
    }
    async push(priority, payload) {
        await this.redis.lpush(`queue:${priority.toLowerCase()}`, JSON.stringify(payload));
    }
    async pop() {
        const job = (await this.redis.rpop('queue:high')) ??
            (await this.redis.rpop('queue:medium')) ??
            (await this.redis.rpop('queue:low'));
        return job ?? null;
    }
    async length(priority) {
        return await this.redis.llen(`queue:${priority.toLowerCase()}`);
    }
    async getAllLengths() {
        const high = await this.redis.llen('queue:high');
        const medium = await this.redis.llen('queue:medium');
        const low = await this.redis.llen('queue:low');
        return { high, medium, low };
    }
}
exports.RedisManager = RedisManager;
