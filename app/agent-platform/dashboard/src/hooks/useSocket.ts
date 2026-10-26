import { useEffect, useRef, useState, useCallback } from "react";
import { wsUrl } from "../api";

export type WsMsg = Record<string, any>;

export function useSocket(onMessage: (m: WsMsg) => void) {
  const ref = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const handler = useRef(onMessage);
  handler.current = onMessage;

  useEffect(() => {
    let alive = true;
    let attempt = 0;

    const connect = () => {
      if (!alive) return;
      const ws = new WebSocket(wsUrl());
      ref.current = ws;

      ws.onopen = () => { attempt = 0; setConnected(true); };
      ws.onmessage = (e) => {
        try { handler.current(JSON.parse(e.data)); } catch {}
      };
      ws.onclose = () => {
        setConnected(false);
        if (!alive) return;
        attempt++;
        setTimeout(connect, Math.min(30000, 1000 * 2 ** Math.min(attempt, 5)));
      };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => { alive = false; ref.current?.close(); };
  }, []);

  const send = useCallback((m: WsMsg) => {
    ref.current?.readyState === WebSocket.OPEN &&
      ref.current.send(JSON.stringify(m));
  }, []);

  return { connected, send };
}
