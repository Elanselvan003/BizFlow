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

  // Real-time device data streams
  const [telemetry, setTelemetry] = useState<Record<string, any>>({});
  const [appEvents, setAppEvents] = useState<Record<string, Array<{ pkg: string; name: string; time: number }>>>({});
  const [installedApps, setInstalledApps] = useState<Record<string, Array<{ name: string; package: string }>>>({});
  const [screenFrames, setScreenFrames] = useState<Record<string, string>>({});

  const refresh = useCallback(() => {
    listDevices().then((devs) => {
      setDevices(devs);
      if (devs.length > 0 && !selected) {
        setSelected(devs[0].id);
      }
    }).catch(() => {});
  }, [selected]);

  const onMessage = useCallback((m: WsMsg | any) => {
    const devId = m.deviceId;

    if (m.type === "location" && devId) {
      setMarkers((prev) => ({
        ...prev,
        [devId]: { id: devId, lat: m.lat, lng: m.lng, label: devId.slice(0, 8) },
      }));
    }

    if (m.type === "telemetry" && devId) {
      setTelemetry((prev) => ({
        ...prev,
        [devId]: { ...(prev[devId] || {}), ...m },
      }));
      if (m.lat && m.lng) {
        setMarkers((prev) => ({
          ...prev,
          [devId]: { id: devId, lat: m.lat, lng: m.lng, label: devId.slice(0, 8) },
        }));
      }
    }

    if (m.type === "app_event" && devId) {
      setAppEvents((prev) => {
        const list = prev[devId] ? [...prev[devId]] : [];
        list.unshift({ pkg: m.packageName, name: m.appName, time: m.timestamp || Date.now() });
        return { ...prev, [devId]: list.slice(0, 50) };
      });
      setTelemetry((prev) => ({
        ...prev,
        [devId]: { ...(prev[devId] || {}), activeApp: m.appName, activePackage: m.packageName },
      }));
    }

    if (m.type === "installed_apps" && devId && Array.isArray(m.apps)) {
      setInstalledApps((prev) => ({
        ...prev,
        [devId]: m.apps,
      }));
    }

    if (m.type === "screen_frame" && devId && m.frame) {
      setScreenFrames((prev) => ({
        ...prev,
        [devId]: m.frame,
      }));
    }

    if (m.type === "device_online" || m.type === "device_offline") {
      refresh();
    }
  }, [refresh]);

  const { connected, send } = useSocket(onMessage);

  useEffect(() => {
    if (authed) refresh();
  }, [authed, refresh]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selected),
    [devices, selected],
  );

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div className="app">
      <header>
        <h1>Orvian Fleet Control</h1>
        <span className={`conn ${connected ? "on" : "off"}`}>
          {connected ? "● Live WebSocket Active" : "○ Reconnecting to Hub"}
        </span>
        <button
          onClick={async () => {
            const r = await createInvite();
            setInvite(r.link);
            navigator.clipboard?.writeText(r.link);
          }}
        >
          + Generate Invite Link
        </button>
      </header>

      {invite && (
        <div className="invite-banner">
          Invite link (copied to clipboard): <code>{invite}</code>
        </div>
      )}

      <div className="layout">
        <aside>
          <h3>Enrolled Devices ({devices.length})</h3>
          {devices.length === 0 && <p className="muted">No devices paired yet.</p>}
          {devices.map((d) => {
            const devTel = telemetry[d.id];
            return (
              <div
                key={d.id}
                className={`device ${selected === d.id ? "active" : ""}`}
                onClick={() => setSelected(d.id)}
              >
                <div className="device-name">{d.model ?? "Unknown Device"}</div>
                <div className="device-meta">
                  <span className={`dot ${d.status}`} /> {d.status}
                  {devTel?.batteryLevel !== undefined && (
                    <span style={{ marginLeft: "6px", color: "#38bdf8" }}>
                      {devTel.batteryLevel}% {devTel.isCharging ? "⚡" : ""}
                    </span>
                  )}
                </div>
                {devTel?.activeApp && (
                  <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                    App: {devTel.activeApp}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        <main>
          <LiveMap markers={markers} />
          {selectedDevice ? (
            <DevicePanel
              device={selectedDevice}
              send={send}
              telemetry={telemetry[selectedDevice.id]}
              appEvents={appEvents[selectedDevice.id]}
              installedApps={installedApps[selectedDevice.id]}
              screenFrame={screenFrames[selectedDevice.id]}
            />
          ) : (
            <div className="hint">Select an enrolled device to monitor screen &amp; data stream</div>
          )}
        </main>
      </div>
    </div>
  );
}
