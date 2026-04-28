from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_view, name='index'),
    path('api/login', views.api_login, name='api_login'),
    path('api/signup', views.api_signup, name='api_signup'),
    path('api/logout', views.api_logout, name='api_logout'),
    path('api/today', views.api_get_today, name='api_get_today'),
    path('api/add_meal', views.api_add_meal, name='api_add_meal'),
    path('api/log_weight', views.api_log_weight, name='api_log_weight'),
    path('api/log_water', views.api_log_water, name='api_log_water'),
    path('api/add_exercise', views.api_add_exercise, name='api_add_exercise'),
    path('api/update_goals', views.api_update_goals, name='api_update_goals'),
    path('api/set_daily_goal', views.api_set_daily_goal, name='api_set_daily_goal'),
    path('api/create_goal', views.api_create_goal, name='api_create_goal'),
    path('api/update_goal', views.api_update_goal, name='api_update_goal'),
    path('api/delete_goal', views.api_delete_goal, name='api_delete_goal'),
    path('api/search_food', views.api_search_food, name='api_search_food'),
    path('api/analyze_food', views.api_analyze_food, name='api_analyze_food'),
    path('api/migrate', views.run_migrations, name='run_migrations'),
]
