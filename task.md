task.md — Learnly Aspiration Platform Implementation Plan

📌 Project Overview

Transform the existing Learnly UI prototype into a fully functional education aspiration platform using HTML5, Tailwind CSS, Vanilla JS, and Supabase (PostgreSQL, Auth, Storage, RLS). The application maintains an Apple-inspired minimal aesthetic and operates as a deployable dynamic static website with no heavy JS frameworks or Node.js backends.

Task Breakdown

1. Database & Security Setup (supabase/schema.sql)

[ ] Core Database Schema:

[ ] profiles table (id, full_name, role [SUPER_ADMIN, ADMIN, VIEWER], created_at).

[ ] aspirations table (id, reference_number [UNIQUE], category, message, name, email, identity_type, anonymous, status [NEW, REVIEWING, IN_PROGRESS, RESOLVED, ARCHIVED], attachment_url, attachment_name, assigned_admin, created_at, updated_at, resolved_at, deleted_at).

[ ] aspiration_notes table (id, aspiration_id, admin_id, note, created_at).

[ ] aspiration_activity table (id, aspiration_id, admin_id, action, metadata, created_at).

[ ] Reference Number Generation:

[ ] Create database function/trigger to auto-generate unique reference numbers formatted as ASP-XXXXXX (6 random unique digits/alphanumeric).

[ ] Database Indexes:

[ ] Add indexes for reference_number, status, category, created_at, and updated_at.

[ ] Row Level Security (RLS) & Policies:

[ ] aspirations: Public INSERT allowed; Public SELECT strictly restricted to safe fields (reference_number, category, status, created_at).

[ ] aspirations: Authenticated admins get SELECT, UPDATE, DELETE according to role.

[ ] aspiration_notes & aspiration_activity: Restricted to authenticated admins (SELECT/INSERT).

[ ] Ensure frontend only exposes SUPABASE_URL and SUPABASE_ANON_KEY (never SUPABASE_SERVICE_ROLE_KEY).

[ ] Supabase Storage Configuration:

[ ] Bucket aspiration-attachments (Max size 10MB; allowed types: PDF, PNG, JPG, JPEG, DOCX).

[ ] Bucket access policy for uploads and secure downloads.

2. JavaScript Client Architecture (assets/js/)

[ ] config.js: Application settings and constants.

[ ] supabase.js: Initializing Supabase Client instance.

[ ] ui.js: Reusable UI modules (Toast notifications, Modal handlers, Loading states, Badges, XSS defense using textContent, Date formatters).

[ ] auth.js: Admin auth state management (Login, Logout, Session check, Auth route guard for admin.html).

[ ] aspiration.js: Public form logic (Submitting aspirations, file attachment handling, status lookups).

[ ] admin.js: Admin dashboard controller (Real-time DB metrics, Data tables + Pagination, Filtering & Searching, Status changes, Notes management, Activity history).

3. Public Pages & User Workflows

A. Landing Page (index.html)

[ ] Maintain modern Apple-inspired visual foundation (Glassmorphism, crisp typography, soft shadows).

[ ] Structure sections: Navbar, Hero, Benefits/Value prop, Categories, How it works, Privacy, Footer.

[ ] Primary CTA: Links to aspirasi.html ("Sampaikan Aspirasi").

[ ] Secondary CTA: Links to status.html ("Cek Status Aspirasi").

B. Aspiration Submission (aspirasi.html)

[ ] Form Inputs: Category (Pembelajaran, Fasilitas, Teknologi, Lainnya), Message (10–500 chars), Name, Email, Identity Type, Anonymous Toggle, File Attachment.

[ ] UX Features:

[ ] Live character counter for Message.

[ ] Dynamic disabling/hiding of Name & Email when Anonymous mode is toggled on.

[ ] Pre-upload file validation (check file type and maximum 10MB limit).

[ ] Active loading state on button during submission ("Mengirim...").

[ ] Prevent duplicate submissions.

[ ] Success View:

[ ] Display confirmation message along with generated Reference Number (ASP-XXXXXX).

[ ] Action buttons: Copy Reference, Cek Status, Kirim Aspirasi Lagi.

C. Status Tracker (status.html)

[ ] Reference number lookup input (e.g., ASP-582941).

[ ] Display public safe data only: Reference Number, Category, Public Status (Baru, Sedang Ditinjau, Sedang Diproses, Selesai, Diarsipkan), Submission Date.

[ ] Data Security: Ensure internal notes, admin details, and personal info of anonymous submitters are never exposed.

4. Admin Authentication & Management Dashboard

A. Admin Auth (admin-login.html)

[ ] Supabase Email & Password login form.

[ ] Error feedback and loading states.

[ ] Redirect authenticated users directly to admin.html.

B. Admin Dashboard (admin.html)

[ ] Route Guard: Redirect unauthenticated users back to admin-login.html.

[ ] Responsive Design:

[ ] Desktop: Fixed Sidebar + Main Workspace.

[ ] Mobile/Tablet: Top Bar + Drawer + Card views for table rows.

[ ] Dynamic Metrics (Real Database Queries):

[ ] Total Aspirations, Baru (New), Sedang Diproses (In Progress), Selesai (Resolved).

[ ] Aspiration Data Table:

[ ] Columns: Reference, Category, Message preview, Submitter, Status Badge, Date, Actions.

[ ] Live Search (Reference or Message content).

[ ] Filters by Status and Category.

[ ] Sorting by Newest/Oldest.

[ ] Server-side / Client-side Pagination.

[ ] Detail Modal & Workflow:

[ ] View full submission details and attachment links.

[ ] Update Status (NEW → REVIEWING → IN_PROGRESS → RESOLVED → ARCHIVED). Set resolved_at when status becomes RESOLVED.

[ ] Add Internal Notes (aspiration_notes).

[ ] Archive aspirations (deleted_at or status = 'ARCHIVED').

[ ] View comprehensive Activity History (aspiration_activity).

5. Final Quality Checklist & Testing

[ ] Toast notifications integrated for all user interactions.

[ ] Full accessibility support (Keyboard navigation, visible focus indicators, prefers-reduced-motion).

[ ] XSS safety checked (all dynamic text populated using textContent).

[ ] End-to-End workflow validation:

User submits aspiration on aspirasi.html → Receives ASP-XXXXXX.

User verifies status on status.html.

Admin logs into admin.html → Reviews item, updates status, adds note, checks audit log.
