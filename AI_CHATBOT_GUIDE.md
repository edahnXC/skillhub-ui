# SkillHub AI Learning Copilot — Architecture & Execution Guide
*Powered by Google Gemini 1.5 & 2.0 Flash (Free Tier)*

---

## 1. Overview & Free Tier Economics

SkillHub's AI Learning Copilot is integrated directly into the platform to provide instant educational assistance to students, curriculum brainstorming for instructors, and administrative triage help for staff.

### Free Tier Specifications (Google Gemini via Google AI Studio)
- **Model**: `gemini-1.5-flash` (or `gemini-2.0-flash`)
- **Requests Per Minute (RPM)**: **15 RPM**
- **Tokens Per Minute (TPM)**: **1,000,000 TPM**
- **Requests Per Day (RPD)**: **1,500 RPD** completely free (up to ~45,000 requests/month)
- **Context Window**: **1,000,000 tokens** (enables full course syllabi and multi-turn conversations)
- **Cost**: **$0.00 / month** (Zero credit card or billing account required)

---

## 2. How to Obtain a Free Gemini API Key (30 Seconds)

1. Open your browser and navigate to **[Google AI Studio](https://aistudio.google.com/)**.
2. Sign in with any standard Google account.
3. Click the blue button **"Get API key"** in the top left navigation.
4. Click **"Create API key"** -> select any existing Google Cloud project or click *"Create key in new project"*.
5. Copy your new API key (starts with `AIzaSy...`).
6. Open [appsettings.json](file:///F:/Projects/SkillHub/SkillHub.API/appsettings.json) in `SkillHub.API` and paste your key:
   ```json
   "GeminiSettings": {
     "ApiKey": "AIzaSyYourActualKeyHere...",
     "Model": "gemini-1.5-flash"
   }
   ```
7. Save the file. The backend automatically switches from **Smart Guide Fallback Mode** to **Live Gemini 1.5 Flash Generative AI**!

---

## 3. Tiered Access Strategy (Quota Protection & Conversion)

To prevent web scrapers or anonymous scripts from exhausting your 1,500 daily requests while showcasing the AI to new users:

| User Type | Access Tier | Quota Limit | Behavior |
| :--- | :--- | :--- | :--- |
| **Guest / Visitor** (Landing Page & Catalog) | **Free Preview** | **5 queries / session** | Users can ask 5 questions to test the assistant. After 5 queries, a call-to-action prompts them to create a free account to unlock unlimited access. |
| **Registered Students** | **Full Learning Copilot** | Standard platform rate limit | Explains lessons, helps solve coding bugs, recommends courses, explains quiz concepts. |
| **Instructors & Staff** | **Full Studio Copilot** | Standard platform rate limit | Helps write course descriptions, generates quiz questions, drafts support answers. |

---

## 4. End-to-End Execution Architecture

```
                                 [ Angular 17+ SPA ]
                                          │
                      Global Floating Widget: <app-ai-copilot>
                          Available on /home, /courses, /learn/:id
                                          │
                        POST /api/aichat/message
                        { message, history, contextUrl }
                                          │
                                          ▼
                               [ SkillHub.API (.NET 8) ]
                                          │
                           AiChatController (Rate Limiter)
                                          │
                                          ▼
                                   IAiChatService
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │                                             │
      [ If ApiKey Configured ]                      [ If ApiKey Empty / Offline ]
                   │                                             │
                   ▼                                             ▼
       Google Gemini REST API                         SkillHub Smart Fallback
   https://generativelanguage.googleapis.com          Built-in rule-based expert
   v1beta/models/gemini-1.5-flash:generateContent     answers courses, enrollments,
                                                      quizzes & helpdesk questions
```

---

## 5. System Prompt Grounding

The AI Copilot is primed with a system instruction that instructs it to act as **SkillHub's Friendly Learning Tutor & Navigator**:
- Knowledgeable about SkillHub's courses (.NET 8, Angular, Web Development, Cloud Computing, Database Architecture).
- Explains code with concise syntax and formatted markdown blocks.
- Guides users through platform features (Certificates, Quizzes, Support Helpdesk, My Learning).
- Recommends courses matching the user's skill level (Beginner vs Advanced).

---

## 6. API Reference

### `POST /api/aichat/message`
Dispatches a user message to the Copilot.

**Request Body**:
```json
{
  "message": "Can you explain how Dependency Injection works in .NET?",
  "contextUrl": "/learn/1",
  "history": [
    { "role": "user", "text": "Hi!" },
    { "role": "model", "text": "Hello! I am your SkillHub AI Learning Copilot. How can I help you today?" }
  ]
}
```

**Response Body**:
```json
{
  "reply": "Dependency Injection (DI) is a software design pattern where an object receives other objects that it depends on...",
  "suggestions": [
    "What is the difference between AddScoped and AddTransient?",
    "Show me a code example in C#",
    "How does this relate to SkillHub's architecture?"
  ],
  "remainingGuestQuota": 4
}
```

### `GET /api/aichat/suggestions?route=/courses`
Returns contextual prompt suggestion chips tailored to the user's current page.

---

## 7. Factual Grounding & Domain Training (RAG)

To ensure high domain accuracy, factual pricing, and expert guidance for the Indian job market, the Copilot features comprehensive grounding:

1. **Live Course Catalog Grounding**:
   - The AI dynamically queries live published courses directly from Entity Framework Core (`Courses` table).
   - Injects current discounted prices (`₹2,499`), original prices (`₹5,999`), discount percentages (`58% OFF`), instructors, and links directly into the system context.
2. **Strict Currency Compliance**:
   - All quotes, course fees, and calculations are strictly presented in **Indian Rupees (`₹` / INR)**.
   - US Dollars (`$`) are strictly prohibited across the model and fallback responses.
3. **Placement & Aptitude Shortcuts**:
   - **Trains, Platforms & Speed**: Golden conversion rule ($\text{km/h} \to \text{m/s}$ using $\frac{5}{18}$), relative speed rules, and solved examples.
   - **Time & Work**: LCM Unit Method (calculates individual and combined daily efficiencies rather than slow fraction arithmetic).
   - **Simple & Compound Interest**: $SI = \frac{P \times R \times T}{100}$, 2-year difference formula $D = P \times \left(\frac{R}{100}\right)^2$.
4. **Technical & Framework Mastery**:
   - Modern Angular (v17+ Standalone, Signals `signal()`, `computed()`, `effect()`, `@if` / `@for`).
   - ASP.NET Core (.NET 8 Dependency Injection lifetimes: Transient, Scoped, Singleton).
5. **Platform Workflows**:
   - Course Quizzes: 70% passing threshold for completion.
   - Verified Certificates: Auto-generated with unique verifiable credential IDs.
   - Helpdesk: `/support` ticketing integration.

