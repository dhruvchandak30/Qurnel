"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisManager = void 0;
const redis_1 = require("@upstash/redis");
class RedisManager {
    constructor() {
        this.redis = new redis_1.Redis({
            url: process.env.REDIS_REST_URL,
            token: process.env.REDIS_REST_TOKEN,
        });
    }
    async push(priority, payload) {
        await this.redis.lpush(`queue:${priority.toLowerCase()}`, JSON.stringify(payload));
    }
    // async pop(priority: Priority) {
    //     return await this.redis.rpop(`queue:${priority.toLowerCase()}`, 1);
    // }
    async pop() {
        const job = (await this.redis.rpop('queue:high')) ??
            (await this.redis.rpop('queue:medium')) ??
            (await this.redis.rpop('queue:low'));
        return job;
    }
    async length(priority) {
        return await this.redis.llen(`queue:${priority.toLowerCase()}`);
    }
}
exports.RedisManager = RedisManager;
