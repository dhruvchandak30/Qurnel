export type Priority = "HIGH" | "MEDIUM" | "LOW";

export interface Job {
  priority: Priority;
  timeToProcess: number;
  jobType: string;
  data: {
    userId: number;
    retries: number;
    createdAt: number;
  };
}

export interface ActiveJob {
  job: Job;
  workerId: string;
  startedAt: number;
}

export interface WorkerState {
  workerId: string;
  status: "processing" | "idle" | "error";
  currentJob: Job | null;
  jobsDone: number;
}

export interface LogEntry {
  time: number;
  event: "job:started" | "job:completed" | "worker:idle" | "worker:error" | "all-jobs-done";
  workerId: string;
  job?: Job;
}

export interface QueueLengths {
  high: number;
  medium: number;
  low: number;
}