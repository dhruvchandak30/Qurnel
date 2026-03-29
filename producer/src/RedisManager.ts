import { Redis } from '@upstash/redis'
type Priority = 'HIGH' | 'MEDIUM' | 'LOW';


export class RedisManager {
    redis: Redis;
    constructor() {
        this.redis = new Redis({
            url: process.env.REDIS_REST_URL,
            token: process.env.REDIS_REST_TOKEN,
        });
    }

    async push(priority: Priority, payload: any) {
        await this.redis.lpush(
            `queue:${priority.toLowerCase()}`,
            JSON.stringify(payload),
        );
    }

    // async pop(priority: Priority) {
    //     return await this.redis.rpop(`queue:${priority.toLowerCase()}`, 1);
    // }
    async pop() {
        const job =
            (await this.redis.rpop('queue:high')) ??
            (await this.redis.rpop('queue:medium')) ??
            (await this.redis.rpop('queue:low'));

        return job;
    }

    async length(priority: Priority) {
        return await this.redis.llen(`queue:${priority.toLowerCase()}`);
    }
}
