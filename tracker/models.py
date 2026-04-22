from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    goal = models.CharField(max_length=20, choices=[('bulk', 'Bulk'), ('cut', 'Cut'), ('maintain', 'Maintain')], default='bulk')
    age = models.IntegerField(default=25)
    weight = models.FloatField(default=70.0)
    height = models.IntegerField(default=175)
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female')], default='Male')
    api_key = models.CharField(max_length=255, blank=True, null=True)
    
    water_goal = models.IntegerField(default=3000)
    calorie_goal = models.IntegerField(default=2400)
    protein_goal = models.IntegerField(default=180)
    carbs_goal = models.IntegerField(default=280)
    fat_goal = models.IntegerField(default=80)

class FoodItem(models.Model):
    name = models.CharField(max_length=255)
    calories = models.FloatField()
    protein = models.FloatField()
    carbs = models.FloatField()
    fat = models.FloatField()
    fiber = models.FloatField(default=0)
    source = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    emoji = models.CharField(max_length=10, blank=True, null=True)

class MealLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meals')
    food_name = models.CharField(max_length=255)
    calories = models.FloatField()
    protein = models.FloatField()
    carbs = models.FloatField()
    fat = models.FloatField()
    emoji = models.CharField(max_length=10, blank=True, null=True)
    source = models.CharField(max_length=100, default='Manual')
    logged_at = models.DateTimeField(auto_now_add=True)
    
class WeightLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='weight_logs')
    weight = models.FloatField()
    logged_at = models.DateTimeField(auto_now_add=True)

class ExerciseLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=255)
    weight = models.FloatField()
    sets = models.IntegerField()
    reps = models.CharField(max_length=50) # e.g. "10,8,8"
    volume = models.FloatField()
    calories_burned = models.FloatField()
    logged_at = models.DateTimeField(auto_now_add=True)
    
class DailyWater(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='water_logs')
    date = models.DateField(default=timezone.localdate)
    cups = models.IntegerField(default=0) # 0 to 8 cups

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="unique_water_per_day")
        ]

class UserGoal(models.Model):
    GOAL_TYPES = [
        ('daily', 'Daily Goal'),
        ('fitness', 'Fitness Goal'),
        ('nutrition', 'Nutrition Goal'),
        ('health', 'Health Goal'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_goals')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPES, default='daily')
    target_value = models.CharField(max_length=100, blank=True)  # e.g., "100kg", "50km", etc.
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    target_date = models.DateField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']

class DailyGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_goals')
    date = models.DateField(default=timezone.localdate)
    goal_text = models.CharField(max_length=255, blank=True)
    completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'date')
