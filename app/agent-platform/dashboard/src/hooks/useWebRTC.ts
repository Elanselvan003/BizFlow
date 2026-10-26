import { useRef, useState, useCallback } from "react";
import { getIce } from "../api";
import type { WsMsg } from "./useSocket";

export function useWebRTC(send: (m: WsMsg) => void) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<string>("idle");

  const start = useCallback(async (targetDeviceId: string) => {
    stop();
    const ice = await getIce();
    const pc = new RTCPeerConnection({ iceServers: ice });
    pcRef.current = pc;
    setDeviceId(targetDeviceId);
    setState("connecting");

    pc.addTransceiver("video", { direction: "recvonly" });

    pc.ontrack = (e) => { setStream(e.streams[0]); setState("live"); };
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        send({
          type: "ice", deviceId: targetDeviceId,
          sdpMid: e.candidate.sdpMid,
          sdpMLineIndex: e.candidate.sdpMLineIndex,
          candidate: e.candidate.candidate,
        });
      }
    };
    pc.onconnectionstatechange = () => {
      setState(pc.connectionState);
      if (pc.connectionState === "failed") setState("failed");
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    send({ type: "offer", deviceId: targetDeviceId, sdp: offer.sdp });
  }, [send]);

  const handle = useCallback(async (m: WsMsg) => {
    const pc = pcRef.current;
    if (!pc) return;
    if (m.type === "answer" && m.sdp) {
      await pc.setRemoteDescription({ type: "answer", sdp: m.sdp });
    } else if (m.type === "ice" && m.candidate) {
      try {
        await pc.addIceCandidate({
          sdpMid: m.sdpMid, sdpMLineIndex: m.sdpMLineIndex, candidate: m.candidate,
        });
      } catch {}
    }
  }, []);

  const stop = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    setStream(null);
    setDeviceId(null);
    setState("idle");
  }, []);

  return { start, handle, stop, stream, deviceId, state };
}
