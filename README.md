# AI Interview Coach: Ready2Work

**Master your next interview with hyper-realistic AI coaching.**  
Ready2Work's Interview Coach is a production-grade interview preparation platform that uses advanced AI to simulate real interview scenarios, analyze your verbal performance, and provide competent, actionable feedback.

![Preview Screenshots](./public/dashboard-preview.png) *(Note: Placeholder for actual screenshot)*

## 🚀 Key Features

### 🧠 Competency-Driven Intelligence
*   **Dynamic Blueprints**: Every session generates a unique "Competency Blueprint" based on the specific Job Role or Description.
*   **Targeted Questioning**: Questions are generated to probe specific skills (e.g., "Conflict Resolution" for PMs, "System Design" for Engineers).
*   **Adaptive Reading Level**: Questions and feedback automatically adapt tone and complexity to match the role (Entry-level vs. Executive).

### 🎙️ Immersive "Glass" Interface
*   **Voice-First Interaction**: Speak your answers naturally. The AI utilizes **Speech-to-Text** to transcribe and analyze your response in real-time.
*   **Accessible Design**: Fully keyboard navigable with semantic HTML and ARIA labels for screen reader support (WCAG best practices).
*   **Premium UI**: Built with a modern, dark-mode "Glassmorphism" aesthetic using Tailwind CSS and Framer Motion.

### 📊 Deep Performance Analysis
Unlike generic tools, Ready2Work provides granular, structured feedback:
*   **Dimension Scoring**: Scores you on specific competencies (e.g., "Technical Depth", "Communication") relevant *only* to the question asked.
*   **Logical Feedback Chain**:
    1.  **Missing Signals**: Identifies key professional concepts you missed.
    2.  **One Big Upgrade**: Simplifies feedback into the single most critical gap to fix.
    3.  **"Try Saying This"**: Generates a script demonstrating exactly how to fix that upgrade.

### 📈 Dashboard & History
*   **Hybrid Storage**:
    *   **Guests**: Data stored locally in browser (encrypted) for privacy.
    *   **Users**: Data synced securely to Supabase (PostgreSQL) with Row Level Security (RLS).
*   **Accordion Insights**: Review full transcripts and AI analysis directly from the dashboard.

---

## 🛡️ Engineering Standards

We prioritize production readiness, security, and maintainability.

### Architecture & Security
*   **Defense in Depth**: API Endpoints (`/api/*`) are secured with explicit Auth Validation tiers, Payload Size Limits (10MB), and Method enforcement.
*   **Decision Logging**: Architecture decisions and structural changes are tracked in `DECISION_LOG.md`.
*   **Constraint Enforced**: Strict separation of concerns between UI Components, Service Logic, and API Handlers.

### Testing Strategy
We employ a robust testing pyramid using [Vitest](https://vitest.dev/).
*   **API Coverage**: Critical backend handlers (`init-session`, `generate-questions`, `analyze-answer`) are unit tested with mocked Auth and AI services.
*   **Component Testing**: Accessible components (`GlassInput`, `DebugInfoModal`) are tested for DOM structure and ARIA compliance.

**Run the test suite:**
```bash
npm test
# or specifically for API
npx vitest run tests/api/
```

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [React 19](https://react.dev/) (Vite)
*   **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom Glass UI System
*   **Animation**: [Framer Motion](https://www.framer.com/motion/)

### Backend & AI
*   **AI Model**: [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) (Multimodal: Audio/Text)
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
*   **Serverless**: Vercel Serverless Functions
*   **Testing**: Vitest + Node Mocks HTTP

---

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Gemini API Key (Google AI Studio)
*   Supabase Project (URL + Anon Key)

### Quick Start

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/ai-interview-coach.git
    cd ai-interview-coach
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root:
    ```env
    # Supabase (Auth & Data)
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key-here
    
    # Google Gemini AI (Server-side)
    GEMINI_API_KEY=your-gemini-key-here
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```
    Visit `http://localhost:5173`.

---

## 🔒 Privacy & Security
*   **Audio Privacy**: Raw user audio is processed for transcription and then **immediately discarded**. It is never stored permanently.
*   **Guest Mode**: Guest data is stored in **Local Storage** using AES encryption.
*   **Authenticated Mode**: User data is secured via Supabase Row Level Security (RLS).

## 📄 License
MIT