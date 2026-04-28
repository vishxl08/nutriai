<div align="center">
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green" alt="Django" />
  <img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</div>

<h1 align="center">NutriAI: Smart Nutrition & Fitness Tracker</h1>

<p align="center">
  <b>NutriAI is a highly optimized, cloud-ready nutrition and fitness tracking application featuring an AI-powered food scanner, dynamic macro visualization, and a beautiful FitooZone Amethyst UI.</b>
</p>

---

## ✨ Key Features
- **🤖 AI Food Scanner (Groq Llama Vision)**: Upload an image of your meal, and the AI automatically recognizes the food, estimating calories and macros.
- **📊 Interactive Analytics Dashboard**: Beautiful, real-time `ApexCharts` rendering your weekly macro trends, weight logs, and daily water intake.
- **🎨 FitooZone Amethyst Aesthetic**: A premium, "soft-pill" glassmorphism UI built entirely with highly optimized Vanilla CSS.
- **🎯 Dynamic Daily Goals**: Set multiple concurrent goals (Calories, Protein, Weight) and track your progress in real-time.
- **☁️ Cloud-Native & Serverless Ready**: Designed natively for deployment on Vercel with Neon PostgreSQL for zero-maintenance scalability.

---

## 🛠️ Technology Stack
### Frontend
* **Core**: HTML5, Vanilla JavaScript (ES6+), CSS3
* **Data Visualization**: ApexCharts JS
* **UI/UX**: Custom FitooZone Amethyst Design System (Glassmorphism, Animations)

### Backend
* **Framework**: Django 6.0 (Python 3.12)
* **API Framework**: Django REST Framework + SimpleJWT
* **Database**: Neon Serverless PostgreSQL / SQLite (Local)
* **Static Serving**: WhiteNoise

---

## 🚀 Local Development Setup

To run NutriAI on your local machine, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/vishxl08/nutriai.git
cd nutriai
```

### 2. Install Dependencies
Ensure you have Python 3.12+ installed, then run:
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add the following variables:
```env
SECRET_KEY=your_secure_random_string
DEBUG=True
ALLOWED_HOSTS=*
# For local SQLite, leave DATABASE_URL empty.
# For remote DB: DATABASE_URL=postgres://user:password@host/db
```

### 4. Database Migrations
Initialize your database tables:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Run the Server
```bash
python manage.py runserver
```
Navigate to `http://127.0.0.1:8000/` in your browser.

---

## ☁️ Deployment (Vercel)
NutriAI is pre-configured for **Vercel Serverless Deployment**.

1. Connect this repository to your Vercel Dashboard.
2. Under **Environment Variables**, add your `SECRET_KEY`, set `DEBUG` to `False`, and connect a **Neon Postgres** database.
3. Vercel will automatically install `requirements.txt` and map routing via `vercel.json`.
4. *Post-Deployment Setup*: Visit `/api/migrate` on your live domain to instantly initialize your Postgres database tables!

---

## 📁 Repository Structure
* `nutriai_dj/` - Core Django configuration (`settings.py`, `wsgi.py`, `urls.py`).
* `tracker/` - Main application handling business logic (`views.py`, `models.py`).
* `tracker/static/tracker/` - The compiled frontend engine (`app.js`, `styles.css`).
* `staticfiles/` - Production-ready, pre-compiled static assets for Vercel WhiteNoise serving.
* `vercel.json` - Vercel Serverless Edge routing configurations.

---
*Developed with ❤️ for the FitooZone Ecosystem.*
