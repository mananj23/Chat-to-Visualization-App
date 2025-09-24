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
 ```
## Example Demonstrations


### Q: Explain Photosynthesis
**Text Answer:**
Photosynthesis is the process by which green plants use sunlight to convert carbon dioxide and water into glucose and oxygen.


**Visualization:**
- Sun shining on a leaf
- Arrows showing CO₂ + H₂O going in
- Arrow showing O₂ coming out


---


### Q: Explain the Solar System
**Text Answer:**
The Solar System consists of the Sun at the center with planets orbiting due to gravity.


**Visualization:**
- Yellow Sun in the center
- Blue Earth orbiting around it


---


### Q: Explain Newton’s First Law of Motion
**Text Answer:**
An object remains at rest or in uniform motion unless acted upon by an external force.


**Visualization:**
- A ball moving straight
- Arrow indicating applied force


---


## Fake Screenshot Example
Below is a sample fake screenshot to demonstrate how the interface might look:


![AIPrep Screenshot](./screenshot.png)


---


