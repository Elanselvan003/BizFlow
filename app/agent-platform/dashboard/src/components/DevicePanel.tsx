import { useState } from "react";
import type { WsMsg } from "../hooks/useSocket";

interface Props {
  device: any;
  send: (m: WsMsg) => void;
  telemetry?: any;
  appEvents?: Array<{ pkg: string; name: string; time: number }>;
  installedApps?: Array<{ name: string; package: string }>;
  screenFrame?: string | null;
}

export default function DevicePanel({
  device,
  send,
  telemetry,
  appEvents = [],
  installedApps = [],
  screenFrame,
}: Props) {
  const [activeTab, setActiveTab] = useState<"screen" | "apps" | "logs">("screen");
  const [appSearch, setAppSearch] = useState("");

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    send({
      type: "control",
      deviceId: device.id,
      action: "touch",
      x,
      y,
    });
  };

  const sendNav = (code: string) => {
    send({
      type: "control",
      deviceId: device.id,
      action: "key",
      code,
    });
  };

  const launchApp = (pkg: string) => {
    send({
      type: "control",
      deviceId: device.id,
      action: "launch_app",
      package: pkg,
    });
  };

  const filteredApps = installedApps.filter(
    (a) =>
      a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.package.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <div className="panel">
      {/* Device Header */}
      <div className="panel-head">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ fontSize: "16px" }}>{device.model ?? "Unknown Device"}</strong>
            <span className={`dot ${device.status}`} />
            <span style={{ fontSize: "12px", color: "var(--muted)", textTransform: "capitalize" }}>
              {device.status}
            </span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
            {device.os_version ?? "Android"} • ID: {device.id.slice(0, 13)}...
          </div>
        </div>

        <div className="actions">
          <button
            onClick={() => send({ type: "control", deviceId: device.id, action: "refresh" })}
            title="Request fresh status & telemetry"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Live Telemetry Bar */}
      <div className="telemetry-bar">
        <div className="telemetry-chip">
          <span className="chip-label">Battery</span>
          <span className="chip-val">
            {telemetry?.batteryLevel !== undefined ? `${telemetry.batteryLevel}%` : "—"}
            {telemetry?.isCharging ? " ⚡" : ""}
          </span>
        </div>

        <div className="telemetry-chip">
          <span className="chip-label">Network</span>
          <span className="chip-val">{telemetry?.networkType ?? "—"}</span>
        </div>

        <div className="telemetry-chip">
          <span className="chip-label">RAM Free</span>
          <span className="chip-val">
            {telemetry?.ramAvailableMb
              ? `${(telemetry.ramAvailableMb / 1024).toFixed(1)} GB / ${(telemetry.ramTotalMb / 1024).toFixed(1)} GB`
              : "—"}
          </span>
        </div>

        <div className="telemetry-chip highlight">
          <span className="chip-label">Active App</span>
          <span className="chip-val" style={{ color: "#38bdf8", fontWeight: 600 }}>
            {telemetry?.activeApp ?? "Home / System"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "screen" ? "active" : ""}`}
          onClick={() => setActiveTab("screen")}
        >
          📱 Live Screen & Control
        </button>
        <button
          className={`tab-btn ${activeTab === "apps" ? "active" : ""}`}
          onClick={() => setActiveTab("apps")}
        >
          📦 Installed Apps ({installedApps.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          📜 App Switch History ({appEvents.length})
        </button>
      </div>

      {/* Tab 1: Screen & Remote Control */}
      {activeTab === "screen" && (
        <div className="screen-container">
          <div className="screen-wrap" onClick={handleScreenClick}>
            {screenFrame ? (
              <img
                src={screenFrame}
                alt="Device screen live"
                style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
              />
            ) : (
              <div className="screen-placeholder">
                <div style={{ textAlign: "center", padding: "30px 20px" }}>
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>📱</div>
                  <div style={{ fontWeight: 600, marginBottom: "6px" }}>Screen Stream Ready</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", maxWidth: "260px" }}>
                    In the mobile app, tap <strong>Start Screen Streaming</strong> and accept the prompt to see the live screen here.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="nav-bar">
            <button onClick={() => sendNav("back")}>◀ Back</button>
            <button onClick={() => sendNav("home")}>⌂ Home</button>
            <button onClick={() => sendNav("recents")}>▢ Recents</button>
            <button onClick={() => sendNav("notifications")}>🔔 Notifications</button>
          </div>
        </div>
      )}

      {/* Tab 2: Installed Apps */}
      {activeTab === "apps" && (
        <div className="apps-container">
          <input
            type="text"
            placeholder="Search installed apps..."
            value={appSearch}
            onChange={(e) => setAppSearch(e.target.value)}
            className="search-input"
          />

          {filteredApps.length === 0 ? (
            <div style={{ padding: "20px", color: "var(--muted)", textAlign: "center" }}>
              {installedApps.length === 0
                ? "Waiting for mobile app to send app inventory..."
                : "No matching apps found"}
            </div>
          ) : (
            <div className="apps-list">
              {filteredApps.map((a) => (
                <div key={a.package} className="app-item">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{a.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{a.package}</div>
                  </div>
                  <button className="btn-small" onClick={() => launchApp(a.package)}>
                    Open on Phone
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: App Activity History */}
      {activeTab === "logs" && (
        <div className="logs-container">
          {appEvents.length === 0 ? (
            <div style={{ padding: "20px", color: "var(--muted)", textAlign: "center" }}>
              No app transitions logged yet. As the user switches apps on the phone, events will appear here in real-time.
            </div>
          ) : (
            <div className="events-list">
              {appEvents.map((ev, idx) => (
                <div key={idx} className="event-item">
                  <span className="event-time">
                    {new Date(ev.time).toLocaleTimeString()}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, color: "#38bdf8" }}>{ev.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "8px" }}>
                      ({ev.pkg})
                    </span>
                  </div>
                  <button className="btn-small" onClick={() => launchApp(ev.pkg)}>
                    Launch
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
