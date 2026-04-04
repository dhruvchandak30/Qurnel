import { Redis } from '@upstash/redis';

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

interface Payload {
    priority: Priority;
    timeToProcess: number;
    jobType: string;
    data: Record<string, unknown>;
}

export class RedisManager {
    redis: Redis;

    constructor() {
        this.redis = new Redis({
            url: process.env.REDIS_REST_URL!,
            token: process.env.REDIS_REST_TOKEN!,
        });
    }

    async push(priority: Priority, payload: any) {
        await this.redis.lpush(
            `queue:${priority.toLowerCase()}`,
            JSON.stringify(payload),
        );
    }

    async pop() {
        const job =
            (await this.redis.rpop('queue:high')) ??
            (await this.redis.rpop('queue:medium')) ??
            (await this.redis.rpop('queue:low'));
        return (job as unknown as Payload) ?? null;
    }

    async length(priority: Priority) {
        return await this.redis.llen(`queue:${priority.toLowerCase()}`);
    }

    async getAllLengths() {
        const high = await this.redis.llen('queue:high');
        const medium = await this.redis.llen('queue:medium');
        const low = await this.redis.llen('queue:low');
        return { high, medium, low };
    }
}
