import { useCallback, useEffect, useMemo, useState } from "react";
import Login from "./components/Login";
import LiveMap from "./components/LiveMap";
import DevicePanel from "./components/DevicePanel";
import { useSocket, type WsMsg } from "./hooks/useSocket";
import { createInvite, getToken, listDevices } from "./api";

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [devices, setDevices] = useState<any[]>([]);
  const [markers, setMarkers] = useState<Record<string, any>>({});
  const [invite, setInvite] = useState<string>("");
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WsMsg | null>(null);

  const refresh = useCallback(() => {
    listDevices().then(setDevices).catch(() => {});
  }, []);

  const onMessage = useCallback((m: WsMsg) => {
    setLastMessage(m);
    if (m.type === "location") {
      setMarkers((prev) => ({
        ...prev,
        [m.deviceId]: { id: m.deviceId, lat: m.lat, lng: m.lng, label: m.deviceId.slice(0, 8) },
      }));
    }
    if (m.type === "device_online" || m.type === "device_offline") refresh();
  }, [refresh]);

  const { connected, send } = useSocket(onMessage);

  useEffect(() => { if (authed) refresh(); }, [authed, refresh]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selected),
    [devices, selected],
  );

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div className="app">
      <header>
        <h1>Orvian Dashboard</h1>
        <span className={`conn ${connected ? "on" : "off"}`}>
          {connected ? "● connected" : "○ reconnecting"}
        </span>
        <button onClick={async () => {
          const r = await createInvite();
          setInvite(r.link);
          navigator.clipboard?.writeText(r.link);
        }}>New invite link</button>
      </header>

      {invite && (
        <div className="invite-banner">
          Invite link (copied): <code>{invite}</code>
        </div>
      )}

      <div className="layout">
        <aside>
          <h3>Devices</h3>
          {devices.length === 0 && <p className="muted">No devices yet. Send an invite link.</p>}
          {devices.map((d) => (
            <div
              key={d.id}
              className={`device ${selected === d.id ? "active" : ""}`}
              onClick={() => setSelected(d.id)}
            >
              <div className="device-name">{d.model ?? "Unknown"}</div>
              <div className="device-meta">
                <span className={`dot ${d.status}`} /> {d.status}
              </div>
            </div>
          ))}
        </aside>

        <main>
          <LiveMap markers={markers} />
          {selectedDevice
            ? <DevicePanel device={selectedDevice} send={send} lastMessage={lastMessage} />
            : <div className="hint">Select a device to view its screen</div>}
        </main>
      </div>
    </div>
  );
}
