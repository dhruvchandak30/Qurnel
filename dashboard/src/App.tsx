"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import type { Priority, Job, ActiveJob, WorkerState, LogEntry, QueueLengths } from "./types";
import { formatTime, shortenWorker } from "./utils";
import { config } from "./config";


export default function App() {
  const workerSocketRef = useRef<Socket | null>(null);
  const producerSocketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [queueLengths, setQueueLengths] = useState<QueueLengths>({ high: 0, medium: 0, low: 0 });
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [workers, setWorkers] = useState<Map<string, WorkerState>>(new Map());
  const [log, setLog] = useState<LogEntry[]>([]);
  const [completed, setCompleted] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const totalQueued = queueLengths.high + queueLengths.medium + queueLengths.low;
  const maxQ = Math.max(queueLengths.high, queueLengths.medium, queueLengths.low, 1);
  const aliveWorkers = [...workers.values()].filter((w) => w.status !== "error").length;

  const fetchQueueLengths = useCallback(async () => {
    try {
      const res = await fetch(`${config.workerUrl}/queue-lengths`);
      const data: QueueLengths = await res.json();
      setQueueLengths(data);
    } catch {
      // server not ready yet
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchQueueLengths, 2000);
  }, [fetchQueueLengths]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pushLog = (entry: LogEntry) => {
    setLog((prev) => [entry, ...prev].slice(0, 20));
  };

  useEffect(() => {
    const workerSocket = io(config.workerUrl, { transports: ["websocket"] });
    const producerSocket = io(config.producerUrl, { transports: ["websocket"] });

    workerSocketRef.current = workerSocket;
    producerSocketRef.current = producerSocket;

    workerSocket.on("connect", () => {
      toast.success("Worker socket connected");
      fetchQueueLengths();
    });

    producerSocket.on("connect", () => {
      toast.success("Producer socket connected");
      fetchQueueLengths();
    });

    producerSocket.on("message", (data: { type: string; message: string }) => {
      if (data.type === "populate-data-response") {
        toast.success(data.message);
        fetchQueueLengths();
      }
    });

    workerSocket.on("message", (data) => {
      if (data.type === "start-working-response") {
        toast.success(data.message);
        setAllDone(false);
        setCompleted(0);
        setActiveJobs([]);
        setWorkers(new Map());
        setLog([]);
        startPolling();
      }

      if (data.event === "job:started") {
        const { job, workerId }: { job: Job; workerId: string } = data;
        setActiveJobs((prev) => [...prev, { job, workerId, startedAt: Date.now() }]);
        setWorkers((prev) => {
          const next = new Map(prev);
          const existing = next.get(workerId) ?? { workerId, status: "idle" as const, currentJob: null, jobsDone: 0 };
          next.set(workerId, { ...existing, status: "processing", currentJob: job });
          return next;
        });
        pushLog({ time: Date.now(), event: "job:started", workerId, job });
      }

      if (data.event === "job:completed") {
        const { job, workerId }: { job: Job; workerId: string } = data;
        setActiveJobs((prev) => prev.filter((a) => a.workerId !== workerId));
        setWorkers((prev) => {
          const next = new Map(prev);
          const existing = next.get(workerId);
          if (existing) {
            next.set(workerId, { ...existing, status: "processing", currentJob: null, jobsDone: existing.jobsDone + 1 });
          }
          return next;
        });
        setCompleted((prev) => prev + 1);
        pushLog({ time: Date.now(), event: "job:completed", workerId, job });
      }

      if (data.event === "worker:idle") {
        const { workerId } = data;
        setActiveJobs((prev) => prev.filter((a) => a.workerId !== workerId));
        setWorkers((prev) => {
          const next = new Map(prev);
          const existing = next.get(workerId);
          if (existing) {
            next.set(workerId, { ...existing, status: "idle", currentJob: null });
          }
          return next;
        });
        pushLog({ time: Date.now(), event: "worker:idle", workerId });
      }

      if (data.event === "worker:error") {
        const { workerId } = data;
        setWorkers((prev) => {
          const next = new Map(prev);
          const existing = next.get(workerId);
          if (existing) {
            next.set(workerId, { ...existing, status: "error", currentJob: null });
          }
          return next;
        });
        pushLog({ time: Date.now(), event: "worker:error", workerId });
        toast.error(`Worker ${shortenWorker(workerId)} crashed`);
      }

      if (data.type === "all-jobs-done") {
        setAllDone(true);
        setActiveJobs([]);
        stopPolling();
        fetchQueueLengths();
        toast.success("All jobs processed");
      }
    });

    return () => {
      workerSocket.disconnect();
      producerSocket.disconnect();
      stopPolling();
    };
  }, [fetchQueueLengths, startPolling, stopPolling]);

  const handlePopulate = () => {
    if (!producerSocketRef.current) return;
    producerSocketRef.current.emit("message", { type: "populate-data" });
  };

  const handleStartWorkers = () => {
    if (!workerSocketRef.current) return;
    workerSocketRef.current.emit("message", { type: "start-working" });
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111",
            color: "#fff",
            border: "0.5px solid #333",
            fontSize: "12px",
            fontFamily: "monospace",
          },
        }}
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-zinc-500 tracking-widest uppercase">Job Queue Monitor</span>
            {allDone && (
              <span className="text-xs text-green-500 border border-green-800 px-2 py-0.5 rounded">
                all done
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePopulate}
              className="text-xs border border-zinc-700 hover:border-blue-700 hover:text-blue-400 px-4 py-1.5 rounded transition-colors cursor-pointer"
            >
              populate queues
            </button>
            <button
              onClick={handleStartWorkers}
              className="text-xs border border-zinc-700 hover:border-red-800 hover:text-red-400 px-4 py-1.5 rounded transition-colors cursor-pointer"
            >
              start workers
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "total queued", value: totalQueued, sub: "pending jobs" },
            { label: "processing", value: activeJobs.length, sub: "active right now" },
            { label: "completed", value: completed, sub: "this session" },
            { label: "workers", value: workers.size === 0 ? "—" : `${aliveWorkers} / ${workers.size}`, sub: "alive" },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 rounded-lg p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{s.label}</div>
              <div className="text-2xl font-medium">{s.value}</div>
              <div className="text-xs text-zinc-600 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {(["high", "medium", "low"] as const).map((p) => {
            const count = queueLengths[p];
            const pct = Math.round((count / maxQ) * 100);
            const barColor: Record<string, string> = { high: "bg-red-600", medium: "bg-amber-500", low: "bg-green-600" };
            const badgeColor: Record<string, string> = {
              high: "text-red-400 border-red-900",
              medium: "text-amber-400 border-amber-900",
              low: "text-green-400 border-green-900",
            };
            const ranges: Record<string, string> = {
              high: "2–4.5s per job",
              medium: "3.8–8s per job",
              low: "7–12s per job",
            };
            return (
              <div key={p} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium tracking-widest uppercase text-zinc-300">{p}</span>
                  <span className={`text-xs border px-2 py-0.5 rounded ${badgeColor[p]}`}>priority</span>
                </div>
                <div className="text-3xl font-medium mb-1">{count}</div>
                <div className="text-xs text-zinc-600 mb-3">{ranges[p]}</div>
                <div className="h-0.5 bg-zinc-800 rounded">
                  <div
                    className={`h-0.5 rounded transition-all duration-500 ${barColor[p]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="border border-zinc-800 rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-xs text-zinc-500 tracking-widest uppercase">active jobs</span>
            <span className="text-xs text-zinc-700">live</span>
          </div>
          {activeJobs.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-700">no active jobs</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["job type", "priority", "worker", "user id", "started at", "status"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs text-zinc-600 tracking-wider uppercase font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeJobs.map((a, i) => (
                  <tr key={i} className="border-b border-zinc-900 last:border-0">
                    <td className="px-4 py-2.5 text-xs">{a.job.jobType}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <PriorityBadge p={a.job.priority} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">{shortenWorker(a.workerId)}</td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">{a.job.data.userId}</td>
                    <td className="px-4 py-2.5 text-xs text-zinc-600">{formatTime(a.startedAt)}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
                        processing
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border border-zinc-800 rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-zinc-800">
            <span className="text-xs text-zinc-500 tracking-widest uppercase">workers</span>
          </div>
          {workers.size === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-700">workers not started</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["worker id", "status", "current job", "jobs done"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs text-zinc-600 tracking-wider uppercase font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...workers.values()].map((w) => (
                  <tr key={w.workerId} className="border-b border-zinc-900 last:border-0">
                    <td className="px-4 py-2.5 text-xs text-zinc-500">{shortenWorker(w.workerId)}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <WorkerStatusBadge status={w.status} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-400">{w.currentJob?.jobType ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">{w.jobsDone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-xs text-zinc-500 tracking-widest uppercase">event log</span>
            <span className="text-xs text-zinc-700">last 20</span>
          </div>
          {log.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-700">no events yet</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["time", "event", "worker", "job type", "priority"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs text-zinc-600 tracking-wider uppercase font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.map((entry, i) => (
                  <tr key={i} className="border-b border-zinc-900 last:border-0">
                    <td className="px-4 py-2.5 text-xs text-zinc-600">{formatTime(entry.time)}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <EventBadge event={entry.event} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-500">{shortenWorker(entry.workerId)}</td>
                    <td className="px-4 py-2.5 text-xs text-zinc-400">{entry.job?.jobType ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs">
                      {entry.job ? <PriorityBadge p={entry.job.priority} /> : <span className="text-zinc-700">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({ p }: { p: Priority }) {
  const cls: Record<Priority, string> = {
    HIGH: "text-red-400 border-red-900",
    MEDIUM: "text-amber-400 border-amber-900",
    LOW: "text-green-400 border-green-900",
  };
  return <span className={`text-xs border px-1.5 py-0.5 rounded ${cls[p]}`}>{p}</span>;
}

function WorkerStatusBadge({ status }: { status: "processing" | "idle" | "error" }) {
  const map = {
    processing: { dot: "bg-blue-500 animate-pulse", label: "processing", text: "text-zinc-300" },
    idle: { dot: "bg-zinc-600", label: "idle", text: "text-zinc-500" },
    error: { dot: "bg-red-500", label: "error", text: "text-red-400" },
  };
  const s = map[status];
  return (
    <span className={`flex items-center gap-1.5 ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${s.dot}`} />
      {s.label}
    </span>
  );
}

function EventBadge({ event }: { event: LogEntry["event"] }) {
  const map: Record<LogEntry["event"], { label: string; cls: string }> = {
    "job:started": { label: "job:started", cls: "text-blue-400" },
    "job:completed": { label: "job:completed", cls: "text-green-400" },
    "worker:idle": { label: "worker:idle", cls: "text-zinc-500" },
    "worker:error": { label: "worker:error", cls: "text-red-400" },
    "all-jobs-done": { label: "all:done", cls: "text-green-300" },
  };
  const b = map[event];
  return <span className={`text-xs ${b.cls}`}>{b.label}</span>;
}