// ===== NUTRIAI APP LOGIC (DJANGO BACKEND) =====

let user = null;
let selectedGoal = 'bulk';
let aiResult = null;
let aiBaseResult = null;
let currentPortionPct = 100;
let today = {
  cals: 0, prot: 0, carbs: 0, fat: 0,
  meals: [], water: [false,false,false,false,false,false,false,false,false],
  weightLog: [], exercises: [], workoutSets: 0, workoutVol: 0, workoutCalBurn: 0,
  daily_goal: '', goal_completed: false, meals_count: 0
};
let userGoals = [];
let fitnessTodos = [];
let weekHistory = { cal: [0,0,0,0,0,0,0], prot: [0,0,0,0,0,0,0], weight: [null,null,null,null,null,null,null], water: [0,0,0,0,0,0,0] };
let goalConfig = { cal: 2400, p: 180, c: 280, f: 80, water: 3000 };

// DAYS_SHORT is provided globally via nutrition.js
let jwtAccessToken = localStorage.getItem('nutriai_access') || null;

// ---- THEME (Light default + optional Dark Mode) ----
function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  if (t === 'dark') document.body.setAttribute('data-theme', 'dark');
  else document.body.removeAttribute('data-theme');
  localStorage.setItem('nutriai_theme', t);
  const cb = document.getElementById('theme-toggle');
  if (cb) cb.checked = t === 'dark';
}

function initTheme() {
  const saved = localStorage.getItem('nutriai_theme');
  if (saved === 'light' || saved === 'dark') return applyTheme(saved);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

// If fromCheckbox=true, read checkbox state (onchange). Otherwise toggle.
function toggleTheme(fromCheckbox = false) {
  const cb = document.getElementById('theme-toggle');
  if (fromCheckbox && cb) {
    applyTheme(cb.checked ? 'dark' : 'light');
    return;
  }
  const current = (localStorage.getItem('nutriai_theme') || 'light') === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

async function apiCall(url, payload) {
  let headers = { 'Content-Type': 'application/json' };
  if(jwtAccessToken) headers['Authorization'] = 'Bearer ' + jwtAccessToken;
  
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    if(res.status === 401) {
      localStorage.removeItem('nutriai_access');
      window.location.reload();
      return {status: 'error', message: 'Unauthorized'};
    }
    const data = await res.json();
    if(!res.ok && !data.status) {
      console.error('API error:', res.status, data);
      return {status: 'error', message: 'Server error: ' + (data.detail || res.statusText)};
    }
    return data;
  } catch(e) {
    console.error('API call failed:', e);
    return {status: 'error', message: 'Network error: ' + e.message};
  }
}

function switchAuthTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
}

function selectGoal(el, goal) {
  document.querySelectorAll('.goal-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  selectedGoal = goal;
}

// ---- LIVE SYNC (no manual refresh needed) ----
let _syncTimer = null;
async function syncTodayFromServer(silent = true) {
  if (!jwtAccessToken) return;
  try {
    const res = await fetch('/api/today', { headers: { 'Authorization': 'Bearer ' + jwtAccessToken } });
    if (res.status === 401) return;
    const data = await res.json();
    if (!data || !data.user) return;
    user = data.user;
    goalConfig = data.goals;
    populateTodayFromApi(data);
    // re-render current UI
    updateGoals();
    renderMeals();
    renderWeightHistory();
    renderWorkout();
    renderDailyGoal();
    renderProfileGoals();
    renderWeekSummary();
    initWaterBoard();
    updateWaterBoard();
    if (document.getElementById('tab-trends')?.classList.contains('active')) {
      renderChart(_apexTrendType || 'cal');
    }
  } catch (e) {
    if (!silent) showToast('Sync failed. Check connection.');
  }
}

function startAutoSync() {
  if (_syncTimer) clearInterval(_syncTimer);
  _syncTimer = setInterval(() => syncTodayFromServer(true), 15000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncTodayFromServer(true);
  });
}

// Check session on load
window.onload = async () => {
    initTheme();
    try {
        let headers = {};
        if(jwtAccessToken) headers['Authorization'] = 'Bearer ' + jwtAccessToken;
        const res = await fetch('/api/today', {headers, method: 'GET'});
        if (res.ok) {
            const data = await res.json();
            if (data.user) {
                user = data.user;
                goalConfig = data.goals;
                populateTodayFromApi(data);
                enterApp(false);
                startAutoSync();
                return;
            }
        }
    } catch(e) {
        console.error('Load error:', e);
    }
    // Show auth screen if not logged in or if there's an error
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
};

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!email || !pass) return showToast('Fill all fields');
  
  showToast('Logging in...');
  try {
    const res = await apiCall('/api/login', { email, password: pass });
    console.log('Login response:', res);
    
    if(res.status === 'ok' && res.tokens && res.tokens.access) {
      localStorage.setItem('nutriai_access', res.tokens.access);
      jwtAccessToken = res.tokens.access;
      console.log('Token saved, reloading...');
      showToast('Login successful! ✓');
      setTimeout(() => window.location.reload(), 800);
    } else {
      console.error('Login failed:', res);
      showToast(res.message || 'Invalid email or password.');
    }
  } catch(e) {
    console.error('Login error:', e);
    showToast('Login error: ' + e.message);
  }
}

async function doSignup() {
  const payload = {
    name: document.getElementById('su-name').value.trim(),
    email: document.getElementById('su-email').value.trim(),
    password: document.getElementById('su-pass').value,
    goal: selectedGoal,
    age: parseInt(document.getElementById('su-age').value) || 25,
    weight: parseFloat(document.getElementById('su-weight').value) || 70,
    height: parseInt(document.getElementById('su-height').value) || 175,
    gender: document.getElementById('su-gender').value,
  };
  if (!payload.name || !payload.email || !payload.password) return showToast('Fill all fields');
  if (payload.password.length < 8) return showToast('Password must be at least 8 characters');
  
  showToast('Creating account...');
  try {
    const res = await apiCall('/api/signup', payload);
    console.log('Signup response:', res);
    
    if(res.status === 'ok' && res.tokens && res.tokens.access) {
      localStorage.setItem('nutriai_access', res.tokens.access);
      jwtAccessToken = res.tokens.access;
      console.log('Account created, logging in...');
      showToast('Account created! Welcome! ✓');
      setTimeout(() => window.location.reload(), 800);
    } else {
      console.error('Signup failed:', res);
      showToast(res.message || 'Signup failed');
    }
  } catch(e) {
    console.error('Signup error:', e);
    showToast('Signup error: ' + e.message);
  }
}

async function doLogout() {
  localStorage.removeItem('nutriai_access');
  try { await apiCall('/api/logout', {}); } catch(e){}
  window.location.reload();
}

function populateTodayFromApi(data) {
  today.meals = data.today.meals;
  today.cals = today.meals.reduce((a,b)=>a+b.cal,0);
  today.prot = today.meals.reduce((a,b)=>a+b.p,0);
  today.carbs = today.meals.reduce((a,b)=>a+b.c,0);
  today.fat = today.meals.reduce((a,b)=>a+b.f,0);
  today.meals_count = today.meals.length;

  today.exercises = data.today.exercises;
  today.workoutSets = today.exercises.reduce((a,b)=>a+b.sets,0);
  today.workoutVol = today.exercises.reduce((a,b)=>a+b.vol,0);
  today.workoutCalBurn = today.exercises.reduce((a,b)=>a+b.calBurn,0);

  today.weightLog = data.today.weight_log.reverse();
  
  // water cups scale with goal (each cup ~ 375ml)
  const cupsGoal = getWaterCupsGoal();
  today.water = [];
  for(let i=0; i<cupsGoal; i++) today.water.push(i < data.today.water_cups);

  today.daily_goal = data.today.daily_goal || '';
  today.goal_completed = data.today.goal_completed || false;

  // Load user goals from API
  userGoals = data.user_goals || [];

  // Prefer backend-provided 7-day history when available
  if (data.week) {
    if (Array.isArray(data.week.cal)) weekHistory.cal = data.week.cal;
    if (Array.isArray(data.week.prot)) weekHistory.prot = data.week.prot;
    if (Array.isArray(data.week.water_ml)) weekHistory.water = data.week.water_ml;
    if (Array.isArray(data.week.weight)) weekHistory.weight = data.week.weight;
  } else {
    weekHistory.cal[6] = today.cals;
    weekHistory.prot[6] = today.prot;
    let currentWeightStr = today.weightLog.length ? today.weightLog[today.weightLog.length-1].val : user.weight;
    weekHistory.weight[6] = currentWeightStr;
    weekHistory.water[6] = data.today.water_cups * 375;
  }
}

function getWaterCupsGoal() {
  const goalMl = Number(goalConfig.water || 3000);
  const cups = Math.round(goalMl / 375);
  return Math.min(16, Math.max(4, cups));
}

function enterApp(update=true) {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';

  // Set UI
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('p-age').textContent = user.age;
  document.getElementById('p-weight').textContent = user.weight + ' kg';
  document.getElementById('p-height').textContent = user.height + ' cm';

  const goalLabels = { bulk: 'Bulk Mode 💪', cut: 'Cut Mode 🔥', maintain: 'Maintain ⚖️' };
  document.getElementById('profile-goal-tag').textContent = goalLabels[user.goal] || 'Bulk Mode 💪';
  if(user.api_key_set) {
    document.getElementById('api-key-input').value = '••••••••••••••••';
    document.getElementById('api-status').textContent = '✓ API key saved';
    document.getElementById('api-status').style.color = 'var(--accent)';
  }

  const now = new Date();
  document.getElementById('date-badge').textContent = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  updateGoals(); renderMeals(); renderWeightHistory();
  renderProfileGoals(); renderWorkout(); renderChart('cal'); renderWeekSummary(); updateTDEE();
  renderDailyGoal(); renderUserGoals(); renderFitnessTodos(); initWaterBoard();
  document.getElementById('logged-meals-count').textContent = today.meals_count;
  searchFoods('','food-results');
  
  // Also render a few default foods to quick grid (for visual fill)
  const defaultQuick = [
    {name:"Chicken Breast (cooked, 100g)",cal:187,p:35,c:0,f:4,source:"USDA",emoji:""},
    {name:"Almonds / Badam (28g)",cal:164,p:6,c:6,f:14,source:"USDA",emoji:""},
    {name:"Paneer (100g)",cal:265,p:18,c:1.2,f:20,source:"IFCT",emoji:""},
    {name:"Roti / Chapati (wheat)",cal:120,p:3.1,c:22,f:1.5,source:"IFCT",emoji:""},
    {name:"Chicken Breast (cooked, 100g)",cal:187,p:35,c:0,f:4,source:"USDA",emoji:"🍗"},
    {name:"Almonds / Badam (28g)",cal:164,p:6,c:6,f:14,source:"USDA",emoji:"🌰"},
    {name:"Paneer (100g)",cal:265,p:18,c:1.2,f:20,source:"IFCT",emoji:"🧀"},
    {name:"Roti / Chapati (wheat)",cal:120,p:3.1,c:22,f:1.5,source:"IFCT",emoji:"🫓"}
  ];
  document.getElementById('quick-grid').innerHTML = defaultQuick.map(f => `
    <div class="food-result" onclick="addFromSearch('${encodeURIComponent(f.name)}',${f.cal},${f.p},${f.c},${f.f},'${f.emoji}','${f.source}')">
      <div><div class="food-result-name">${f.emoji} ${f.name}</div><div class="food-result-sub">${f.source}</div></div>
      <div style="text-align:right;flex-shrink:0"><div class="food-result-cal">${f.cal}</div><div style="font-size:11px;color:var(--text3)">kcal</div></div>
    </div>`).join('');
}


async function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if(!key || key === '••••••••••••••••') return;
  await apiCall('/api/update_goals', { api_key: key });
  document.getElementById('api-status').textContent = '✓ API key saved';
  document.getElementById('api-status').style.color = 'var(--accent)';
  showToast('API key saved! AI scanning enabled ✓');
}

// ---- WATER BOARD ----
function initWaterBoard() {
  const container = document.getElementById('water-glasses');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Create glasses based on goal
  const glassesGoal = getWaterCupsGoal();
  
  for (let i = 0; i < glassesGoal; i++) {
    const glass = createWaterGlass(i);
    container.appendChild(glass);
  }
  
  updateWaterBoardDisplay();
}

function createWaterGlass(index) {
  const glass = document.createElement('div');
  glass.className = 'water-glass';
  glass.setAttribute('data-index', index);
  
  glass.innerHTML = `
    <div class="glass-container">
      <div class="glass-water ${today.water[index] ? 'filled' : ''}"></div>
    </div>
    <div class="glass-label">Glass ${index + 1}</div>
  `;
  
  glass.onclick = function() {
    toggleWaterGlass(parseInt(this.getAttribute('data-index')));
  };
  
  return glass;
}

function toggleWaterGlass(index) {
  // Toggle the water state
  today.water[index] = !today.water[index];
  
  // Add click animation
  const glass = document.querySelector(`[data-index="${index}"]`);
  if (glass) {
    glass.classList.add('clicked');
    setTimeout(() => glass.classList.remove('clicked'), 600);
    
    // Update water fill animation
    const waterElement = glass.querySelector('.glass-water');
    if (today.water[index]) {
      waterElement.classList.add('filled');
    } else {
      waterElement.classList.remove('filled');
    }
  }
  
  // Update display
  updateWaterBoardDisplay();
  
  // Save to backend (fire and forget)
  const filled = today.water.filter(Boolean).length;
  apiCall('/api/log_water', { cups: filled });
  
  // Update water history for today
  const ml = filled * 375;
  weekHistory.water[6] = ml;
  
  showToast(today.water[index] ? '+375ml water logged! Stay hydrated! ' : 'Water glass removed');
  
  // Check if goal is reached
  if (filled >= getWaterCupsGoal()) {
    setTimeout(() => showToast('Daily water goal reached! Great job! '), 1000);
  }
}

function updateWaterBoardDisplay() {
  const filled = today.water.filter(Boolean).length;
  const ml = filled * 375;
  const liters = (ml / 1000).toFixed(1);
  const goalLiters = ((goalConfig.water || 3000) / 1000).toFixed(1);
  const percentage = Math.min(100, Math.round((ml / (goalConfig.water || 3000)) * 100));
  
  // Update water amount display
  const amountElement = document.getElementById('water-amount');
  if (amountElement) {
    amountElement.textContent = liters;
  }
  
  // Update percentage display
  const percentageElement = document.getElementById('water-percentage');
  if (percentageElement) {
    percentageElement.textContent = percentage + '%';
  }
  
  // Update goal display
  const goalDisplay = document.getElementById('water-goal-display');
  if (goalDisplay) {
    goalDisplay.textContent = `(${goalLiters}L goal)`;
  }
  
  // Update progress bar with animation
  const progressFill = document.getElementById('water-progress-fill');
  if (progressFill) {
    setTimeout(() => {
      progressFill.style.width = percentage + '%';
    }, 100);
  }
  
  // Update streak bar goals hit calculation
  updateGoalsHit();
}

function updateGoalsHit() {
  const waterGoal = goalConfig.water || 3000;
  const currentWater = today.water.filter(Boolean).length * 375;
  const waterGoalHit = currentWater >= waterGoal * 0.85;
  
  // Update goals hit display (this integrates with existing goals system)
  const goalsHitElement = document.getElementById('goals-hit');
  if (goalsHitElement) {
    const currentText = goalsHitElement.textContent;
    const currentHits = parseInt(currentText.split('/')[0]) || 0;
    
    // Count nutrition goals hit
    let nutritionHits = 0;
    if (today.cals >= goalConfig.cal * 0.85 && today.cals <= goalConfig.cal * 1.15) nutritionHits++;
    if (today.prot >= goalConfig.p * 0.85) nutritionHits++;
    
    const totalHits = nutritionHits + (waterGoalHit ? 1 : 0);
    goalsHitElement.textContent = totalHits + '/3';
  }
}

// ---- MACROS ----
function updateGoals() {
  const g = goalConfig;
  document.getElementById('cal-goal').textContent = g.cal;
  document.getElementById('prot-goal-lbl').textContent = g.p + 'g';
  document.getElementById('carb-goal-lbl').textContent = g.c + 'g';
  document.getElementById('fat-goal-lbl').textContent = g.f + 'g';

  // Update nutrition goals summary
  const caloriesProgress = document.getElementById('calories-progress');
  const proteinProgress = document.getElementById('protein-progress');
  
  if (caloriesProgress) caloriesProgress.textContent = `${Math.round(today.cals)}/${g.cal} kcal`;
  if (proteinProgress) proteinProgress.textContent = `${Math.round(today.prot)}/${g.p}g`;
  document.getElementById('total-cals').textContent = fmtCal(today.cals);
  document.getElementById('prot-cur').textContent = fmtCal(today.prot);
  document.getElementById('carb-cur').textContent = fmtCal(today.carbs);
  document.getElementById('fat-cur').textContent = fmtCal(today.fat);

  const calPct = Math.min(100, (today.cals / g.cal) * 100);
  document.getElementById('cal-ring').style.strokeDashoffset = 314 - (314 * (calPct / 100));
  document.getElementById('prot-bar').style.width = Math.min(100, (today.prot / g.p) * 100) + '%';
  document.getElementById('carb-bar').style.width = Math.min(100, (today.carbs / g.c) * 100) + '%';
  document.getElementById('fat-bar').style.width = Math.min(100, (today.fat / g.f) * 100) + '%';

  let hit = 0;
  if (today.cals >= g.cal * 0.85 && today.cals <= g.cal * 1.15) hit++;
  if (today.prot >= g.p * 0.85) hit++;
  document.getElementById('goals-hit').textContent = hit + '/2';
  updateTDEE();
}

function updateTDEE() {
  if (!user) return;
  const tdee = goalConfig.tdee || calcTDEE(calcBMR(user.weight || 70, user.height || 175, user.age || 25, user.gender || 'Male'));
  const remaining = tdee - today.cals + today.workoutCalBurn;
  document.getElementById('tdee-val').textContent = tdee;
  document.getElementById('balance-val').textContent = (remaining >= 0 ? '+' : '') + Math.round(remaining);
}

// ---- MEALS ----
async function addMealToLog(name, cal, p, c, f, emoji, source) {
  await apiCall('/api/add_meal', { name, cal, p, c, f, emoji, source });
  // local optimistic update
  const m = {name, cal:Math.round(cal), p:Math.round(p), c:Math.round(c), f:Math.round(f), emoji:emoji||'🍽️', source:source||'Manual', time:new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })};
  today.meals.unshift(m); today.cals += m.cal; today.prot += m.p; today.carbs += m.c; today.fat += m.f;
  today.meals_count = today.meals.length;
  document.getElementById('logged-meals-count').textContent = today.meals_count;
  updateGoals(); renderMeals();
  syncTodayFromServer(true);
  showToast(name + ' added! ✓');
}

function renderMeals() {
  const list = document.getElementById('meals-list');
  if (!today.meals.length) { list.innerHTML = '<div class="empty-state">📷 No meals logged yet.</div>'; return; }
  list.innerHTML = today.meals.map((m, i) => `
    <div class="meal-item" style="animation-delay:${i*0.05}s">
      <div class="meal-thumb">${m.emoji}</div>
      <div class="meal-info"><div class="meal-name">${m.name}</div><div class="meal-macros">P: ${m.p}g · C: ${m.c}g · F: ${m.f}g</div><div class="meal-time">${m.time}</div></div>
      <div style="text-align:right;flex-shrink:0"><div class="meal-cal">${m.cal}</div><div style="font-size:11px;color:var(--text3)">kcal</div><div style="font-size:10px;color:var(--text3);margin-top:2px">${m.source}</div></div>
    </div>`).join('');
}

// ---- WEIGHT & GYM ----
async function logWeight() {
  const val = parseFloat(document.getElementById('new-weight').value);
  if(!val) return;
  await apiCall('/api/log_weight', { weight: val });
  today.weightLog.unshift({val: val, date: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })});
  user.weight = val;
  document.getElementById('cur-weight').textContent = val;
  document.getElementById('p-weight').textContent = val + ' kg';
  document.getElementById('new-weight').value = '';
  renderWeightHistory();
  syncTodayFromServer(true);
  showToast('Weight logged: ' + val + ' kg ✓');
}

function renderWeightHistory() {
  const el = document.getElementById('weight-history');
  el.innerHTML = today.weightLog.slice(0,5).map(w => `<div class="weight-history-item"><span>${w.val} kg</span><span style="color:var(--text3)">${w.date}</span></div>`).join('');
  if(today.weightLog.length) document.getElementById('cur-weight').textContent = today.weightLog[0].val;
}

const GYM_EXERCISES = {
  "Chest + Triceps": [
    "Barbell Bench Press (Flat)", "Barbell Bench Press (Incline)", "Barbell Bench Press (Decline)",
    "Dumbbell Bench Press (Flat)", "Dumbbell Bench Press (Incline)", 
    "Chest Flyes (Dumbbell)", "Cable Crossover", "Pec Deck Machine", "Push-ups",
    "Triceps Pushdown (Cable)", "Overhead Triceps Extension", "Skullcrushers", "Close-Grip Bench Press", "Triceps Dips", "Triceps Kickbacks"
  ],
  "Back + Biceps": [
    "Deadlift", "Pull-ups", "Chin-ups", "Lat Pulldown (Wide Grip)", "Lat Pulldown (Close Grip)",
    "Barbell Row", "Dumbbell Row (Single Arm)", "Seated Cable Row", "T-Bar Row", "Face Pulls", "Back Extensions",
    "Barbell Bicep Curl", "Dumbbell Bicep Curl", "Hammer Curls", "Preacher Curls", "Concentration Curls", "Cable Curls"
  ],
  "Legs": [
    "Barbell Squat (High Bar)", "Barbell Squat (Low Bar)", "Front Squat", "Goblet Squat",
    "Leg Press", "Lunges (Dumbbell)", "Bulgarian Split Squats", "Hack Squat",
    "Romanian Deadlift (RDL)", "Leg Extension Machine", "Lying Leg Curls", "Seated Leg Curls",
    "Standing Calf Raises", "Seated Calf Raises", "Hip Thrusts"
  ],
  "Shoulders": [
    "Overhead Press (Barbell)", "Seated Dumbbell Press", "Arnold Press",
    "Lateral Raises (Dumbbell)", "Lateral Raises (Cable)",
    "Front Raises", "Reverse Pec Deck (Rear Delts)", "Upright Rows", "Shrugs (Dumbbell/Barbell)"
  ],
  "Core": [
    "Crunches", "Sit-ups", "Plank", "Russian Twists", "Leg Raises (Hanging)",
    "Leg Raises (Lying)", "Ab Wheel Rollout", "Cable Woodchoppers", "Bicycle Crunches"
  ],
  "Full Body / Cardio": [
    "Running (Treadmill)", "Cycling", "Rowing Machine", "Jump Rope", "Burpees", "Kettlebell Swings", "Stairmaster"
  ]
};

function populateExercises() {
    const split = document.getElementById('ex-split').value;
    const nameSelect = document.getElementById('ex-name');
    nameSelect.innerHTML = '<option value="">-- Select Exercise --</option>';
    if (split && GYM_EXERCISES[split]) {
        nameSelect.disabled = false;
        GYM_EXERCISES[split].forEach(ex => {
            nameSelect.innerHTML += `<option value="${ex}">${ex}</option>`;
        });
    } else {
        nameSelect.disabled = true;
    }
}

async function logExercise() {
  const name = document.getElementById('ex-name').value.trim();
  const weight = parseFloat(document.getElementById('ex-weight').value) || 0;
  const sets = parseInt(document.getElementById('ex-sets').value) || 1;
  const repsStr = document.getElementById('ex-reps').value.trim() || '10';
  if(!name) return showToast('Enter exercise name');
  const repsArr = repsStr.split(',').map(r => parseInt(r.trim()) || 0);
  const totalReps = repsArr.reduce((a,b)=>a+b,0);
  const vol = weight * totalReps;
  const calBurn = Math.round(vol * 0.05 + sets * 3);
  await apiCall('/api/add_exercise', {name, weight, sets, reps:repsStr, vol, calBurn});
  today.exercises.unshift({name, weight, sets, reps:repsStr, vol, calBurn});
  today.workoutSets += sets; today.workoutVol += vol; today.workoutCalBurn += calBurn;
  renderWorkout(); showToast(name + ' logged! Vol: ' + vol + 'kg');
  syncTodayFromServer(true);
}

function renderWorkout() {
  document.getElementById('w-sets').textContent = today.workoutSets;
  document.getElementById('w-vol').textContent = today.workoutVol;
  document.getElementById('w-cal-burn').textContent = today.workoutCalBurn;
  if(today.exercises.length) {
      document.getElementById('workout-name').textContent = today.exercises[0].name + ' & more';
      document.getElementById('workout-badge').style.display = 'block';
  }
  const list = document.getElementById('exercise-list');
  if(!today.exercises.length) { list.innerHTML = '<div class="empty-state">🏋️ No exercises yet today.</div>'; return; }
  list.innerHTML = today.exercises.map(e => `
    <div class="meal-item"><div class="meal-thumb" style="font-size:22px">🏋️</div><div class="meal-info"><div class="meal-name">${e.name}</div><div class="meal-macros">${e.sets} sets · ${e.weight}kg · ${e.reps} reps</div></div><div style="text-align:right;flex-shrink:0"><div class="meal-cal" style="font-size:15px">${e.vol}kg</div><div style="font-size:11px;color:var(--text3)">volume</div></div></div>
  `).join('');
  updateTDEE();
}

function renderDailyGoal() {
  const goalEl = document.getElementById('daily-goal-text');
  const checkbox = document.getElementById('goal-completed');
  if (goalEl) goalEl.textContent = today.daily_goal || 'Set your goal for today!';
  if (checkbox) checkbox.checked = today.goal_completed;
}

async function setDailyGoal() {
  const goal = document.getElementById('goal-input').value.trim();
  const completed = document.getElementById('goal-completed').checked;
  await apiCall('/api/set_daily_goal', { goal, completed });
  today.daily_goal = goal;
  today.goal_completed = completed;
  renderDailyGoal();
  syncTodayFromServer(true);
  showToast('Goal updated! ✓');
}

function renderUserGoals() {
  const el = document.getElementById('user-goals-list');
  if (!el) return;
  
  if (!userGoals || userGoals.length === 0) {
    el.innerHTML = '<div class="empty-state">🎯 No goals set yet. Add one!</div>';
    return;
  }
  
  el.innerHTML = userGoals.map((g, i) => `
    <div class="goal-item" style="animation-delay:${i*0.05}s">
      <div class="goal-info">
        <div class="goal-title">${g.title}</div>
        <div class="goal-meta">${g.type} ${g.target ? '• ' + g.target : ''}</div>
        ${g.description ? `<div class="goal-desc">${g.description}</div>` : ''}
      </div>
      <div class="goal-actions">
        <input type="checkbox" ${g.completed ? 'checked' : ''} onchange="toggleGoal(${g.id}, this.checked)">
        <button onclick="deleteGoal(${g.id})" style="color:#FF6B6B;border:none;background:none;cursor:pointer;font-size:16px">✕</button>
      </div>
    </div>
  `).join('');
}

async function toggleGoal(id, completed) {
  await apiCall('/api/update_goal', { id, completed });
  syncTodayFromServer(true);
  showToast(completed ? 'Goal completed! 🎉' : 'Goal reopened');
}

async function deleteGoal(id) {
  if (!confirm('Delete this goal?')) return;
  await apiCall('/api/delete_goal', { id });
  userGoals = userGoals.filter(g => g.id !== id);
  renderUserGoals();
  showToast('Goal deleted');
}

async function createNewGoal() {
  const title = document.getElementById('new-goal-title')?.value.trim();
  const target = document.getElementById('new-goal-target')?.value.trim();
  const type = document.getElementById('new-goal-type')?.value || 'daily';
  const description = document.getElementById('new-goal-description')?.value.trim() || '';
  
  if (!title) return showToast('Goal title required');
  
  const res = await apiCall('/api/create_goal', { title, target, type, description });
  if (res.status === 'ok') {
    userGoals.unshift(res.goal);
    document.getElementById('new-goal-title').value = '';
    document.getElementById('new-goal-target').value = '';
    document.getElementById('new-goal-description').value = '';
    renderUserGoals();
    syncTodayFromServer(true);
    showToast('Goal created! ✓');
  }
}

// ---- FITNESS TODO LIST ----
function addFitnessTodo() {
  const input = document.getElementById('fitness-todo-input');
  const task = input.value.trim();
  
  if (!task) return showToast('Please enter a fitness task');
  
  const todo = {
    id: Date.now(),
    text: task,
    completed: false,
    createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  };
  
  fitnessTodos.unshift(todo);
  input.value = '';
  renderFitnessTodos();
  showToast('Fitness task added! 🏋️‍♀️');
}

function toggleFitnessTodo(id) {
  const todo = fitnessTodos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    renderFitnessTodos();
    if (todo.completed) {
      showToast('Task completed! 🎉');
    }
  }
}

function deleteFitnessTodo(id) {
  fitnessTodos = fitnessTodos.filter(t => t.id !== id);
  renderFitnessTodos();
  showToast('Task deleted');
}

function renderFitnessTodos() {
  const el = document.getElementById('fitness-todos-list');
  if (!el) return;
  
  if (!fitnessTodos || fitnessTodos.length === 0) {
    el.innerHTML = '<div class="empty-state">🏋️‍♀️ No fitness tasks yet. Add one!</div>';
    return;
  }
  
  el.innerHTML = fitnessTodos.map((todo, i) => `
    <div class="goal-item" style="animation-delay:${i*0.05}s">
      <div class="goal-info">
        <div class="goal-title" style="${todo.completed ? 'text-decoration:line-through;color:var(--text3)' : ''}">${todo.text}</div>
        <div class="goal-meta">Added at ${todo.createdAt}</div>
      </div>
      <div class="goal-actions">
        <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleFitnessTodo(${todo.id})">
        <button onclick="deleteFitnessTodo(${todo.id})" style="color:#FF6B6B;border:none;background:none;cursor:pointer;font-size:16px">✕</button>
      </div>
    </div>
  `).join('');
}

// ---- SEARCH & ADD ----
async function searchFoods(q, targetId) {
  const res = document.getElementById(targetId);
  let headers = {};
  if(jwtAccessToken) headers['Authorization'] = 'Bearer ' + jwtAccessToken;

  if(!q || q.length < 2) { 
    const defaults = [
      {name:"Chicken Breast (100g)",cal:187,p:35,c:0,f:4,source:"USDA",emoji:"🍗"},
      {name:"Almonds / Badam (28g)",cal:164,p:6,c:6,f:14,source:"USDA",emoji:"🌰"},
      {name:"Paneer (100g)",cal:265,p:18,c:1.2,f:20,source:"IFCT",emoji:"🧀"},
      {name:"Roti / Chapati (wheat)",cal:120,p:3.1,c:22,f:1.5,source:"IFCT",emoji:"🫓"}
    ];
    res.innerHTML = defaults.map(f => `
      <div class="food-result" onclick="addFromSearch('${encodeURIComponent(f.name)}',${f.cal},${f.p},${f.c},${f.f},'${f.emoji}','${f.source}')">
        <div><div class="food-result-name">${f.emoji} ${f.name}</div><div class="food-result-sub">P:${f.p}g · C:${f.c}g · F:${f.f}g · ${f.source}</div></div>
        <div style="text-align:right;flex-shrink:0"><div class="food-result-cal">${f.cal}</div><div style="font-size:11px;color:var(--text3)">kcal/100g</div></div>
      </div>`).join('');
    return; 
  }
  
  const response = await fetch('/api/search_food?q=' + encodeURIComponent(q), {headers});
  const data = await response.json();
  
  if(!data.results || !data.results.length) return res.innerHTML = `<div style="color:var(--text3);font-size:13px;padding:12px 0">No results.</div>`;
  res.innerHTML = data.results.map(f => `
    <div class="food-result" onclick="addFromSearch('${encodeURIComponent(f.name)}',${f.cal},${f.p},${f.c},${f.f},'${f.emoji}','${f.source}')">
      <div><div class="food-result-name">${f.emoji} ${f.name}</div><div class="food-result-sub">P:${f.p}g · C:${f.c}g · F:${f.f}g · ${f.source}</div></div>
      <div style="text-align:right;flex-shrink:0"><div class="food-result-cal">${f.cal}</div><div style="font-size:11px;color:var(--text3)">kcal/100g</div></div>
    </div>`).join('');
}

function addFromSearch(enName, cal, p, c, f, emoji, source) {
  addMealToLog(decodeURIComponent(enName), cal, p, c, f, emoji, source);
  closeScanModal(); switchTab('home');
}

// ---- SCAN ----
function openScanModal() {
  document.getElementById('scan-modal').classList.add('open');
  document.getElementById('ai-result').style.display = 'none';
  document.getElementById('thinking').style.display = 'none';
  document.getElementById('img-preview').style.display = 'none';
  document.getElementById('upload-zone').style.display = 'block';
}
function closeScanModal() { document.getElementById('scan-modal').classList.remove('open'); }

// Enhanced mobile camera and gallery handlers
async function openCamera() {
  try {
    // Check if camera is available
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    
    // Create video element for camera preview
    const video = document.createElement('video');
    video.srcObject = stream;
    video.style.width = '100%';
    video.style.height = 'auto';
    video.style.borderRadius = '14px';
    video.autoplay = true;
    
    // Replace upload zone with camera preview
    const uploadZone = document.getElementById('upload-zone');
    uploadZone.style.display = 'none';
    
    // Add camera controls
    const cameraControls = document.createElement('div');
    cameraControls.style.cssText = 'text-align:center;margin-top:10px';
    cameraControls.innerHTML = `
      <button class="btn-primary" style="margin-bottom:10px" onclick="capturePhoto()">Capture Photo</button>
      <button class="btn-secondary" onclick="closeCamera()">Cancel</button>
    `;
    
    // Insert video and controls
    uploadZone.parentNode.insertBefore(video, uploadZone.nextSibling);
    uploadZone.parentNode.insertBefore(cameraControls, video.nextSibling);
    
    // Store stream reference for cleanup
    window.currentCameraStream = stream;
    
  } catch (error) {
    console.error('Camera access error:', error);
    showToast('Camera access denied. Using gallery instead.');
    // Fallback to gallery
    document.getElementById('img-upload').click();
  }
}

function capturePhoto() {
  const video = document.querySelector('video');
  if (!video) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  // Convert to blob and handle as file
  canvas.toBlob((blob) => {
    const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    // Create synthetic event
    const event = {
      target: {
        files: dataTransfer.files
      }
    };
    
    closeCamera();
    handleImageUpload(event);
  }, 'image/jpeg');
}

function closeCamera() {
  // Stop camera stream
  if (window.currentCameraStream) {
    window.currentCameraStream.getTracks().forEach(track => track.stop());
    window.currentCameraStream = null;
  }
  
  // Remove video and controls
  const video = document.querySelector('video');
  const controls = video?.nextElementSibling;
  if (video) video.remove();
  if (controls && controls.tagName === 'DIV') controls.remove();
  
  // Show upload zone again
  document.getElementById('upload-zone').style.display = 'block';
}

async function handleImageUpload(evt) {
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async(e) => {
    document.getElementById('img-preview').src = e.target.result;
    document.getElementById('img-preview').style.display = 'block';
    document.getElementById('thinking').style.display = 'block';
    document.getElementById('upload-zone').style.display = 'none';
    const base64 = e.target.result.split(',')[1];
    
    try {
      const data = await apiCall('/api/analyze_food', { image: base64, media_type: file.type || 'image/jpeg' });
      if(data.status === 'error') throw new Error(data.message);
      aiBaseResult = {...data.result}; aiResult = {...data.result};
      showAiResult(data.result);
    } catch(err) {
      document.getElementById('thinking').style.display = 'none';
      document.getElementById('upload-zone').style.display = 'block';
      const msg = (err && err.message) ? String(err.message) : 'Unknown error';
      // Friendly guidance for missing/invalid API key
      if (msg.toLowerCase().includes('api key')) {
        showToast('AI Scan needs your Groq API key. Set it in Profile → AI Configuration.');
        closeScanModal();
        switchTab('profile');
        setTimeout(() => {
          const el = document.getElementById('api-key-input');
          if (el) { el.focus(); el.scrollIntoView({behavior:'smooth', block:'center'}); }
        }, 250);
      } else {
        showToast('AI scan failed: ' + msg);
      }
    }
  };
  reader.readAsDataURL(file);
}

function showAiResult(r) {
  document.getElementById('thinking').style.display = 'none';
  document.getElementById('ai-result').style.display = 'block';
  document.getElementById('ai-name').textContent = r.name;
  document.getElementById('ai-portion').textContent = r.portion;
  document.getElementById('ai-cal').textContent = Math.round(r.calories);
  document.getElementById('ai-prot').textContent = Math.round(r.protein_g) + 'g';
  document.getElementById('ai-carb').textContent = Math.round(r.carbs_g) + 'g';
  document.getElementById('ai-fat').textContent = Math.round(r.fat_g) + 'g';
}

function adjustPortion(pct) {
  if(!aiBaseResult) return;
  const mult = pct / 100;
  aiResult = { ...aiBaseResult, calories: aiBaseResult.calories*mult, protein_g: aiBaseResult.protein_g*mult, carbs_g: aiBaseResult.carbs_g*mult, fat_g: aiBaseResult.fat_g*mult };
  document.getElementById('portion-pct-lbl').textContent = pct + '%';
  document.getElementById('ai-cal').textContent = Math.round(aiResult.calories);
  document.getElementById('ai-prot').textContent = Math.round(aiResult.protein_g) + 'g';
  document.getElementById('ai-carb').textContent = Math.round(aiResult.carbs_g) + 'g';
  document.getElementById('ai-fat').textContent = Math.round(aiResult.fat_g) + 'g';
}

function addAiMeal() {
  addMealToLog(aiResult.name, aiResult.calories, aiResult.protein_g, aiResult.carbs_g, aiResult.fat_g, '📷', 'AI');
  closeScanModal(); switchTab('home');
}

// ==== UI UTILS & MISC ====
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  const navMap = { home: 'nav-home', log: 'nav-log', workout: 'nav-workout', trends: 'nav-trends', profile: 'nav-profile' };
  if (navMap[tab]) document.getElementById(navMap[tab]).classList.add('active');
  if (tab === 'trends') { renderChart('cal'); renderWeekSummary(); }
}
function clearToday() { showToast("Can't clear from backend in this demo"); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}
let reminderInterval = null;
function toggleWaterReminder() {
    if(reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
        document.getElementById('water-reminder-txt').textContent = "Enable Water Reminders";
        showToast("Water reminders disabled.");
    } else {
        if (Notification.permission !== "granted") Notification.requestPermission();
        
        // Reminder every 60 minutes
        reminderInterval = setInterval(() => {
            showToast("Time to drink a glass of water! 🥛");
            if (Notification.permission === "granted") {
                new Notification("NutriAI Hydration Reminder", {
                    body: "It's time to drink your next glass of water! 🥛",
                    icon: "https://cdn-icons-png.flaticon.com/512/3063/3063990.png"
                });
            }
        }, 1000 * 60 * 60);
        
        document.getElementById('water-reminder-txt').textContent = "Disable Water Reminders";
        showToast("Water reminders enabled! Will notify every hour.");
    }
}

let isGoalManual = false;
function manualOverrideCheck() {
    isGoalManual = true;
}

function autoFillGoals() {
  if (typeof calcGoalsForUser !== 'function') return;
  const selectedMode = document.getElementById('g-mode-input').value;
  const tempUser = {...user, goal: selectedMode};
  const newGoals = calcGoalsForUser(tempUser);
  
  if(!isGoalManual) {
    document.getElementById('g-cal-input').value = newGoals.cal;
    document.getElementById('g-prot-input').value = newGoals.p;
    document.getElementById('g-carb-input').value = newGoals.c;
    document.getElementById('g-fat-input').value = newGoals.f;
    document.getElementById('g-water-input').value = newGoals.water || 3000;
  }
}

function showGoalEditor() { 
  isGoalManual = false;
  document.getElementById('g-mode-input').value = user.goal || 'bulk';
  document.getElementById('g-cal-input').value = goalConfig.cal;
  document.getElementById('g-prot-input').value = goalConfig.p;
  document.getElementById('g-carb-input').value = goalConfig.c;
  document.getElementById('g-fat-input').value = goalConfig.f;
  document.getElementById('g-water-input').value = goalConfig.water || 3000;
  document.getElementById('goal-modal').style.display = 'flex'; 
}
async function saveGoals() {
  goalConfig.cal = parseInt(document.getElementById('g-cal-input').value) || goalConfig.cal;
  goalConfig.p = parseInt(document.getElementById('g-prot-input').value) || goalConfig.p;
  goalConfig.c = parseInt(document.getElementById('g-carb-input').value) || goalConfig.c;
  goalConfig.f = parseInt(document.getElementById('g-fat-input').value) || goalConfig.f;
  goalConfig.water = parseInt(document.getElementById('g-water-input').value) || goalConfig.water;
  const goalMode = document.getElementById('g-mode-input').value;
  await apiCall('/api/update_goals', {...goalConfig, goal: goalMode});
  user.goal = goalMode;
  document.getElementById('goal-modal').style.display = 'none';
  updateGoals(); 
  initWater();
  
  if(document.getElementById('profile-goal-tag')) {
      const goalLabels = { bulk: 'Bulk Mode 💪', cut: 'Cut Mode 🔥', maintain: 'Maintain ⚖️' };
      document.getElementById('profile-goal-tag').textContent = goalLabels[user.goal] || 'Bulk Mode 💪';
  }
  renderProfileGoals();
  showToast('Goals updated! ✓');
}



function renderProfileGoals() {
  const g = goalConfig;
  const cal = g.cal || 2000;
  const p = g.p || 150;
  const c = g.c || 200;
  const water = g.water ? (g.water/1000).toFixed(1) + ' L' : '3.0 L';

  document.getElementById('macro-goals-card').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; width: 75%;">
        <div>
          <div style="font-size:11px; color:var(--text3); margin-bottom:2px">CALORIES</div>
          <div style="font-size:18px; font-weight:700; color:var(--accent)">${cal} <span style="font-size:12px; font-weight:400; color:var(--text2)">kcal</span></div>
        </div>
        <div>
          <div style="font-size:11px; color:var(--text3); margin-bottom:2px">PROTEIN</div>
          <div style="font-size:18px; font-weight:700; color:var(--text)">${p} <span style="font-size:12px; font-weight:400; color:var(--text2)">g</span></div>
        </div>
        <div>
          <div style="font-size:11px; color:var(--text3); margin-bottom:2px">CARBS</div>
          <div style="font-size:18px; font-weight:700; color:var(--text)">${c} <span style="font-size:12px; font-weight:400; color:var(--text2)">g</span></div>
        </div>
        <div>
          <div style="font-size:11px; color:var(--text3); margin-bottom:2px">WATER</div>
          <div style="font-size:18px; font-weight:700; color:var(--text)">${water}</div>
        </div>
      </div>
      <div>
        <button onclick="showGoalEditor()" style="background:rgba(8,235,166,0.1); border:1px solid var(--accent); color:var(--accent); border-radius:12px; padding:8px 12px; font-size:12px; font-weight:600; cursor:pointer; transition:0.2s;">
          Edit Goals ✏️
        </button>
      </div>
    </div>
  `;
}

function exportData() { 
  const el = document.getElementById('tab-trends');
  const oldDisplay = el.style.display;
  
  renderChart('cal'); 
  renderWeekSummary();
  
  el.style.display = 'block';
  el.style.position = 'absolute';
  el.style.top = '0';
  el.style.left = '0';
  el.style.zIndex = '-9999';
  el.style.width = '800px'; 
  el.style.background = '#0B0E14'; 
  
  const opt = {
    margin:       10,
    filename:     'nutriai_weekly_trends.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(el).save().then(() => {
    el.style.display = oldDisplay;
    el.style.position = '';
    el.style.top = '';
    el.style.left = '';
    el.style.zIndex = '';
    el.style.width = '';
    el.style.background = '';
    showToast('Weekly Trends Exported! 📊');
  });
}

let isReminderOn = false;
let waterTimer = null;
function toggleWaterReminder() {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(p => toggleWaterReminder());
    return;
  }
  if (Notification.permission === 'granted') {
    isReminderOn = !isReminderOn;
    document.getElementById('water-reminder-txt').textContent = isReminderOn ? 'Disable Water Reminders' : 'Enable Water Reminders';
    if(isReminderOn) {
      waterTimer = setInterval(() => {
        new Notification("NutriAI Hydration Reminder", {
          body: "It's time to drink your next glass of water! 🥛",
        });
      }, 3600000);
      showToast('Hourly reminders turned ON');
    } else {
      clearInterval(waterTimer);
      showToast('Reminders OFF');
    }
  } else {
    showToast('Notifications blocked by browser!');
  }
}



let _apexTrendChart = null;
let _apexTrendType = null;

function getCssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function fmtKpi(value, unit) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (unit === 'kcal') return Math.round(Number(value)).toString();
  if (unit === 'g') return Math.round(Number(value)).toString();
  if (unit === 'kg') return (Math.round(Number(value) * 10) / 10).toFixed(1);
  if (unit === 'L') return (Math.round(Number(value) * 10) / 10).toFixed(1);
  return String(value);
}

function safeAvg(arr) {
  const v = arr.filter(x => x !== null && x !== undefined && x !== '' && !Number.isNaN(Number(x)));
  if (!v.length) return null;
  const nums = v.map(Number);
  return nums.reduce((a,b)=>a+b,0) / nums.length;
}

function renderChart(type) {
  _apexTrendType = type;
  const colors = {
    accent: getCssVar('--accent', '#6F3CFF'),
    blue: getCssVar('--blue', '#3D8BFF'),
    accent2: getCssVar('--accent2', '#FF6B6B'),
    accent3: getCssVar('--accent3', '#7B61FF'),
    text: getCssVar('--text', '#111225'),
    text2: getCssVar('--text2', '#4E5066'),
    text3: getCssVar('--text3', '#8A8CA3'),
    border: getCssVar('--border', 'rgba(17,18,37,0.08)'),
    card: getCssVar('--card', '#fff'),
    bg3: getCssVar('--bg3', '#F0F1F7'),
  };

  const cfg = {
    cal: {
      title: 'Calories',
      unit: 'kcal',
      color: colors.accent,
      goal: goalConfig.cal,
      data: weekHistory.cal.map(v => (v === null ? null : Number(v))),
      kpi: () => weekHistory.cal[6] || 0,
      badge: () => `Goal ${goalConfig.cal} kcal`,
    },
    protein: {
      title: 'Protein',
      unit: 'g',
      color: colors.blue,
      goal: goalConfig.p,
      data: weekHistory.prot.map(v => (v === null ? null : Number(v))),
      kpi: () => weekHistory.prot[6] || 0,
      badge: () => `Goal ${goalConfig.p} g`,
    },
    weight: {
      title: 'Weight',
      unit: 'kg',
      color: colors.accent3,
      goal: null,
      data: weekHistory.weight.map(v => (v === null ? null : Number(v))),
      kpi: () => (weekHistory.weight[6] ?? null),
      badge: () => 'Last 7 days',
    },
    water: {
      title: 'Water',
      unit: 'L',
      color: colors.blue,
      goal: (goalConfig.water || 3000) / 1000,
      data: weekHistory.water.map(v => (v === null ? null : Number(v) / 1000)),
      kpi: () => ((weekHistory.water[6] || 0) / 1000),
      badge: () => `Goal ${((goalConfig.water || 3000) / 1000).toFixed(1)} L`,
    },
  };

  const d = cfg[type] || cfg.cal;
  const el = document.getElementById('chart-area');
  if (!el) return;

  const kpiVal = d.kpi();
  const avg = safeAvg(d.data);

  el.innerHTML = `
    <div class="chart-head">
      <div class="chart-kpi">
        <div class="label">${d.title}</div>
        <div class="value" style="color:${d.color}">
          ${fmtKpi(kpiVal, d.unit)}<span style="font-size:12px;font-weight:700;color:var(--text2);margin-left:6px">${d.unit}</span>
        </div>
        <div class="sub">7-day avg: <b style="color:var(--text)">${avg === null ? '—' : fmtKpi(avg, d.unit)}${avg === null ? '' : ' ' + d.unit}</b></div>
      </div>
      <div class="chart-badge">${d.badge()}</div>
    </div>
    <div class="apex-wrap" id="apex-trend"></div>
  `;

  const target = document.querySelector('#apex-trend');
  if (!target) return;

  // Destroy previous chart instance
  if (_apexTrendChart) {
    try { _apexTrendChart.destroy(); } catch(e) {}
    _apexTrendChart = null;
  }

  const series = [{
    name: d.title,
    data: d.data.map(v => (v === null || v === undefined || Number.isNaN(v) ? null : Number(v))),
  }];

  const opts = {
    chart: {
      type: 'area',
      height: 240,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: 'easeinout', speed: 650 },
      fontFamily: 'DM Sans, system-ui, -apple-system, Segoe UI, Roboto, Arial',
      foreColor: colors.text2,
    },
    grid: {
      borderColor: colors.border,
      strokeDashArray: 4,
      padding: { left: 10, right: 12, top: 6, bottom: 6 },
    },
    colors: [d.color],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.6,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 70, 100],
      },
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      strokeColors: colors.card,
      hover: { size: 6 },
    },
    xaxis: {
      categories: DAYS_SHORT,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: colors.text3, fontSize: '11px' } },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { colors: colors.text3, fontSize: '11px' },
        formatter: (val) => {
          if (val === null || val === undefined) return '';
          if (d.unit === 'kcal') return Math.round(val);
          if (d.unit === 'g') return Math.round(val);
          if (d.unit === 'kg') return (Math.round(val * 10) / 10).toFixed(1);
          if (d.unit === 'L') return (Math.round(val * 10) / 10).toFixed(1);
          return val;
        }
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => (val === null || val === undefined) ? '—' : `${fmtKpi(val, d.unit)} ${d.unit}`,
      }
    },
    series,
    annotations: d.goal ? {
      yaxis: [{
        y: Number(d.goal),
        borderColor: colorMix(d.color, colors.border, 0.55),
        strokeDashArray: 6,
        label: {
          text: `Goal ${fmtKpi(d.goal, d.unit)} ${d.unit}`,
          style: {
            background: colorMix(d.color, colors.card, 0.14),
            color: d.color,
            fontSize: '11px',
            fontWeight: 700,
          }
        }
      }]
    } : undefined,
  };

  _apexTrendChart = new ApexCharts(target, opts);
  _apexTrendChart.render();
}

function colorMix(fg, bg, fgWeight = 0.5) {
  // very small helper: return a fallback if css color parsing fails
  // we keep it simple: let browser handle most via CSS vars; use fg as-is.
  return fg || bg || '#6F3CFF';
}
function switchChart(btn, type) {
  document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderChart(type);
}
function renderWeekSummary() {
  const validCal = weekHistory.cal.filter(v => v > 0);
  const validProt = weekHistory.prot.filter(v => v > 0);
  const validWeight = weekHistory.weight.filter(v => v !== null);
  const avgCal = validCal.length ? Math.round(validCal.reduce((a,b)=>a+b,0)/validCal.length) : 0;
  const avgProt = validProt.length ? Math.round(validProt.reduce((a,b)=>a+b,0)/validProt.length) : 0;
  const weightDelta = validWeight.length >= 2 ? (validWeight[validWeight.length-1] - validWeight[0]).toFixed(1) : 'N/A';
  const daysLogged = weekHistory.cal.filter(v => v > 0).length;

  document.getElementById('week-summary').innerHTML = `
    <div class="workout-stat" style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px">
      <div class="workout-stat-num" style="color:var(--accent)">${daysLogged}/7</div>
      <div class="workout-stat-label">Days Logged</div>
    </div>
    <div class="workout-stat" style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px">
      <div class="workout-stat-num" style="color:var(--accent2)">${avgCal}</div>
      <div class="workout-stat-label">Avg Calories</div>
    </div>
    <div class="workout-stat" style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px">
      <div class="workout-stat-num" style="color:var(--accent3)">${avgProt}g</div>
      <div class="workout-stat-label">Avg Protein</div>
    </div>
    <div class="workout-stat" style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px">
      <div class="workout-stat-num" style="color:var(--blue)">
        ${typeof weightDelta === 'number' || weightDelta !== 'N/A' ? (weightDelta > 0 ? '+' : '') + weightDelta + ' kg' : 'N/A'}
      </div>
      <div class="workout-stat-label">Weight Change</div>
    </div>
  `;
}