# SkillHub — Comprehensive System Architecture & Engineering Guide

Welcome to the **SkillHub** project guide. This document serves as the complete technical specification, architectural blueprint, and learning resource for the entire SkillHub platform. It details existing implemented core modules—**Quizzes & Assessments**, **Enrollments & Payments**, **Student Learning Classroom Layer**, and **Course Reviews**—as well as the full engineering blueprint for the upcoming **Support Ticketing & Transactional Mailing System**.

---

## Table of Contents
1. [Platform Overview & Technology Stack](#1-platform-overview--technology-stack)
2. [Role-Based Access Control (RBAC) & Governance Model](#2-role-based-access-control-rbac--governance-model)
3. [Student Learning Layer (Course Player & Classroom)](#3-student-learning-layer-course-player--classroom)
4. [Quizzes & Assessment Engine](#4-quizzes--assessment-engine)
5. [Enrollments & Payment Processing Layer](#5-enrollments--payment-processing-layer)
6. [Course Reviews & Rating System](#6-course-reviews--rating-system)
7. [Support Ticketing System: Industry Model & Blueprint](#7-support-ticketing-system-industry-model--blueprint)
8. [Transactional Mailing Engine: Architecture & Templates](#8-transactional-mailing-engine-architecture--templates)
9. [Step-by-Step Implementation Roadmap](#9-step-by-step-implementation-roadmap)

---

## 1. Platform Overview & Technology Stack

SkillHub is an enterprise-grade EdTech and online learning management platform inspired by platforms such as Coursera and Udemy. It is built with a decoupled architecture:

```text
  ┌─────────────────────────────────────────────────────────────┐
  │                 SkillHub Angular SPA (Client)               │
  │     (Standalone Components, Signals/RxJS, Glassmorphic UI)  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ HTTP / JSON API (JWT Bearer)
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 SkillHub Web API (.NET 8)                   │
  │     (Controllers, Application Layer, EF Core, SQL Server)   │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
  ┌──────────────┐                               ┌──────────────┐
  │  SQL Server  │                               │  Third-Party │
  │  (Data Store)│                               │ (Pay / Mail) │
  └──────────────┘                               └──────────────┘
```

### Technology Highlights
- **Backend**: C# / ASP.NET Core (.NET 8 Web API), Entity Framework Core, SQL Server, JWT Bearer Authentication, FluentValidation, LINQ.
- **Frontend**: Angular 17+, TypeScript, Standalone Components, Reactive & Template Forms, RxJS Observables, Custom Directives (`*hasPermission`), Modern SCSS with Glassmorphism & Micro-animations.
- **Security & Authorization**: Claims-based Identity with dynamic Database-driven Permissions (RBAC) and granular per-user overrides.

---

## 2. Role-Based Access Control (RBAC) & Governance Model

SkillHub uses a dynamic, database-backed authorization engine with four standard roles:

| Role | Access Level | Description |
| :--- | :--- | :--- |
| **SuperAdmin** | Full / Unrestricted | Platform owner. Can access all administrative tabs, inspect financial logs, and configure global and per-SubAdmin permissions. |
| **SubAdmin** | Delegated Operational Admin | Staff member. Receives a configurable subset of permissions assigned by SuperAdmin (e.g., Course Approval, User Management). |
| **Instructor** | Creator | Creates and edits courses, builds curriculum sections, uploads video lessons, and adds assessment quizzes. |
| **Student** | Learner | Browses course catalog, enrolls, completes lectures, submits quizzes, earns certificates, and writes reviews. |

### Dynamic SuperAdmin Permission Studio
Rather than hardcoding authorization in controllers, permissions are stored in the database:
- `Permissions` table: Granular actions (`COURSES_VIEW`, `COURSES_APPROVE`, `USERS_MANAGE`, `ANALYTICS_VIEW`, etc.).
- `RolePermissions` table: Baseline permissions mapped to each role.
- `UserPermissions` table: Individual override table allowing a SuperAdmin to grant or deny specific permissions to individual SubAdmins without modifying other users of that role.

### Course Approval Lifecycle & Inspection Mode
```text
  [ Instructor ] ──► Creates Course & Uploads Lessons (IsPublished = false)
                            │
                            ▼
  [ Database ] ────► Course Status: Pending Approval
                            │
                            ▼
  [ Admin / SubAdmin ] Inspects Course via Pre-Approval Inspection Banner
                            │ (Full preview of sections, videos, quizzes before public release)
                            ▼
                     [ Approve Course ] ──► IsPublished = true (Visible in Catalog)
```
- **Pre-Approval Inspection**: Non-published courses are hidden from the public catalog. However, authorized SuperAdmins and SubAdmins (and the course owner) can inspect the full course detail page via an Admin Inspection Banner and approve it directly with one click.

---

## 3. Student Learning Layer (Course Player & Classroom)

The student classroom layer provides an interactive learning environment (`/learn/:courseId`).

```text
 ┌───────────────────────────────────────────────┬───────────────────────────────┐
 │          Active Video / Lecture Screen        │      Curriculum Accordion     │
 │                                               │                               │
 │  ┌─────────────────────────────────────────┐  │  ▼ Section 1: Intro (2/2)    │
 │  │                                         │  │    ✔ Lesson 1: Welcome (5m)   │
 │  │      Embedded Video Player (16:9)       │  │    ✔ Lesson 2: Setup (12m)    │
 │  │         (YouTube / SafeResource)        │  │                               │
 │  │                                         │  │  ▶ Section 2: Core (0/3)      │
 │  └─────────────────────────────────────────┘  │    ○ Lesson 3: Syntax (15m)   │
 │                                               │    ○ Lesson 4: Types (8m)     │
 │  [ Tab: Overview ] [ Tab: Resources ] [ Quiz ]│                               │
 │  ● Lecture Notes / Downloadable Files (.pdf)  │  Overall Progress: [=== 40% ] │
 └───────────────────────────────────────────────┴───────────────────────────────┘
```

### Key Technical Mechanisms:
1. **Curriculum Hierarchy**:
   - `CourseSection`: Ordered section container (`DisplayOrder`, `Title`).
   - `CourseLesson`: Individual lectures (`DurationMinutes`, `VideoUrl`, `SectionId`).
   - `LessonResource`: Downloadable supplementary assets (`FileName`, `FileUrl`, `LessonId`).
2. **Video Stream Sanitization**:
   - URLs are safely converted into embeddable YouTube/HTML5 targets and passed through Angular’s `DomSanitizer.bypassSecurityTrustResourceUrl` to prevent XSS.
3. **Graceful Fallback**:
   - If a lesson does not contain a video URL, the player automatically renders a clean **"Text / Practical Resource Lecture"** state with downloadable reference attachments.
4. **Lesson Completion & Progress Computation**:
   - Whenever a student clicks **"Mark Complete"**, an entry is stored in `LessonCompletions (StudentId, CourseId, LessonId)`.
   - The aggregate course progress is dynamically calculated:
     $$\text{Progress \%} = \text{Round}\left(\frac{\text{Completed Lessons}}{\text{Total Lessons}} \times 100, 1\right)$$
5. **Dynamic Certificate of Completion**:
   - When progress reaches **100%**, the platform unlocks a **Certificate Modal**.
   - Contains verifiable credential metadata: Student Name, Course Title, Completion Date, Instructor Signature, and a unique verification hash.

---

## 4. Quizzes & Assessment Engine

SkillHub includes an integrated quiz system to validate student comprehension before course completion.

### Database Architecture
- `Quizzes`: `Id`, `CourseId`, `Title`, `Description`, `PassingScorePercentage` (e.g., 70%), `DisplayOrder`.
- `QuizQuestions`: `Id`, `QuizId`, `QuestionText`, `DisplayOrder`.
- `QuizOptions`: `Id`, `QuestionId`, `OptionText`, `IsCorrect` (Boolean).
- `QuizAttempts`: `Id`, `QuizId`, `StudentId`, `ScorePercentage`, `IsPassed`, `AttemptedAt`.
- `QuizAnswers`: `Id`, `QuizAttemptId`, `QuestionId`, `SelectedOptionId`, `IsCorrect`.

### Assessment Workflow
```text
  [ Student in Player ] ──► Opens Quiz Tab
                                   │
                                   ▼
  [ Fetch Quiz Data ] ────► Options are sent to frontend WITHOUT 'IsCorrect' flag
                                   │ (Prevents client-side inspection / cheating)
                                   ▼
  [ Submit Attempt ] ─────► Frontend sends { quizId, answers: { questionId: optionId } }
                                   │
                                   ▼
  [ Server-Side Grading ] ► QuizService compares option IDs with database
                                   │ Calculates score % = (correct / total) * 100
                                   │ Checks if score % >= PassingScorePercentage
                                   ▼
  [ Result Returned ] ────► Saves QuizAttempt & displays breakdown:
                             - Your Score (e.g., 85%)
                             - Status (PASSED / FAILED)
                             - Best Attempt Record
```

---

## 5. Enrollments & Payment Processing Layer

The enrollment system connects course catalog discovery with access permissions.

### Free vs. Paid Course Workflow
1. **Free Courses (Price = 0)**:
   - When a student clicks **"Enroll for Free"**, the system directly calls `EnrollmentService.EnrollFreeCourseAsync`.
   - Immediately records the enrollment and grants instant classroom access.
2. **Paid Courses**:
   - Initiates payment gateway transaction flow (Razorpay integration with signature verification, or Mock Payment for local development).
   - Once verified, creates `PaymentTransaction` with status `SUCCESS` and records `CourseEnrollment`.
3. **Duplicate Protection & Idempotency**:
   - Every enrollment check performs an atomic `AnyAsync(e => e.StudentId == userId && e.CourseId == courseId)` verification. If already enrolled, the UI shifts from "Enroll Now" to "Resume Learning".

---

## 6. Course Reviews & Rating System

The review module enables social proof and course quality ranking.

### Functional Mechanics:
- **Verified Purchaser Rule**: Only students with an active `CourseEnrollment` record for that specific course can submit a review.
- **Rating Scale**: 1 to 5 stars + optional in-depth feedback text.
- **Statistical Aggregation**:
  - `AverageRating`: Rounded to 1 decimal place (e.g., 4.8 / 5.0).
  - `TotalReviews`: Total count of reviews submitted.
  - `RatingDistribution`: Star-by-star breakdown (percentage of 5★, 4★, 3★, 2★, 1★) powering the visual rating histogram on the course detail page.
- **Editable Reviews**: If a student already reviewed a course, opening the review dialog pre-populates their rating and comment for updating.

---

## 7. Support Ticketing System: Industry Model & Blueprint

In leading platforms like Zendesk, Freshdesk, Coursera, and Stripe, support systems are designed around **threaded conversations**, **SLA prioritization**, and **internal team collaboration**.

```text
  [ Student / Instructor ]                              [ Support SubAdmin / SuperAdmin ]
             │                                                          │
             ▼                                                          ▼
  ┌──────────────────────┐      ┌─────────────────────────┐     ┌──────────────────────┐
  │   Create Ticket      │ ───► │  SkillHub Ticket Queue  │ ◄── │  Filter by Category  │
  │ (Category, Priority) │      │  (Status, SLA, Assign)  │     │   & Assign Staff     │
  └──────────────────────┘      └────────────┬────────────┘     └──────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
          ┌───────────────────────────┐               ┌───────────────────────────┐
          │     Public Message        │               │   Private Internal Note   │
          │ (Visible to Student & Staff)│             │ (Visible ONLY to Staff)   │
          └───────────────────────────┘               └───────────────────────────┘
```

### Proposed Database Entities

#### 1. `SupportTicket`
```csharp
public class SupportTicket
{
    public long Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty; // e.g., "TICK-2026-00412"
    public long UserId { get; set; }                          // Ticket Creator
    public User User { get; set; } = null!;
    
    public string Subject { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;     // Payment, Technical, Course, Account
    public string Priority { get; set; } = "Medium";         // Low, Medium, High, Urgent
    public string Status { get; set; } = "Open";             // Open, InProgress, WaitingOnUser, Resolved, Closed
    
    public long? AssignedAdminId { get; set; }               // SubAdmin handling ticket
    public User? AssignedAdmin { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    
    public ICollection<TicketMessage> Messages { get; set; } = new List<TicketMessage>();
}
```

#### 2. `TicketMessage` (Conversation Thread)
```csharp
public class TicketMessage
{
    public long Id { get; set; }
    public long TicketId { get; set; }
    public SupportTicket Ticket { get; set; } = null!;
    
    public long SenderUserId { get; set; }
    public User SenderUser { get; set; } = null!;
    
    public string MessageText { get; set; } = string.Empty;
    
    // Crucial Industry Feature: Allows staff to leave private notes 
    // (e.g. "Bank refund initiated via Stripe dashboard") hidden from students.
    public bool IsInternalNote { get; set; } = false;
    
    public string? AttachmentUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

### Ticket Status Lifecycle (State Machine)
- **`Open`**: Ticket submitted by user; awaiting staff first response.
- **`InProgress`**: Staff assigned and actively investigating.
- **`WaitingOnUser`**: Staff replied asking for further details/screenshots.
- **`Resolved`**: Solution provided. User can confirm or reopen within 48 hours.
- **`Closed`**: Ticket finalized. Archived from active queues.

### Granular Support Permissions in Dynamic Matrix:
- `SUPPORT_VIEW`: View ticket queues.
- `SUPPORT_REPLY`: Reply to tickets and add internal notes.
- `SUPPORT_ASSIGN`: Assign tickets to specific SubAdmins.
- `SUPPORT_RESOLVE`: Mark tickets as resolved or closed.

---

## 8. Transactional Mailing Engine: Architecture & Templates

Synchronous SMTP calls inside HTTP controller actions cause high latency and fail if the mail server is momentarily unreachable. In production, transactional email systems use an **abstraction layer**:

```text
  [ Platform Event Trigger ]
  (e.g., Ticket Created, Admin Replied, Course Enrolled, Course Approved)
              │
              ▼
    [ IEmailService Abstraction ]
              │
     ┌────────┴────────────────────────┬────────────────────────┐
     ▼                                 ▼                        ▼
[ Development Mode ]          [ SMTP Server ]          [ Cloud Provider ]
(Console / Fake Logger)      (Local MailHog / Smtp4Dev) (SendGrid / AWS SES / Resend)
```

### 1. The Core Abstraction (`IEmailService`)
```csharp
public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    Task SendTemplateEmailAsync<T>(string toEmail, string templateName, T model);
}
```

### 2. Core Responsive Email Templates
All email notifications use a consistent, responsive HTML design matching SkillHub’s purple and slate branding:
1. **Ticket Opened Receipt**: Confirmation sent to student with ticket reference number, expected SLA resolution time, and direct thread link.
2. **Staff Response Alert**: Sent to student when an admin responds, with a message excerpt and link to reply.
3. **Course Enrollment & Invoice**: Contains course thumbnail, order number, amount paid, and "Start Learning" button.
4. **Instructor Course Approval / Feedback**: Notifies instructors when their course has been published or requires edits.
5. **Certificate of Completion Notice**: Delivers the verifiable certificate link directly to the student upon 100% course completion.

---

## 9. Step-by-Step Implementation Roadmap

To implement the Support Ticketing & Mailing Engine into SkillHub, follow this phased plan:

### Phase 1: Backend Domain & Persistence
1. Create `SupportTicket` and `TicketMessage` entities in `SkillHub.Domain`.
2. Configure Entity mappings and relationships in `ApplicationDbContext`.
3. Create EF Core Migration (`AddSupportTicketingModule`) and update database.
4. Seed new Support permissions (`SUPPORT_VIEW`, `SUPPORT_REPLY`, etc.) in `PermissionSeeder.cs`.

### Phase 2: Application Layer & Mailing Engine
1. Implement `IEmailService` in `SkillHub.Infrastructure` with configuration-driven provider switching (Development Logger vs. SMTP / Cloud).
2. Create HTML email templates for ticket creation and staff replies.
3. Implement `ISupportService` with business logic for ticket creation, status changes, assignment, and messaging.
4. Create `SupportController` with role-aware endpoints:
   - Students only see their own tickets (`IsInternalNote = false`).
   - Admins see the full ticket queue and can filter by status, priority, and category.

### Phase 3: Frontend Portals (Angular 17)
1. **Student Help & Support Portal**:
   - `/support`: List my active/past tickets with status badges.
   - `/support/new`: New ticket submission form with category dropdown and priority selection.
   - `/support/:id`: Interactive conversation thread with real-time response capability.
2. **Admin Helpdesk Studio**:
   - `/admin/support`: Tabbed queue (All, Open, In-Progress, My Assigned).
   - Staff reply composer with toggle: **"Public Response"** vs. **"Internal Staff Note (Yellow Highlight)"**.
   - One-click ticket status transition controls (`Resolve`, `Close`, `Reassign`).

---

*This guide serves as the official architecture reference for SkillHub. Keep this document updated as new modules and capabilities are deployed.*
