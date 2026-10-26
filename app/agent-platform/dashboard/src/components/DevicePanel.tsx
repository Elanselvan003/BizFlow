import { useEffect, useRef } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import type { WsMsg } from "../hooks/useSocket";
import ControlOverlay from "./ControlOverlay";

interface Props {
  device: any;
  send: (m: WsMsg) => void;
  lastMessage: WsMsg | null;
}

export default function DevicePanel({ device, send, lastMessage }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { start, handle, stop, stream, state } = useWebRTC(send);

  useEffect(() => {
    if (!lastMessage) return;
    if (["answer", "ice"].includes(lastMessage.type)) handle(lastMessage);
  }, [lastMessage, handle]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <strong>{device.model ?? "Unknown device"}</strong>
          <span className={`dot ${device.status}`} /> {device.status}
        </div>
        <div className="actions">
          <button onClick={() => start(device.id)} disabled={state === "connecting"}>
            {state === "live" ? "Reconnect" : "View screen"}
          </button>
          <button onClick={stop}>Stop</button>
        </div>
      </div>

      <div className="screen-wrap">
        <video ref={videoRef} autoPlay playsInline muted />
        {state === "live" && (
          <ControlOverlay video={videoRef.current} deviceId={device.id} send={send} />
        )}
        {state !== "live" && <div className="placeholder">Screen: {state}</div>}
      </div>
    </div>
  );
}
