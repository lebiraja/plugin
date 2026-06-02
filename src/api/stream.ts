import { getApiBaseUrl } from "./client";
import type { SendMessageRequest, ToolsEnabled } from "./sessions";
import type { DeepResearchRequest } from "../types";

/**
 * SSE helpers.
 *
 * The backend streams `text/event-stream` for chat tokens and deep-research
 * progress. EventSource only does GET, and these are POSTs with JSON bodies, so
 * we read the fetch body stream and parse `data:` frames ourselves.
 */

async function* readSSE(
  response: Response,
  signal?: AbortSignal
): AsyncGenerator<unknown> {
  if (!response.ok || !response.body) {
    throw new Error(`Stream failed: ${response.status} ${response.statusText}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const line = frame.split("\n").find((l) => l.startsWith("data: "));
        if (line) {
          const payload = line.slice(6).trim();
          if (payload) yield JSON.parse(payload);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface ChatTokenEvent {
  type: "meta" | "token" | "done";
  content?: string;
  rag?: boolean;
  web_search?: boolean;
  message_id?: string;
  tokens?: { prompt: number; completion: number; total: number };
  latency?: number;
  citations?: Array<{ title: string; url: string; snippet: string }>;
  retrieved_context?: Array<{ source: string; content: string; similarity: number }>;
}

/** Stream a chat message; yields token/meta/done events. */
export async function* streamSessionMessage(
  sessionId: string,
  request: SendMessageRequest,
  signal?: AbortSignal
): AsyncGenerator<ChatTokenEvent> {
  const response = await fetch(
    `${getApiBaseUrl()}/sessions/${sessionId}/message/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    }
  );
  for await (const event of readSSE(response, signal)) {
    yield event as ChatTokenEvent;
  }
}

export interface ResearchProgressEvent {
  stage: string;
  progress: number;
  message?: string;
  result?: unknown;
}

/** Stream deep research; yields stage-progress events then the final result. */
export async function* streamDeepResearch(
  request: DeepResearchRequest,
  signal?: AbortSignal
): AsyncGenerator<ResearchProgressEvent> {
  const response = await fetch(`${getApiBaseUrl()}/deep-research/conduct/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  for await (const event of readSSE(response, signal)) {
    yield event as ResearchProgressEvent;
  }
}

export type { ToolsEnabled };
