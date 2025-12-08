# AI Interview Coach

A robust, voice-activated interview preparation tool designed to help job seekers practice, refine, and master their interview skills.

Built with **React** and powered by **Google's Gemini 2.5 Flash**, this application provides a realistic mock interview experience with real-time, constructive AI feedback on both content and delivery.

## 🚀 Features

* **Role-Specific Question Generation:** Instantly generates relevant interview questions for various roles (e.g., Data Analytics, UX Design, Project Management) using the Gemini API.
* **Voice-First Interface:** Users answer questions verbally, simulating a real interview environment.
* **Real-Time Audio Visualization:** Provides visual feedback during recording to ensure microphone activity.
* **Instant AI Analysis:**
    * **Transcription:** Converts speech to text for self-review.
    * **Content Feedback:** Analyzes answers for clarity, structure (STAR method), and relevance.
    * **Delivery Analysis:** Evaluates vocal pace, tone, and confidence (e.g., "Too Fast", "Monotone", "Confident").
    * **Key Term Extraction:** Identifies professional keywords used in the response.
    * **Rating System:** Grades answers as "Strong," "Good," or "Needs Practice."
* **Comprehensive Session Summary:**
    * **Readiness Score:** A visual circular metric indicating overall preparedness.
    * **Performance Breakdown:** High-level stats on strong vs. weak answers.
    * **Detailed Review:** An interactive accordion view to drill down into transcripts and specific feedback for every question.

## 🛠️ Tech Stack

* **Frontend Framework:** React 19
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **AI Integration:** Google GenAI SDK (`@google/genai`)
* **Icons:** Lucide React
* **Language:** TypeScript

## 📦 Installation & Setup

### Prerequisites
* Node.js (v18 or higher)
* A Google Gemini API Key (Get one at [aistudio.google.com](https://aistudio.google.com/))

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
    Create a `.env.local` file in the root directory and add your API keys:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    # Optional for natural voice narration (serverless TTS)
    ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
    ELEVENLABS_VOICE_ID=optional_voice_id_override
    ```

4.  **Run the Development Server**
        - Frontend only (no serverless functions):
            ```bash
            npm run dev
            ```
        - Frontend + API routes (recommended for TTS testing):
            ```bash
            vercel dev
            ```
        Open your browser to the shown localhost URL.

## 📖 Usage Guide

1.  **Select a Role:** Choose your target job field (e.g., "Digital Marketing") from the dashboard.
2.  **Answer Questions:** The AI will present a question. Click the microphone icon to record your verbal answer.
3.  **Review Feedback:** Immediately after answering, view your transcript and get specific AI coaching tips.
4.  **Iterate:** Choose to "Retry" the question to apply the feedback immediately, or move to the next one.
5.  **View Summary:** After completing the session, review your "Readiness Score" and a holistic breakdown of your performance.

### 🔊 Natural Voice Narration (Google Cloud TTS)

The app narrates questions using Google Cloud Text-to-Speech (not the browser `speechSynthesis`).

1. Enable the Text-to-Speech API in your Google Cloud project.
2. Create an API key (standard key) with access to Text-to-Speech.
3. Set environment variables in Vercel:
    - `GOOGLE_TTS_API_KEY` (required)
    - `GOOGLE_TTS_VOICE_NAME` (optional, e.g. `en-US-Wavenet-D`)
    - `GOOGLE_TTS_LANGUAGE_CODE` (optional, defaults `en-US`)
    - `GOOGLE_TTS_SPEAKING_RATE` (optional, `0.25`–`4.0`, defaults `1.0`)
    - `GOOGLE_TTS_PITCH` (optional, `-20.0`–`20.0`, defaults `0.0`)
4. (Local) Add the same variables to `.env.local` and restart dev.
5. Click "Play Voice" to fetch audio.

If no key is set, the button will show an error message.

To switch providers later, adjust `api/tts.ts` with the new REST endpoint/payload.

### 🔎 Find Available Voices (PowerShell)

List Google TTS voices and filter by language:

```powershell
$env:GOOGLE_TTS_API_KEY = "<YOUR_KEY>"
$voices = Invoke-RestMethod -Method Get -Uri "https://texttospeech.googleapis.com/v1/voices?key=$env:GOOGLE_TTS_API_KEY"
$voices.voices | Where-Object { $_.languageCodes -contains 'en-US' } | Select-Object name,languageCodes,naturalSampleRateHertz | Format-Table -AutoSize
```

Use a `name` (e.g., `en-US-Wavenet-D`) in `GOOGLE_TTS_VOICE_NAME`.

### 🧪 Test the API Route

```powershell
Invoke-RestMethod -Method Post `
    -Uri "http://localhost:3000/api/tts" `
    -ContentType "application/json" `
    -Body (@{ text = "Hello from Google TTS"; voiceName = "en-US-Wavenet-D"; speakingRate = 1.05; pitch = -2 } | ConvertTo-Json)
```

If you see `{ audioBase64: "..." }`, the route works. For local API routing, prefer `vercel dev`.

## 📂 Project Structure

/src ├── /components # UI components (QuestionCard, AudioVisualizer, Icons, etc.) ├── /services # API logic (geminiService.ts) ├── App.tsx # Main application logic and screen routing ├── types.ts # TypeScript interfaces and constants └── main.tsx # Entry point


## 🛡️ Privacy Note

This application processes audio locally to create a blob, which is then sent securely to the Gemini API for analysis. Audio data is not permanently stored on any server by this application.

## 📄 License

MIT