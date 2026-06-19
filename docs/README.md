# Access Control Platform

A full-stack access control management system supporting three user roles: **Admin**, **Dealer**, and **Client**. It manages employees, zones, cards, schedules, and access rules with real-time access logging.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prerequisites](#2-prerequisites)
3. [Project Structure](#3-project-structure)
4. [Backend Setup](#4-backend-setup)
5. [Frontend Setup](#5-frontend-setup)
6. [Demo Accounts](#6-demo-accounts)
7. [Hardware Setup](#7-hardware-setup)
8. [API Documentation](#8-api-documentation)
9. [Environment Variables & Configuration Reference](#9-environment-variables--configuration-reference)

---

## 1. Project Overview

The Access Control Platform provides:

- **Multi-tenant architecture**: Admin manages dealers; dealers manage organizations; organizations manage their employees and access rules.
- **Role-based access control (RBAC)**: Three roles with dedicated dashboards — Admin, Dealer, and Client.
- **Card-based entry**: Support for Mifare 13.56 MHz (ACS ACR122U via PC/SC) and 125 kHz UART serial readers.
- **Real-time access logging**: Every card scan is recorded with decision (Granted/Denied) and reason.
- **Schedule enforcement**: Access rules are bound to time schedules (e.g., business hours only).
- **React + Vite frontend**: Modern SPA with dark mode, responsive layout, and toast notifications.
- **ASP.NET Core 8 backend**: RESTful JSON API with JWT authentication and Entity Framework Core (SQL Server).

---

## 2. Prerequisites

| Requirement | Version / Notes |
|---|---|
| **SQL Server** | 2019 or later (Express edition is fine for development) |
| **.NET SDK** | 8.0 or later — [download](https://dotnet.microsoft.com/download/dotnet/8.0) |
| **Node.js** | 20 LTS or later — [download](https://nodejs.org/) |
| **npm** | Bundled with Node.js (v10+) |
| **Git** | For cloning / version control |
| **ACS ACR122U driver** *(optional)* | Required only if using Mifare NFC readers |
| **PC/SC service** | Windows: built-in via `SCardSvr` (Smart Card service) |
| **USB-to-Serial driver** *(optional)* | Required only if using 125 kHz UART readers |

---

## 3. Project Structure

```
access-control-platform/
├── backend/                        # ASP.NET Core 8 Web API
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── AdminController.cs
│   │   ├── DealerController.cs
│   │   ├── ClientController.cs
│   │   ├── AccessLogsController.cs
│   │   └── CardReaderController.cs
│   ├── Models/
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Services/
│   │   ├── PCSCReaderService.cs    # ACS ACR122U background service
│   │   └── SerialReaderService.cs  # 125kHz UART background service
│   ├── appsettings.json
│   └── Program.cs
├── frontend/                       # React + Vite + Tailwind CSS SPA
│   ├── public/
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Badge.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   └── Table.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── ManageDealers.jsx
│   │   │   │   ├── ManageOrganizations.jsx
│   │   │   │   └── AdminAccessLogs.jsx
│   │   │   ├── dealer/
│   │   │   │   ├── DealerLayout.jsx
│   │   │   │   ├── DealerDashboard.jsx
│   │   │   │   ├── DealerOrganizations.jsx
│   │   │   │   └── DealerDevices.jsx
│   │   │   └── client/
│   │   │       ├── ClientLayout.jsx
│   │   │       ├── ClientDashboard.jsx
│   │   │       ├── ManageEmployees.jsx
│   │   │       ├── ManageCards.jsx
│   │   │       ├── ManageZones.jsx
│   │   │       ├── ManageSchedules.jsx
│   │   │       ├── ManageAccessRules.jsx
│   │   │       └── ClientAccessLogs.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
└── docs/
    └── README.md
```

---

## 4. Backend Setup

### a. Configure the connection string

Open `backend/appsettings.json` and set your SQL Server connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=AccessControlDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyAtLeast32CharactersLong!",
    "Issuer": "AccessControlPlatform",
    "Audience": "AccessControlPlatformUsers",
    "ExpiryMinutes": 480
  },
  "Hardware": {
    "EnablePCSC": false,
    "EnableSerial": false,
    "SerialPortName": "COM3",
    "SerialBaudRate": 9600
  }
}
```

### b. Restore dependencies

```bash
cd backend
dotnet restore
```

### c. Run EF Core migrations

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

> If `dotnet ef` is not found, install it globally:
> ```bash
> dotnet tool install --global dotnet-ef
> ```

### d. Run the backend

```bash
dotnet run
```

The API will be available at `http://localhost:5000`.
Swagger UI is at `http://localhost:5000/swagger`.

---

## 5. Frontend Setup

### a. Install dependencies

```bash
cd frontend
npm install
```

### b. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000`, so no CORS configuration is needed during development.

### c. Build for production

```bash
npm run build
```

Output is placed in `frontend/dist/`. Serve it with any static file server or configure the backend to serve it directly.

---

## 6. Demo Accounts

These accounts are seeded automatically on first run (via `DataSeeder` in `Program.cs`):

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@platform.com` | `Admin123!` |
| **Dealer** | `dealer@platform.com` | `Dealer123!` |
| **Client** | `client@platform.com` | `Client123!` |

> The Login page includes quick-fill buttons for each demo account.

---

## 7. Hardware Setup

### a. ACS ACR122U — Mifare 13.56 MHz NFC Reader

**Requirements:**
- ACS ACR122U USB NFC Reader
- ACS unified driver: download from [acs.com.hk](https://www.acs.com.hk/en/driver/3/acr122u-usb-nfc-reader/)
- Windows Smart Card service (`SCardSvr`) — enabled by default on Windows 10/11

**Steps:**

1. Install the ACS driver and reboot.
2. Plug in the ACR122U reader.
3. Verify the device appears in Device Manager under "Smart card readers".
4. In `appsettings.json`, set:
   ```json
   "Hardware": {
     "EnablePCSC": true
   }
   ```
5. Restart the backend. The `PCSCReaderService` background service will poll the PC/SC subsystem and automatically call `POST /api/card-reader/scan` when a card is detected.

**How it works:**
The background service uses `PCSC-Sharp` (or `Windows.Devices.SmartCards` on Windows) to detect card insertions. It reads the card UID, identifies the associated reader, and posts a scan event to the internal API endpoint which evaluates access rules.

---

### b. UART 125 kHz Serial Reader

**Requirements:**
- A Wiegand or UART 125 kHz card reader (e.g., EM4100-compatible)
- USB-to-Serial adapter (CP2102, CH340, FTDI, etc.) if the reader uses a serial TTL interface
- Correct COM port driver for your adapter

**Steps:**

1. Connect the reader to your PC via USB-to-Serial or direct COM port.
2. Determine the COM port (e.g., `COM3`) in Device Manager → Ports (COM & LPT).
3. In `appsettings.json`, set:
   ```json
   "Hardware": {
     "EnableSerial": true,
     "SerialPortName": "COM3",
     "SerialBaudRate": 9600
   }
   ```
4. Restart the backend. The `SerialReaderService` will open the serial port and listen for card UIDs sent as ASCII/hex strings terminated by `\r\n`.

**Reader wiring (typical TTL UART reader):**

| Reader Pin | Description | Connect To |
|---|---|---|
| VCC | +5V or +12V | Power supply |
| GND | Ground | Adapter GND |
| TX | Card data output | Adapter RX |
| Beep/LED | Optional feedback | GPIO or leave open |

**Note:** Some readers output Wiegand (W26/W34) instead of UART. These require a Wiegand-to-Serial converter or a dedicated microcontroller (e.g., Arduino) bridge.

---

## 8. API Documentation

Swagger UI is available at:

```
http://localhost:5000/swagger
```

All endpoints (except `POST /api/auth/login`) require a Bearer JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Endpoint Summary

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate and receive JWT |
| GET | `/api/admin/stats` | Admin | Platform-wide statistics |
| GET | `/api/admin/dealers` | Admin | List all dealers |
| POST | `/api/admin/dealers` | Admin | Create dealer account |
| PUT | `/api/admin/dealers/{id}` | Admin | Update dealer |
| DELETE | `/api/admin/dealers/{id}` | Admin | Delete dealer |
| GET | `/api/admin/organizations` | Admin | List all organizations |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/dealer/organizations` | Dealer | List own organizations |
| POST | `/api/dealer/organizations` | Dealer | Create organization |
| PUT | `/api/dealer/organizations/{id}` | Dealer | Update organization |
| DELETE | `/api/dealer/organizations/{id}` | Dealer | Delete organization |
| GET | `/api/dealer/readers` | Dealer | List registered readers |
| POST | `/api/dealer/readers` | Dealer | Register a reader |
| GET | `/api/dealer/cards` | Dealer | List cards |
| POST | `/api/dealer/cards` | Dealer | Create a card |
| GET | `/api/client/employees` | Client | List employees |
| POST | `/api/client/employees` | Client | Add employee |
| PUT | `/api/client/employees/{id}` | Client | Update employee |
| DELETE | `/api/client/employees/{id}` | Client | Delete employee |
| GET | `/api/client/zones` | Client | List zones |
| POST | `/api/client/zones` | Client | Create zone |
| PUT | `/api/client/zones/{id}` | Client | Update zone |
| DELETE | `/api/client/zones/{id}` | Client | Delete zone |
| GET | `/api/client/cards` | Client | List organization cards |
| POST | `/api/client/cards` | Client | Create card |
| PUT | `/api/client/cards/{id}/assign` | Client | Assign/unassign card to employee |
| GET | `/api/client/schedules` | Client | List schedules |
| POST | `/api/client/schedules` | Client | Create schedule |
| PUT | `/api/client/schedules/{id}` | Client | Update schedule |
| DELETE | `/api/client/schedules/{id}` | Client | Delete schedule |
| GET | `/api/client/access-rules` | Client | List access rules |
| POST | `/api/client/access-rules` | Client | Create access rule |
| DELETE | `/api/client/access-rules/{id}` | Client | Delete access rule |
| GET | `/api/client/access-logs` | Client | Organization access logs |
| GET | `/api/access-logs` | Admin | Platform-wide logs (paginated) |
| POST | `/api/card-reader/scan` | Internal | Process card scan event |

---

## 9. Environment Variables / Configuration Reference

All configuration lives in `backend/appsettings.json` (or `appsettings.Development.json` for development overrides):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "<SQL Server connection string>"
  },
  "Jwt": {
    "Key": "<secret key, minimum 32 characters>",
    "Issuer": "AccessControlPlatform",
    "Audience": "AccessControlPlatformUsers",
    "ExpiryMinutes": 480
  },
  "Hardware": {
    "EnablePCSC": false,
    "EnableSerial": false,
    "SerialPortName": "COM3",
    "SerialBaudRate": 9600
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  }
}
```

| Key | Default | Description |
|---|---|---|
| `ConnectionStrings.DefaultConnection` | — | SQL Server connection string |
| `Jwt.Key` | — | HMAC-SHA256 signing secret (keep private!) |
| `Jwt.ExpiryMinutes` | `480` | JWT lifetime in minutes (8 hours) |
| `Hardware.EnablePCSC` | `false` | Enable ACS ACR122U PC/SC reader |
| `Hardware.EnableSerial` | `false` | Enable 125 kHz UART serial reader |
| `Hardware.SerialPortName` | `"COM3"` | Serial port for 125 kHz reader |
| `Hardware.SerialBaudRate` | `9600` | Baud rate for serial reader |

### Frontend environment (`.env` in `frontend/`)

The frontend uses Vite's proxy (configured in `vite.config.js`) to forward API calls — no `.env` file is needed in development. For production deployments, set the `VITE_API_BASE_URL` environment variable if the API is hosted on a different origin, then update `src/utils/api.js` accordingly.

---

*Access Control Platform — built with ASP.NET Core 8, React 18, Vite 5, and Tailwind CSS 3.*
