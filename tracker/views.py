import json
from datetime import timedelta
from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import requests

from .models import UserProfile, FoodItem, MealLog, WeightLog, ExerciseLog, DailyWater, DailyGoal, UserGoal

def index_view(request):
    return render(request, 'tracker/index.html')

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@api_view(['POST'])
def api_login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'status': 'error', 'message': 'Email and password required'}, status=400)
    try:
        user_obj = User.objects.get(email=email)
        user = authenticate(username=user_obj.username, password=password)
        if user is not None:
            tokens = get_tokens_for_user(user)
            return Response({'status': 'ok', 'tokens': tokens})
    except User.DoesNotExist:
        pass
    return Response({'status': 'error', 'message': 'Invalid email or password'}, status=400)

@api_view(['POST'])
def api_signup(request):
    email = request.data.get('email')
    name = request.data.get('name')
    password = request.data.get('password')
    goal = request.data.get('goal', 'bulk')
    
    if User.objects.filter(email=email).exists():
        return Response({'status': 'error', 'message': 'Email already exists'}, status=400)
    
    user = User.objects.create_user(username=email, email=email, password=password)
    first_name = name.split(' ')[0] if name else ''
    user.first_name = first_name
    user.save()
    
    UserProfile.objects.create(
        user=user,
        goal=goal,
        age=int(request.data.get('age', 25)),
        weight=float(request.data.get('weight', 70.0)),
        height=int(request.data.get('height', 175)),
        gender=request.data.get('gender', 'Male')
    )
    user_auth = authenticate(username=email, password=password)
    tokens = get_tokens_for_user(user_auth)
    return Response({'status': 'ok', 'tokens': tokens})

@api_view(['POST'])
def api_logout(request):
    return Response({'status': 'ok'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_get_today(request):
    profile = request.user.profile
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    meals = MealLog.objects.filter(user=request.user, logged_at__gte=today_start, logged_at__lt=today_end).order_by('-logged_at')
    exercises = ExerciseLog.objects.filter(user=request.user, logged_at__gte=today_start, logged_at__lt=today_end).order_by('-logged_at')
    weights = WeightLog.objects.filter(user=request.user).order_by('-logged_at')[:5]
    water, _ = DailyWater.objects.get_or_create(user=request.user, date=now.date())
    goal, _ = DailyGoal.objects.get_or_create(user=request.user, date=now.date())
    
    meals_data = [{
        'name': m.food_name, 'cal': m.calories, 'p': m.protein, 'c': m.carbs, 'f': m.fat,
        'emoji': m.emoji, 'source': m.source, 'time': m.logged_at.strftime('%H:%M')
    } for m in meals]
    
    exercises_data = [{
        'name': e.name, 'weight': e.weight, 'sets': e.sets, 'reps': e.reps,
        'vol': e.volume, 'calBurn': e.calories_burned
    } for e in exercises]
    
    weight_data = [{
        'val': w.weight, 'date': w.logged_at.strftime('%Y-%m-%d %H:%M')
    } for w in reversed(weights)]

    # Get all user goals
    user_goals = UserGoal.objects.filter(user=request.user).values(
        'id', 'title', 'description', 'goal_type', 'target_value', 'is_completed', 'target_date'
    )
    
    user_goals_data = [{
        'id': g['id'],
        'title': g['title'],
        'description': g['description'],
        'type': g['goal_type'],
        'target': g['target_value'],
        'completed': g['is_completed'],
        'target_date': g['target_date'].strftime('%Y-%m-%d') if g['target_date'] else None
    } for g in user_goals]
    days = [now.date() - timedelta(days=i) for i in range(6, -1, -1)]
    week_cal = []
    week_prot = []
    week_water_ml = []
    week_weight = []
    for d in days:
        day_meals = MealLog.objects.filter(user=request.user, logged_at__date=d)
        week_cal.append(round(sum(m.calories for m in day_meals)) if day_meals.exists() else 0)
        week_prot.append(round(sum(m.protein for m in day_meals)) if day_meals.exists() else 0)

        day_water = DailyWater.objects.filter(user=request.user, date=d).first()
        cups = day_water.cups if day_water else 0
        week_water_ml.append(int(cups) * 375)

        day_weight = WeightLog.objects.filter(user=request.user, logged_at__date=d).order_by('-logged_at').first()
        week_weight.append(day_weight.weight if day_weight else None)
    
    return Response({
        'user': {
            'name': request.user.first_name or request.user.email,
            'email': request.user.email,
            'goal': profile.goal,
            'age': profile.age,
            'weight': profile.weight,
            'height': profile.height,
            'gender': profile.gender,
            'api_key_set': bool(profile.api_key)
        },
        'goals': {
            'cal': profile.calorie_goal,
            'p': profile.protein_goal,
            'c': profile.carbs_goal,
            'f': profile.fat_goal,
            'water': profile.water_goal
        },
        'today': {
            'meals': meals_data,
            'exercises': exercises_data,
            'water_cups': water.cups,
            'weight_log': weight_data,
            'daily_goal': goal.goal_text,
            'goal_completed': goal.completed,
            'meals_count': len(meals_data)
        },
        'user_goals': user_goals_data,
        'week': {
            'cal': week_cal,
            'prot': week_prot,
            'water_ml': week_water_ml,
            'weight': week_weight,
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_add_meal(request):
    MealLog.objects.create(
        user=request.user,
        food_name=request.data.get('name'),
        calories=request.data.get('cal', 0),
        protein=request.data.get('p', 0),
        carbs=request.data.get('c', 0),
        fat=request.data.get('f', 0),
        emoji=request.data.get('emoji', '🍽️'),
        source=request.data.get('source', 'Manual')
    )
    return Response({'status': 'ok'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_log_weight(request):
    w = float(request.data.get('weight'))
    WeightLog.objects.create(user=request.user, weight=w)
    profile = request.user.profile
    profile.weight = w
    profile.save()
    return Response({'status': 'ok'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_log_water(request):
    cups = request.data.get('cups', 0)
    water, _ = DailyWater.objects.get_or_create(user=request.user, date=timezone.localdate())
    water.cups = int(cups)
    water.save()
    return Response({'status': 'ok'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_add_exercise(request):
    ExerciseLog.objects.create(
        user=request.user,
        name=request.data.get('name'),
        weight=request.data.get('weight', 0),
        sets=request.data.get('sets', 1),
        reps=request.data.get('reps', '10'),
        volume=request.data.get('vol', 0),
        calories_burned=request.data.get('calBurn', 0)
    )
    return Response({'status': 'ok'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_update_goals(request):
    profile = request.user.profile
    if 'api_key' in request.data: profile.api_key = request.data['api_key']
    if 'cal' in request.data: profile.calorie_goal = request.data['cal']
    if 'p' in request.data: profile.protein_goal = request.data['p']
    if 'c' in request.data: profile.carbs_goal = request.data['c']
    if 'f' in request.data: profile.fat_goal = request.data['f']
    if 'water' in request.data: profile.water_goal = request.data['water']
    if 'goal' in request.data: profile.goal = request.data['goal']
    profile.save()
    return Response({'status': 'ok'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_set_daily_goal(request):
    goal_text = request.data.get('goal', '')
    completed = request.data.get('completed', False)
    goal, created = DailyGoal.objects.get_or_create(user=request.user, date=timezone.localdate())
    goal.goal_text = goal_text
    goal.completed = completed
    goal.save()
    return Response({'status': 'ok'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_search_food(request):
    q = request.GET.get('q', '').lower()
    if not q or len(q) < 2: return Response({'results': []})
    foods = FoodItem.objects.filter(name__icontains=q)[:10]
    return Response({'results': [{
        'name': f.name, 'cal': f.calories, 'p': f.protein, 'c': f.carbs, 'f': f.fat,
        'source': f.source, 'cat': f.category, 'emoji': f.emoji
    } for f in foods]})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_analyze_food(request):
    base64_image = request.data.get('image')
    media_type = request.data.get('media_type', 'image/jpeg')
    api_key = request.user.profile.api_key
    if not api_key:
        return Response({'status': 'error', 'message': 'No API key set. Add it in Profile → AI Configuration.'}, status=400)
    
    try:
        resp = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
            json={
                "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                "temperature": 0.1,
                "max_completion_tokens": 1024,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "You are a nutritionist. Identify this food, estimate portion, and provide JSON with name, portion, calories, protein_g, carbs_g, fat_g, fiber_g, ingredients, source, cookingMethod, confidence. ONLY JSON."},
                        {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{base64_image}"}}
                    ]
                }]
            }
        )
        groq_data = resp.json()
        if 'error' in groq_data:
            return Response({'status': 'error', 'message': str(groq_data['error'])}, status=400)
        text = groq_data['choices'][0]['message']['content']
        clean = text.replace('```json', '').replace('```', '').strip()
        start = clean.find('{')
        end = clean.rfind('}')
        if start != -1 and end != -1:
            clean = clean[start:end+1]
        return Response({'status': 'ok', 'result': json.loads(clean)})
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_create_goal(request):
    title = request.data.get('title')
    description = request.data.get('description', '')
    goal_type = request.data.get('type', 'daily')
    target_value = request.data.get('target', '')
    target_date = request.data.get('target_date', None)
    
    if not title:
        return Response({'status': 'error', 'message': 'Title required'}, status=400)
    
    goal = UserGoal.objects.create(
        user=request.user,
        title=title,
        description=description,
        goal_type=goal_type,
        target_value=target_value,
        target_date=target_date
    )
    
    return Response({
        'status': 'ok',
        'goal': {
            'id': goal.id,
            'title': goal.title,
            'description': goal.description,
            'type': goal.goal_type,
            'target': goal.target_value,
            'completed': goal.is_completed,
            'target_date': goal.target_date.strftime('%Y-%m-%d') if goal.target_date else None
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_update_goal(request):
    goal_id = request.data.get('id')
    
    try:
        goal = UserGoal.objects.get(id=goal_id, user=request.user)
    except UserGoal.DoesNotExist:
        return Response({'status': 'error', 'message': 'Goal not found'}, status=404)
    
    if 'title' in request.data: goal.title = request.data['title']
    if 'description' in request.data: goal.description = request.data['description']
    if 'type' in request.data: goal.goal_type = request.data['type']
    if 'target' in request.data: goal.target_value = request.data['target']
    if 'completed' in request.data: goal.is_completed = request.data['completed']
    if 'target_date' in request.data: goal.target_date = request.data['target_date']
    
    goal.save()
    
    return Response({
        'status': 'ok',
        'goal': {
            'id': goal.id,
            'title': goal.title,
            'description': goal.description,
            'type': goal.goal_type,
            'target': goal.target_value,
            'completed': goal.is_completed,
            'target_date': goal.target_date.strftime('%Y-%m-%d') if goal.target_date else None
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_delete_goal(request):
    goal_id = request.data.get('id')
    
    try:
        goal = UserGoal.objects.get(id=goal_id, user=request.user)
        goal.delete()
        return Response({'status': 'ok'})
    except UserGoal.DoesNotExist:
        return Response({'status': 'error', 'message': 'Goal not found'}, status=404)
