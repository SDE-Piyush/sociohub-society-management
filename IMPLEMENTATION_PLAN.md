# SocioHub — 3-Day Implementation Plan & Architecture Specification

> **Society / Apartment Management Platform**
> Fully designed with a sleek dark slate & neon-accented UI, multi-tenant isolation, and a realistic 3-day phase breakdown.

---

## 🎨 Approved UI Design Direction
The user selected the **Sleek Dark Slate & Neon Accent** aesthetic (created at 3:40 AM):
* **Canvas & Cards**: Deep slate background (`#0B0F19` / `#111827`) with soft frosted border glow (`border-slate-800/80`).
* **Interactive Glowing Accents**:
  * 🎟️ **Invite Guest**: Electric Cyan (`#06B6D4`)
  * 💳 **Pay Maintenance**: Mint Emerald (`#10B981`)
  * 🔧 **Raise Ticket**: Neon Fuchsia (`#A855F7`)
  * 📅 **Book Facility**: Indigo Blue (`#6366F1`)
* **Visual Reference Assets**:
  * Resident Portal: `assets/resident_portal_approved_ui.jpg`
  * Admin Dashboard: `assets/admin_dashboard_approved_ui.jpg`

---

## 🛠️ Technology Stack

| Layer | Selected Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite | Lightning-fast development & modern component hooks |
| **Styling** | Tailwind CSS + Lucide Icons | Utility-first styling with custom glow and slate tokens |
| **State Management** | TanStack Query v5 + Zustand | Server caching/fetching (React Query) + Lightweight UI store (Zustand) |
| **Forms & Validation**| React Hook Form + Zod | Schema-based strict type-safe validation |
| **Backend** | Node.js, Express.js | Robust REST API & Socket.IO server |
| **Database** | MongoDB + Mongoose | Multi-tenant document database with compound indexes |
| **Authentication** | JWT (HTTP-Only Secure Cookies) | Secure access tokens & rotating refresh tokens (XSS immune) |
| **Real-Time** | Socket.IO | Bi-directional gatekeeper alerts & instant resident approvals |
| **QR Engine** | `qrcode.react` + `html5-qrcode` | Browser-based QR code generation & camera scanner |
| **Invoicing** | `pdfkit` | Server-side automated PDF maintenance receipt generation |

---

## 📅 3-Day Phase Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DAY 1: Foundation, Multi-Tenancy & Core Dashboards                          │
│ ├─ Project Scaffolding (client/ with Vite + server/ with Express & MongoDB) │
│ ├─ Multi-Tenant Schemas: User, Society, Building (Wings), Flat               │
│ ├─ JWT Auth & Role-Based Access Control (4 Roles) with HTTP-only cookies    │
│ └─ Dark Slate App Shell, Admin Wing/Flat Onboarding & Resident Dashboard    │
├─────────────────────────────────────────────────────────────────────────────┤
│ DAY 2: Operations, Helpdesk & Security Gatekeeper Engine                    │
│ ├─ Notice Board & Announcements (Emergency banners & category tags)         │
│ ├─ Complaints Service Desk (Lifecycle: Pending → In Progress → Resolved)   │
│ ├─ Dual Visitor Engine: Pre-approved QR Passes + Walk-in Gate Approvals     │
│ └─ Security Gatekeeper Terminal (Tablet UI) + Socket.IO Arrival Alerts      │
├─────────────────────────────────────────────────────────────────────────────┤
│ DAY 3: Financial Engine, Amenities, Community & Polish                      │
│ ├─ Maintenance Billing (Batch bill generator & overdue penalties)           │
│ ├─ Payment Gateway Integration (Razorpay/Stripe Test Mode) + PDF Receipts   │
│ ├─ Amenity Booking Engine (Double-booking prevention via compound indexes)  │
│ ├─ Community Polls & Discussion Feed                                        │
│ └─ Demo Seed Script (`npm run seed`), Responsive Touch PWA Polish           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Detailed Daily Tasks

### Phase 1 (Day 1): Foundation, Multi-Tenancy & Core Dashboards
- [x] **Step 1.1**: Initialize monorepo structure: `client/` (Vite, React 19, Tailwind) and `server/` (Express, Mongoose).
- [x] **Step 1.2**: Set up Tailwind configuration with dark slate colors (`#0B0F19`, `#111827`, `#1F2937`) and neon gradient glows.
- [x] **Step 1.3**: Implement Mongoose schemas:
  - `User` (`SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`, `RESIDENT`; ownership: `OWNER`, `TENANT`).
  - `Society` (name, address, registration, settings).
  - `Building` (Wing name, total floors).
  - `Flat` (number, floor, occupancy status, owner/tenant links).
- [x] **Step 1.4**: Build Auth API with JWT in secure HTTP-only cookies, password hashing with `bcryptjs`, and role guard middleware.
- [x] **Step 1.5**: Build responsive App Layout with Sidebar, Navbar, and User Dropdown.
- [x] **Step 1.6**: Build Admin Building & Flat Management views.
- [x] **Step 1.7**: Build Resident Dashboard matching the approved dark-slate aesthetic.

### Phase 2 (Day 2): Operations, Helpdesk & Security Gatekeeper
- [x] **Step 2.1**: Notice Board Schema & API with audience filtering (`ALL`, `OWNERS`, `TENANTS`).
- [x] **Step 2.2**: Frontend Notice Feed with priority badges (`URGENT`, `UPCOMING`).
- [x] **Step 2.3**: Complaints Schema & State-machine transitions (`PENDING` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED`).
- [x] **Step 2.4**: Complaint filing form with image previews and management resolution thread.
- [x] **Step 2.5**: Visitor Schema with 6-digit PIN, QR tokens, and check-in/out timestamps.
- [x] **Step 2.6**: Resident "Generate Guest Pass" modal with downloadable QR & WhatsApp share link.
- [x] **Step 2.7**: Security Guard Gatekeeper Terminal (Tablet view) with QR scanner & numeric PIN keypad.
- [x] **Step 2.8**: Socket.IO integration for unannounced visitor arrival alerts directly to resident's screen.

### Phase 3 (Day 3): Financial Engine, Amenities, Community & Polish
- [ ] **Step 3.1**: Maintenance Billing Schema with compound unique index `[societyId, flatId, month, year]`.
- [ ] **Step 3.2**: Admin batch maintenance bill generator (1-click generation for all occupied flats).
- [ ] **Step 3.3**: Resident payment checkout (Razorpay / Stripe test mode integration) & webhook signature verification.
- [ ] **Step 3.4**: Automated PDF maintenance receipt generation using `pdfkit`.
- [ ] **Step 3.5**: Amenity Booking Schema with atomic double-booking prevention (`{ amenityId: 1, date: 1, startTime: 1 }`).
- [ ] **Step 3.6**: Visual time-slot reservation grid for amenities (Clubhouse, Tennis Court, Pool).
- [ ] **Step 3.7**: Community Polls with real-time percentage progress bars.
- [ ] **Step 3.8**: Database seed script (`server/src/scripts/seed.js`) to generate a complete demo society with sample flats, residents, and logs.

---

## 📌 How to Resume Tomorrow
When you are ready to start tomorrow, simply say:
> **"Let's start Phase 1"**

We will begin by creating the `client/` and `server/` structures and setting up the foundational models and auth!
