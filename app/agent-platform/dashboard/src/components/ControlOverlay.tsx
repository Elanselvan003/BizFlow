import { useRef } from "react";
import type { WsMsg } from "../hooks/useSocket";

interface Props {
  video: HTMLVideoElement | null;
  deviceId: string;
  send: (m: WsMsg) => void;
}

export default function ControlOverlay({ video, deviceId, send }: Props) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  // convert a click position on the displayed video -> intrinsic video pixels
  const toVideoCoords = (clientX: number, clientY: number) => {
    if (!video) return { x: 0, y: 0, w: 720, h: 1280 };
    const rect = video.getBoundingClientRect();
    const vw = video.videoWidth || 720;
    const vh = video.videoHeight || 1280;
    const x = ((clientX - rect.left) / rect.width) * vw;
    const y = ((clientY - rect.top) / rect.height) * vh;
    return { x, y, w: vw, h: vh };
  };

  const onDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const onUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = Math.abs(e.clientX - s.x);
    const dy = Math.abs(e.clientY - s.y);
    const dt = Date.now() - s.t;

    if (dx < 12 && dy < 12) {
      // tap or long press
      const { x, y, w, h } = toVideoCoords(e.clientX, e.clientY);
      send({ type: "control", deviceId, action: dt > 600 ? "longpress" : "tap", x, y, w, h });
    } else {
      // swipe
      const a = toVideoCoords(s.x, s.y);
      const b = toVideoCoords(e.clientX, e.clientY);
      send({ type: "control", deviceId, action: "swipe",
             x: a.x, y: a.y, x2: b.x, y2: b.y, duration: dt, w: a.w, h: a.h });
    }
  };

  const nav = (action: string) => send({ type: "control", deviceId, action });

  return (
    <>
      <div className="overlay" onPointerDown={onDown} onPointerUp={onUp} />
      <div className="nav-bar">
        <button onClick={() => nav("back")}>◀ Back</button>
        <button onClick={() => nav("home")}>⌂ Home</button>
        <button onClick={() => nav("recents")}>▢ Recents</button>
      </div>
    </>
  );
}
