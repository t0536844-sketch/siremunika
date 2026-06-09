---
title: SIM Remunerasi RSUD Mimika
emoji: 🏥
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: openrail
---

# SIM Remunerasi RSUD Mimika

Hospital remuneration management system for RSUD Mimika. Multi-tier architecture: React SPA frontend ↔ Express API bridge ↔ SQL Server 2019.

## Tech Stack
- **Frontend:** React 19 + TypeScript + TailwindCSS + Vite
- **API Bridge:** Express.js (runs on local hospital server, port 3100)
- **Database:** SQL Server 2019 (SIMRemunerasi)

## Features
- Dashboard with real-time statistics
- Pendapatan (revenue) input & management
- Jasa Medis (medical services) tracking
- Indexing & kalkulasi (calculation)
- Approval workflow with RBAC (3-level: Unit → Keuangan → Direksi)
- Nakes (medical staff) profiles
- Output pembayaran (payment output)
- Network database sync (Pull/Push)
- Activity log & notifications
- Export to Excel/PDF

## Note
The API bridge and SQL Server run on the local hospital network. This deployed frontend connects to `http://<server-ip>:3100` for data. If the API is unreachable, the app falls back to local mock data.