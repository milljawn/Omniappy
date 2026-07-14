# Omni — Unified Kids Activities Coordination Platform

Omni is a unified, secure, cross-platform monorepo that consolidates schedules, rosters, digital program offers, and operations across youth sports, dance studios, swimming teams, music lessons, and scouts.

It resolves coordination friction for families by aggregating calendars and calculating driving logistics, while providing administrative platforms for team managers and swim meet computer deck operators.

---

## 📁 Repository Structure

This monorepo uses `pnpm` workspaces:

* **`apps/mobile`**: React Native Expo mobile application. Implements color-coded schedule timelines, driving travel buffers, maps deep-links, and COPPA age-gates.
* **`apps/web`**: Next.js desktop application. Houses the CEO Program Placement Offer Ledger and the high-privilege Swim Meet Computer Operator Console.
* **`apps/backend`**: Fastify Node.js API server. Connects via Row-Level Security (RLS) PostgreSQL transactions and provides secure in-memory mocks for local previews.
* **`packages/shared`**: Shared type bindings and Zod schemas used to enforce data contract integrity across frontends and backends.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v20+)
* [pnpm](https://pnpm.io/) (v11+)
* [Xcode](https://developer.apple.com/xcode/) (optional, for iOS simulation on macOS)
* [Expo Go](https://expo.dev/go) (optional, for testing on a physical mobile device)

### Installation
1. Install monorepo dependencies:
   ```bash
   pnpm install
   ```
2. Build shared modules and compile TypeScript workspaces:
   ```bash
   pnpm build
   ```

### Running Locally

* **Run the Next.js Desktop Web Console** (hosted on `http://localhost:3000`):
  ```bash
  pnpm --filter web dev
  ```
* **Run the Fastify Backend API** (hosted on `http://localhost:8080`):
  ```bash
  pnpm --filter backend start
  ```
* **Run the Expo Mobile Metro Bundler**:
  ```bash
  pnpm --filter mobile start
  ```
  *Scan the terminal QR code using **Expo Go** on your iOS/Android device, or press `i` to boot on Xcode Simulator.*

---

## 🛡️ Security Hardening

Omni is designed to support internet-facing deployments securely:

1. **Row-Level Security (RLS)**: PostgreSQL schema migrations enforce strict multi-tenant boundaries using session contexts (`app.current_parent_id`) so that parents and organizations cannot read or write foreign data.
2. **SQL Injection Prevention**: Every query adapter uses parameterized query bindings (`$1`, `$2`, etc.) rather than string template concatenation.
3. **HTTP Header Shielding**: Registers `@fastify/helmet` to set secure MIME sniff prevention, clickjacking frames, Content-Security-Policy (CSP), and HSTS.
4. **DDoS Protection**: Enforces `@fastify/rate-limit` blocking clients exceeding 100 requests per minute.
5. **SSO/Credentials Encryption**: District ParentVUE/PowerSchool passwords and SSO tokens are encrypted using AES-256-GCM before writing to the database.
6. **COPPA Compliance**: Children under 13 are restricted to passive sub-profiles with no login credentials, secure chat accounts, or public visibility.
