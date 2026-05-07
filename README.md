Shakti AI: Intelligent Procurement & Compliance Ecosystem
Shakti AI is a state-of-the-art, AI-driven procurement platform designed to automate tender analysis, bidder evaluation, and compliance monitoring. By leveraging Google Gemini's advanced LLM capabilities and high-fidelity OCR, Shakti AI transforms heavy procurement documents into actionable intelligence.

🚀 Key Features
🏛️ Admin Intelligence Command Center
Deep Intelligence Scan: Automated OCR extraction of financial, technical, and compliance criteria from PDF tender documents.
Criteria Matrix Management: Dynamically edit, weigh, and finalize evaluation benchmarks.
Centralized PDF Visualization: Side-by-side view of extracted data and the original source document for instant verification.
Real-time Synchronization: One-click propagation of requirements from the Admin panel to the Bidder portal.
👷 Bidder Workspace (Smart Application Hub)
Dynamic Requirements Center: Automatically generated document checklists based on specific tender requirements.
Live AI Evaluation: Immediate feedback on uploaded documents with Pass/Fail status and detailed reasoning.
Compliance Tracking: Visual progress indicators (Timeline) and aggregate compliance scoring.
Deep Sync Technology: Manual "Intelligence Sync" to ensure zero-lag between tender updates and application requirements.
🔍 Security & Governance
AI Fraud Detection: Sophisticated cross-bidder analysis to flag potential collusion or organizational links.
Immutable Audit Logs: Comprehensive tracking of all administrative actions for transparency.
Manual Review Override: Human-in-the-loop workflow for edge cases flagged by the AI.
🛠️ Tech Stack
Frontend
Core: React.js with Vite
Styling: Vanilla CSS + Tailwind CSS (Optimized for "Data Jedi" aesthetic)
Animations: Framer Motion for smooth state transitions
Icons: Lucide-React
Data Viz: Recharts
Backend
Framework: FastAPI (Python 3.10+)
AI Engine: Google Gemini Pro (Generative AI)
Database: PostgreSQL (Hosted on Neon DB)
ORM: SQLAlchemy
OCR: Tesseract & PDF-to-Image processing
Async Processing: Native FastAPI Background Tasks
📥 Installation & Setup
1. Prerequisites
Node.js (v18+)
Python 3.10+
Tesseract OCR installed on your system
2. Backend Configuration
Create a .env file in the backend/ directory:

env
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
TESSERACT_CMD_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
bash
cd backend
pip install -r requirements.txt
python main.py
3. Frontend Configuration
Create a .env file in the frontend/ directory:

env
VITE_API_BASE_URL=http://localhost:8000/api
bash
cd frontend
npm install
npm run dev
📖 Usage Workflow
Admin: Upload a procurement PDF in the "Upload Tender" section.
Admin: Enter the "Deep Intelligence Scan" to extract criteria.
Admin: Review the extracted table, adjust weights, and click Finalize & Sync.
Bidder: Navigate to "Available Tenders" and click Apply Now.
Bidder: Upload the required documents in the "Verification" center.
Bidder: View the Live AI Status to see if your document passed compliance.