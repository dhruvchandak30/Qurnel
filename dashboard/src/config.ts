declare const process: { env: Record<string, string | undefined> };
const workerUrl = process.env["NEXT_PUBLIC_WORKER_URL"] ?? "http://localhost:3001";
const producerUrl = process.env["NEXT_PUBLIC_PRODUCER_URL"] ?? "http://localhost:3000";

export const config = {
  workerUrl,
  producerUrl,
};