# Interview Coach

A robust, voice-activated interview preparation tool designed to help job seekers practice, refine, and master their interview skills.

Built with **React**, **Supabase**, and powered by **Google's Gemini 2.5 Flash**, this application provides a realistic mock interview experience with real-time, constructive AI feedback on both content and delivery.

## 🚀 Features

*   **Custom Job Prep:**
    *   **Role Selection:** Choose from pre-defined roles (Data Analytics, UX Design, etc.).
    *   **Job Description Input:** Paste a specific job description to generate highly tailored questions.
*   **Hybrid Interview Interface:**
    *   **Voice-First:** Answer verbal questions simulating a real call.
    *   **Text Support:** Type your answers if you prefer non-verbal practice.
    *   **SaaS-Quality TTS:** Questions are read aloud by a hyper-realistic AI voice (Gemini Audio).
*   **Real-Time AI Analysis:**
    *   **Content Feedback:** STAR method analysis, clarity checks, and relevance scoring.
    *   **Delivery Analysis:** Vocal pace, tone, and confidence evaluation.
    *   **Scoring:** "Strong", "Good", or "Needs Practice" ratings.
*   **Guest & User Modes:**
    *   **Teaser Mode:** Guests can try one full interview session for free.
    *   **Authenticated Access:** Sign up via Email/Password to verify email and save history.
*   **Session Insights:**
    *   **Readiness Score:** Visualizes your overall preparedness.
    *   **History:** Review past sessions and track improvement over time.

## 🛠️ Tech Stack

*   **Framework:** React 19 (Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4 + Shadcn/UI
*   **Backend/Auth:** Supabase
*   **AI Models:** Google Gemini 2.5 Flash (Text & Audio)

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   A Supabase Project (Free Tier works)
*   A Google Gemini API Key

### Steps

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd ai-interview-coach
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    # Supabase (Auth & Data)
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    
    # AI (Server-side functions)
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` in your browser.

## 📖 Usage Guide

1.  **Start:** 
    *   Select a **Role** (e.g., "Project Manager") OR
    *   Click **"Paste Job Description"** to input a specific JD.
2.  **Answer:** 
    *   Listen to the question (or read it).
    *   Click the **Mic** to record your answer, or switch to **Text** mode to type.
3.  **Review:** 
    *   Get instant feedback on your answer's structure and delivery.
    *   Click "Retry" to improve your score immediately.
4.  **Summary:** 
    *   Complete the session to see your final **Readiness Score**.
    *   Guests will be prompted to sign up to save this data.

## 📂 Project Structure

```
/src
 ├── /api          # Serverless functions (TTS)
 ├── /components   # UI components (Shadcn cards, buttons, etc.)
 ├── /context      # Global state (Auth, Session)
 ├── /hooks        # Custom React hooks
 ├── /pages        # Route views (RoleSelection, Interview, etc.)
 ├── /services     # External services (Supabase, Gemini)
 └── main.tsx      # Entry point
```

## 🛡️ License

MIT