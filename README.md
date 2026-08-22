# 🎓 ScholarAI

> **AI-powered scholarship discovery and application assistant**

ScholarAI is a web application that helps students **find relevant scholarships, understand their eligibility, and prepare better applications using AI**.

## ✨ Features

* 🔍 **AI Scholarship Search** – Find scholarships using natural-language queries.
* 🎯 **Personalized Recommendations** – Get AI-based explanations about scholarship suitability.
* ✍️ **AI Essay Generator** – Generate personalized scholarship essay drafts.
* 📊 **Student-Friendly Dashboard** – Easily explore and manage scholarship opportunities.
* 🤖 **Gemini AI Integration** – Powered by Google's Gemini model through Genkit.

## 🛠️ Tech Stack

* **Frontend:** Next.js, React, TypeScript
* **Styling:** Tailwind CSS
* **AI:** Google Gemini + Genkit
* **Validation:** Zod
* **Backend/Services:** Firebase

## 📁 Project Structure

```text
scholar-ai/
├── src/
│   ├── ai/
│   │   └── flows/
│   │       ├── intelligent-scholarship-search.ts
│   │       ├── personalized-scholarship-explanation.ts
│   │       └── automated-essay-generation.ts
│   ├── app/
│   ├── components/
│   └── lib/
├── package.json
└── README.md
```

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/Nagarjuna-1322/scholar-ai.git
cd scholar-ai
```

### Install dependencies

```bash
npm install
```

### Add environment variable

Create `.env.local`:

```env
GOOGLE_GENAI_API_KEY=your_api_key
```

### Run the project

```bash
npm run dev
```

Open **http://localhost:3000**

## 🤖 AI Workflow

```text
Student Profile
      ↓
AI Scholarship Search
      ↓
Relevant Scholarships
      ↓
Personalized Explanation
      ↓
AI Essay Generation
```

## 🔮 Future Improvements

* Live scholarship data
* Deadline notifications
* Scholarship tracking
* Resume-based recommendations
* Advanced eligibility matching
* User authentication

## 👨‍💻 Author

**Nagarjuna Reddy**

B.Tech Artificial Intelligence & Machine Learning Student

🔗 [GitHub](https://github.com/Nagarjuna-1322)

---

⭐ **If you like ScholarAI, consider giving the repository a star!**

