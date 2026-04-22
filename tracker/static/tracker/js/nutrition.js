// ===== NUTRITION UTILITIES =====

const GOALS = {
  bulk:    { cal: 2400, p: 180, c: 280, f: 80,  water: 3000 },
  cut:     { cal: 1800, p: 160, c: 160, f: 60,  water: 3500 },
  maintain:{ cal: 2100, p: 150, c: 220, f: 70,  water: 3000 },
};

// Calculate BMR (Mifflin-St Jeor)
function calcBMR(weight, height, age, gender) {
  if (gender === 'Male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

// Calculate TDEE
function calcTDEE(bmr, activityLevel = 1.55) {
  return Math.round(bmr * activityLevel);
}

// Calculate macro goals based on goal type + user stats
function calcGoalsForUser(user) {
  const base = GOALS[user.goal] || GOALS.maintain;
  if (!user.weight) return base;

  const bmr = calcBMR(user.weight, user.height || 170, user.age || 25, user.gender || 'Male');
  const tdee = calcTDEE(bmr);

  let cal;
  if (user.goal === 'bulk') cal = tdee + 300;
  else if (user.goal === 'cut') cal = tdee - 400;
  else cal = tdee;

  const p = Math.round(user.weight * 2.2); // 2.2g/kg for gym
  const f = Math.round((cal * 0.25) / 9);
  const c = Math.round((cal - p * 4 - f * 9) / 4);

  return {
    cal: Math.round(cal),
    p: Math.max(p, 120),
    c: Math.max(c, 100),
    f: Math.max(f, 40),
    water: user.goal === 'cut' ? 3500 : 3000,
    tdee,
    bmr,
  };
}

// Format calories display
function fmtCal(n) { return Math.round(n); }
function fmtMacro(n) { return Math.round(n * 10) / 10; }

// Week days short
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
