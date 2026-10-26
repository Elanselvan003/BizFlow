# Orvian — Remote Android Device Fleet Management Platform

An enterprise-grade, distributed platform for remote real-time monitoring, telemetric inspection, screen streaming, and remote control of Android devices powered by **Orvian** (`orvian.com`).

---

## Architecture Overview

```
 [ Android Agent App ] 
   │  ├─ MediaProjection (ScreenStreamer)
   │  ├─ AccessibilityService (CtrlService - Gesture/Key Injection)
   │  └─ WebSocket Client (WsClient)
   │
   ▼ WebRTC / WebSocket
 [ Cloudflare Worker + Durable Object ] ─── [ Coturn STUN/TURN (WebRTC) ]
   │  ├─ /api/auth, /api/devices, /api/invites, /api/turn
   │  ├─ DeviceHub (Durable Object real-time state & signaling)
   │  └─ Cloudflare D1 / PostgreSQL
   │
   ▼ WebSocket / REST API
 [ React + Vite Fleet Dashboard ]
      ├─ LiveMap (Leaflet GPS tracking)
      ├─ ScreenViewer (WebRTC low-latency stream)
      └─ ControlOverlay (Touch & gesture injection)
```

---

## Directory Structure

```
agent-platform/
├── backend/                       # Cloudflare Worker API & Durable Object Hub
│   ├── public/apk/                # Directory serving compiled Android agent APK
│   ├── src/
│   │   ├── api/                   # REST route handlers
│   │   │   ├── auth.ts            # Admin/operator authentication
│   │   │   ├── devices.ts         # Device inventory & telemetry endpoints
│   │   │   ├── invites.ts         # Device pairing & enrollment tokens
│   │   │   └── turn.ts            # Ephemeral WebRTC TURN credential issuer
│   │   ├── delivery/
│   │   │   └── landing.ts         # Agent download landing page
│   │   ├── durable/
│   │   │   └── hub.ts             # Durable Object: WebRTC signaling & WS router
│   │   ├── lib/
│   │   │   ├── auth.ts            # Session & permission guards
│   │   │   ├── http.ts            # HTTP response & error helpers
│   │   │   └── jwt.ts             # JWT token generation & verification
│   │   └── index.ts               # Worker router entrypoint
│   ├── package.json
│   ├── schema.sql                 # D1 / SQL database schema
│   ├── tsconfig.json
│   └── wrangler.toml              # Cloudflare configuration & bindings
├── dashboard/                     # Web Operator Control Center (React + Vite)
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── api.ts                 # Backend API client
│       ├── App.tsx                # Main layout & dashboard controller
│       ├── main.tsx               # React DOM entry
│       ├── styles.css             # Design tokens, theme & custom UI styles
│       ├── components/
│       │   ├── ControlOverlay.tsx # Interactive touch & action overlay
│       │   ├── DevicePanel.tsx    # Fleet device metrics, battery & hardware
│       │   ├── LiveMap.tsx        # Leaflet GPS map tracking
│       │   ├── Login.tsx          # Operator sign-in view
│       │   └── ScreenViewer.tsx   # Low-latency WebRTC/Canvas video stream
│       └── hooks/
│           ├── useSocket.ts       # Real-time WebSocket connection to Hub
│           └── useWebRTC.ts       # PeerConnection, ICE, and stream lifecycle
├── android/                       # Kotlin + Jetpack Compose Android Client
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── app/
│       ├── build.gradle.kts
│       └── src/main/
│           ├── AndroidManifest.xml
│           ├── java/com/agent/platform/
│           │   ├── App.kt                 # Application lifecycle & DI
│           │   ├── MainActivity.kt        # Setup & permission orchestration
│           │   ├── boot/
│           │   │   └── BootReceiver.kt    # BOOT_COMPLETED auto-launch
│           │   ├── control/
│           │   │   └── CtrlService.kt     # AccessibilityService gesture injector
│           │   ├── net/
│           │   │   ├── Api.kt             # REST enrollment client
│           │   │   ├── Protocol.kt        # JSON frame definitions
│           │   │   └── WsClient.kt        # WebSocket connection manager
│           │   ├── screen/
│           │   │   └── ScreenStreamer.kt  # MediaProjection screen capture
│           │   ├── service/
│           │   │   └── AgentService.kt    # Foreground service coordinator
│           │   ├── store/
│           │   │   └── Prefs.kt           # Encrypted SharedPreferences
│           │   └── ui/
│           │       └── BindScreen.kt      # Device pairing QR/Code UI
│           └── res/
│               ├── values/                # strings.xml, colors.xml, themes.xml
│               └── xml/                   # accessibility & network security configs
├── infra/                         # Production & Local Infrastructure
│   ├── docker-compose.yml         # PostgreSQL, Redis & Coturn STUN/TURN services
│   └── turnserver.conf            # Coturn configuration
└── README.md
```

---

## Quick Start

### 1. Start Infrastructure (PostgreSQL, Redis, Coturn)
```bash
cd infra
docker compose up -d
```

### 2. Backend (Cloudflare Worker)
```bash
cd backend
npm install
npm run db:migrate  # Run schema on local D1
npm run dev         # Launches local worker at http://localhost:8787
```

### 3. Dashboard (React + Vite)
```bash
cd dashboard
npm install
npm run dev         # Launches dashboard at http://localhost:3000
```

### 4. Android Client
1. Open the `android/` directory in Android Studio.
2. Build and install the debug APK on target device or emulator.
3. Grant permissions:
   - **Screen Recording** (MediaProjection permission prompt).
   - **Accessibility Service** (Settings -> Accessibility -> Agent Platform).
   - **Location** (Background/Foreground location).
