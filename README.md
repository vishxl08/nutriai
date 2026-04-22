# NutriAI — Indian Nutrition & Fitness Tracker 🥗💪

Your personal AI-powered nutrition and fitness tracker with full Indian food database and daily goals.

---

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

Open http://127.0.0.1:8000 in your browser.

---

## 🤖 Setting Up AI Food Scanner

The AI food recognition requires a Groq API key.

1. Go to [https://console.groq.com/keys](https://console.groq.com/keys) and create a free account
2. Create an API key under "API Keys"
3. Login to the app → Profile tab → "AI Configuration"
4. Paste your API key and tap Save
5. Now the 📸 Scan button will recognize any food photo!

> **Note:** The API key is stored securely in your user profile.

---

## ✨ Features

### 🏠 Home Dashboard
- Daily calorie ring with real-time updates
- Macro bars (Protein / Carbs / Fat) vs goals
- Water intake tracker (8 cups × 375ml)
- Body weight logger with history
- Today's meal log
- **Daily Goal** - Set personal goals like "Today's PR 100kg Bench Press"

### 📸 AI Food Scanner
- Upload any photo of Indian food
- Groq AI identifies the dish, portion, and calculates:
  - Calories, Protein, Carbs, Fat, Fiber
  - Detected ingredients
  - Cooking method impact
- Portion adjuster (25%–300%)
- Based on IFCT 2017 + USDA FoodData Central

### 🔍 Food Search
- 300+ Indian foods in database
- IFCT 2017 verified values
- Sources: IFCT, USDA, Brand labels
- Categories: Grains, Dal, Veggies, Fruits, Dairy, Eggs & Meat, Indian Dishes, Nuts, Oils, Supplements, Drinks

### 🏋️ Gym Tracker
- Log exercises with weight, sets, reps
- Automatic volume calculation
- Calorie burn estimation
- TDEE (Total Daily Energy Expenditure) calculator
- Calorie balance display

### 📈 Trends
- Weekly charts: Calories, Protein, Weight, Water
- 7-day average vs goal
- Week summary stats

### 👤 Profile
- BMR + TDEE auto-calculated from your stats
- Goals: Bulk / Cut / Maintain (auto-adjusts macros)
- Custom macro goal editor
- Export your data as JSON

---

## 🍽️ Food Database

| Category | Count | Source |
|----------|-------|--------|
| Grains (Roti, Rice, Dosa, etc.) | 25 | IFCT |
| Dal / Legumes | 13 | IFCT |
| Vegetables | 20 | IFCT |
| Fruits | 15 | IFCT |
| Dairy (Amul brands etc.) | 17 | IFCT + Brand |
| Eggs & Meat / Poultry | 15 | IFCT + USDA |
| Indian Dishes | 17 | IFCT |
| Nuts & Seeds | 10 | USDA |
| Oils | 4 | USDA |
| Supplements (Whey, Creatine, etc.) | 9 | Brand |
| Beverages | 8 | IFCT + USDA |
| Snacks & Protein Bars | 8 | IFCT + Brand |
| Branded Items | 7 | Brand |
| **Total** | **168+** | Multiple |

### Adding Custom Foods
Edit `src/data/foods.js` and add entries in this format:
```javascript
{name:"Your Food Name", cal:200, p:10, c:25, f:5, fiber:2, source:"Custom", cat:"Grains", emoji:"🍽️"},
```

---

## 🎯 Goal Presets

| Goal | Calories | Protein | Carbs | Fat |
|------|----------|---------|-------|-----|
| Bulk Up 💪 | TDEE + 300 | 2.2g/kg | Remainder | 25% of cals |
| Cut Fat 🔥 | TDEE - 400 | 2.0g/kg | Remainder | 25% of cals |
| Maintain ⚖️ | TDEE | 1.8g/kg | Remainder | 25% of cals |

Macros auto-calculate from your body weight, height, age and gender.

---

## � Deployment

### GitHub
1. Create a new repository on GitHub
2. Push this code to the repository

### Vercel
1. Connect your GitHub repo to Vercel
2. Set environment variables:
   - `DJANGO_SETTINGS_MODULE`: `nutriai_dj.settings`
   - `SECRET_KEY`: Generate a new secret key
   - `DEBUG`: `False`
   - `DATABASE_URL`: Use a PostgreSQL database (Vercel doesn't support SQLite for persistent data)
3. Deploy

For production, update `ALLOWED_HOSTS` in settings.py to include your Vercel domain.

---

## 📂 Project Structure

```
nutriai/
├── manage.py
├── db.sqlite3
├── requirements.txt
├── vercel.json
├── nutriai_dj/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── tracker/
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   ├── apps.py
│   ├── tests.py
│   ├── management/
│   ├── migrations/
│   ├── static/tracker/
│   │   ├── css/styles.css
│   │   ├── js/app.js
│   │   └── js/nutrition.js
│   └── templates/tracker/index.html
└── README.md
```

---

## 📝 License

MIT License - feel free to use and modify!
│       └── nutrition.js ← BMR/TDEE/macro calculations
└── README.md
```

---

## 🛠️ Customization

### Change Water Goal
Profile → Settings → Change Goal → Water Goal field

### Custom Macros
Profile → Settings → Change Goal → Edit all macro targets

### Calorie Goal
Auto-calculates from your TDEE. Or override in Profile → Change Goal.

---

## 📞 Tech Stack

- Pure HTML/CSS/JavaScript (no framework needed)
- Groq API (meta-llama/llama-4-scout-17b-16e-instruct) for food recognition
- IFCT 2017 + USDA FoodData Central databases
- Google Fonts (Syne + DM Sans)
- localStorage for data persistence

---

*Built with ❤️ for gym lovers who care about Indian nutrition*
