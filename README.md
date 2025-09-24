# AIPrep — Chat + Visualization

AIPrep explains scientific concepts with **text + animations**.  
Users ask a question → Backend (LLM) generates **explanation + visualization JSON** → Frontend displays both.  

---

## ⚙️ Setup

```bash
git clone https://github.com/mananj23/Chat-to-Visualization-App.git
cd Chat-to-Visualization-App
// Backend terminal
cd backend
npm install
// .env file inside backend/ with your API key:
OPENAI_API_KEY=your_api_key_here
npm start
// Backend runs on http://localhost:5000
// Frontend terminal
cd ../frontend
npm install
npm start
// Frontend runs on http://localhost:3000

