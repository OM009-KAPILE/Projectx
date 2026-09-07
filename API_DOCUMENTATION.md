# 📚 ProjectX REST & Real-time API Reference

Welcome to the comprehensive API documentation for **ProjectX Platform**.

- **Base URL (Local)**: `http://localhost:4000/api/v1`
- **Base URL (Production)**: `https://api.projectx.edu/api/v1`
- **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 📑 Table of Contents
1. [Health & System](#1-health--system)
2. [Authentication & Account Security](#2-authentication--account-security)
3. [Student Profiles & Verification Badges](#3-student-profiles--verification-badges)
4. [Projects & Progressive Disclosure](#4-projects--progressive-disclosure)
5. [Applications & Team Formation](#5-applications--team-formation)
6. [Workspace, Kanban Tasks & Files](#6-workspace-kanban-tasks--files)
7. [Project Health Intelligence Engine](#7-project-health-intelligence-engine)
8. [Direct & Project Messaging](#8-direct--project-messaging)
9. [Notifications & Multi-Channel Preferences](#9-notifications--multi-channel-preferences)
10. [Support & Safety Module](#10-support--safety-module)
11. [Admin Dashboard & Platform Moderation](#11-admin-dashboard--platform-moderation)
12. [Colleges & Academic Directory](#12-colleges--academic-directory)
13. [WebSocket Real-Time Gateway](#13-websocket-real-time-gateway)

---

## 1. Health & System

### `GET /healthz` & `GET /api/healthz`
Public liveness and readiness probe for load balancers and Kubernetes.
* **Auth**: None
* **Response `200 OK`**:
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.0.0",
  "uptimeSeconds": 1420,
  "timestamp": "2026-09-02T08:30:00.000Z",
  "services": {
    "database": { "status": "healthy", "latencyMs": 2 }
  }
}
```

---

## 2. Authentication & Account Security

### `POST /api/v1/auth/register`
Create a new student account.
* **Body**:
  ```json
  {
    "email": "alice@stanford.edu",
    "password": "SecurePassword123!",
    "name": "Alice Chen",
    "collegeDomain": "stanford.edu",
    "graduationYear": 2027
  }
  ```
* **Response `201 Created`**: Returns user details and sends a 6-digit email verification code.

### `POST /api/v1/auth/verify-email`
Verify email address using the 6-digit code.
* **Body**: `{ "email": "alice@stanford.edu", "code": "123456" }`
* **Response `200 OK`**: `{ "tokens": { "accessToken": "...", "refreshToken": "..." }, "user": { ... } }`

### `POST /api/v1/auth/login`
Authenticate existing student with rate limiting (30 requests/15m).
* **Body**: `{ "email": "alice@stanford.edu", "password": "SecurePassword123!" }`

### `POST /api/v1/auth/refresh-token`
Rotate refresh token and retrieve a fresh 2-hour access token.
* **Body**: `{ "refreshToken": "..." }`

### `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password`
Initiate password reset email and reset password with code.

### `POST /api/v1/auth/change-password`
Authenticated password change.
* **Auth**: Bearer Token
* **Body**: `{ "currentPassword": "...", "newPassword": "...", "confirmPassword": "..." }`

### `POST /api/v1/auth/change-email`
Request email change with current password validation.

---

## 3. Student Profiles & Verification Badges

### `GET /api/v1/users/me`
Retrieve currently logged-in user profile, skills, badges, and college affiliation.

### `PUT /api/v1/users/me`
Update profile bio, headline, graduation year, links, and avatar.

### `POST /api/v1/users/me/github/sync`
Connect GitHub handle or profile URL and sync public repositories and language statistics.

### `DELETE /api/v1/users/me/github`
Disconnect GitHub account and reset evidence confidence to self-declared.

### `POST /api/v1/users/me/skills`
Add skill with optional evidence URL or GitHub repository attachment.

---

## 4. Projects & Progressive Disclosure

### `POST /api/v1/projects/ai-analyze`
AI idea decomposition into title, pitch, difficulty, roles, and critical skills.

### `POST /api/v1/projects`
Create a new project. Supports Progressive Disclosure Level 1-4 fields:
* `collegeVisibility`: `SAME_COLLEGE` | `SELECTED_COLLEGES` | `ALL_COLLEGES`
* `privateRepoUrl`, `privateNotes`, `architectureSpec` (Hidden from non-members)

### `GET /api/v1/projects`
List public projects with filters (`domain`, `skill`, `status`, `college`, `difficulty`, `query`).

### `GET /api/v1/projects/:id`
Retrieve project details with progressive disclosure tiering based on caller membership.

### `GET /api/v1/projects/:id/gaps`
Run AI Skill Gap analysis across project requirements and current team.

### `GET /api/v1/projects/:id/matches`
Run AI matching engine ranking candidates by skill synergy, availability, and college domain.

---

## 5. Applications & Team Formation

### `POST /api/v1/applications`
Submit application to an open role on a project with pitch note and availability.

### `GET /api/v1/applications/my`
List applications submitted by the logged-in student.

### `GET /api/v1/applications/projects/:projectId`
List applications for a project (Creator only).

### `PATCH /api/v1/applications/:applicationId/status`
Accept or reject an applicant (`ACCEPTED` | `REJECTED` | `SHORTLISTED`).

---

## 6. Workspace, Kanban Tasks & Files

### `GET /api/v1/workspace/:projectId`
Get workspace summary, active members, open tasks, and milestones (Accepted members only).

### `GET /api/v1/workspace/:projectId/tasks`
List sprint tasks sorted by priority and status.

### `POST /api/v1/workspace/:projectId/tasks`
Create new task with title, description, priority, assignee, and due date.

### `PATCH /api/v1/workspace/:projectId/tasks/:taskId`
Update task status (`TODO` | `IN_PROGRESS` | `IN_REVIEW` | `DONE`).

### `POST /api/v1/workspace/:projectId/files`
Upload project document or asset (Validated with extension whitelist and 25MB boundary).

---

## 7. Project Health Intelligence Engine

### `GET /api/v1/health/projects/:projectId/health`
Evaluates algorithmic health score (0-100), risk status (`HEALTHY` | `NEEDS_ATTENTION` | `AT_RISK` | `CRITICAL`), team completeness, velocity, blocker alerts, and actionable recommendations.

---

## 8. Direct & Project Messaging

### `POST /api/v1/messages/direct`
Send direct message to a collaborator or applicant. Unauthorized unsolicited DMs are blocked (`403 Forbidden`).

### `POST /api/v1/messages/block` & `POST /api/v1/messages/unblock`
Block/unblock a user from initiating contact.

### `GET /api/v1/messages/conversations`
List all active conversations with unread counts.

---

## 9. Notifications & Multi-Channel Preferences

### `GET /api/v1/notifications`
List recent notifications with read status.

### `PATCH /api/v1/notifications/preferences`
Update notification channels (push, email, application alerts, project alerts, marketing).

---

## 10. Support & Safety Module

### `POST /api/v1/support/tickets`
Create support ticket (`TECHNICAL`, `USER_REPORT`, `PROJECT_REPORT`, `PRIVACY`, `INAPPROPRIATE_CONTENT`, `OTHER`).

### `GET /api/v1/support/tickets/my`
List submitted support tickets and responses.

---

## 11. Admin Dashboard & Platform Moderation

*All endpoints strictly require `Role: ADMIN`.*

### `GET /api/v1/admin/dashboard`
Returns 7 top-level platform metrics: total users, active projects, colleges, applications, active teams, open reports, open support tickets.

### `PATCH /api/v1/admin/users/:userId/status`
Suspend or restore user account.

### `DELETE /api/v1/admin/projects/:projectId`
Moderator removal of inappropriate projects.

### `GET /api/v1/admin/support/tickets` & `PATCH /api/v1/admin/support/tickets/:id`
Review, respond to, and resolve support tickets.

---

## 12. Colleges & Academic Directory

### `GET /api/v1/colleges`
Search verified university and college directory.

### `POST /api/v1/colleges`
Admin creation of new college or university branch.

---

## 13. WebSocket Real-Time Gateway

- **Connection URL**: `ws://localhost:4000` (or `wss://api.projectx.edu`)
- **Authentication**: `{ auth: { token: "<JWT_ACCESS_TOKEN>" } }`

### Client-to-Server Events
* `join_project`: `{ projectId: "..." }` (Verifies membership)
* `join_conversation`: `{ conversationId: "..." }` (Verifies participation)
* `send_project_message`: `{ projectId: "...", content: "..." }`
* `send_direct_message`: `{ conversationId: "...", content: "..." }`
* `task_status_changed`: `{ projectId: "...", taskId: "...", status: "DONE" }`

### Server-to-Client Events
* `project_message_received`: New message broadcasted to project room.
* `direct_message_received`: Direct message notification.
* `notification_received`: Push notification for applications/milestones.
* `task_updated`: Live Kanban board update across team members.
