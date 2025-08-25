// src/lib/queue.ts
import { Queue } from 'bullmq';

// Parse the Redis URL from environment variables
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');

const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port),
  // Add password if your Redis instance has one
  // password: redisUrl.password
};

// Create a new queue named 'scans' that will process our accessibility audit jobs.
// We export this instance to be used elsewhere in our application for adding jobs.
export const scanQueue = new Queue('scans', { connection });

console.log('BullMQ queue initialized and connected to Redis.');