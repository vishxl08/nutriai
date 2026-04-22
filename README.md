# NutriAI — Indian Nutrition Tracker 🥗💪

Your personal AI-powered nutrition and fitness tracker with full Indian food database.

---

## 🚀 Quick Start

### Option 1 — Open Directly (Simplest)
Just double-click `index.html` in your file manager or open it in Chrome/Firefox.

### Option 2 — Local Server (Recommended)
```bash
# If you have Python installed:
python -m http.server 8080
# Then open: http://localhost:8080

# Or with Node.js:
npx serve .
# Then open the URL shown
```

---

## 🤖 Setting Up AI Food Scanner

The AI food recognition requires a Groq API key.

1. Go to [https://console.groq.com/keys](https://console.groq.com/keys) and create a free account
2. Create an API key under "API Keys"
3. Open the app → Login → Profile tab → "AI Configuration"
4. Paste your API key and tap Save
5. Now the 📸 Scan button will recognize any food photo!

> **Note:** The API key is stored only in your browser's localStorage. Never share it.

---

## ✨ Features

### 🏠 Home Dashboard
- Daily calorie ring with real-time updates
- Macro bars (Protein / Carbs / Fat) vs goals
- Water intake tracker (8 cups × 375ml)
- Body weight logger with history
- Today's meal log

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

## 📱 Mobile Use

The app is fully mobile-responsive. For the best experience:
1. Open in Chrome on Android
2. Tap ⋮ → "Add to Home Screen"
3. Use it like a native app!

---

## 🔒 Privacy

- **All data is stored locally** in your browser (localStorage)
- No server, no accounts, no data sent anywhere except the Groq API for food recognition
- API key stored locally, never transmitted to any server other than Groq

---

## 📂 Project Structure

```
nutriai/
├── index.html          ← Main app (open this)
├── src/
│   ├── styles.css      ← All styles
│   ├── app.js          ← Main app logic
│   ├── data/
│   │   └── foods.js    ← Indian food database (300+ items)
│   └── utils/
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
