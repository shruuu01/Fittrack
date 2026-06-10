from django.contrib import admin
from .models import (
    Profile, FoodLog, WorkoutLog, DietPlan, 
    Recommendation, PostureAnalysis, Notification, 
    Friend, Post, Comment, Report
)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'gender', 'weight', 'activity_level', 'role')
    search_fields = ('user__username', 'name')
    list_filter = ('gender', 'activity_level', 'role')


@admin.register(FoodLog)
class FoodLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'food_name', 'calories', 'meal_type', 'logged_at')
    search_fields = ('user__username', 'food_name')
    list_filter = ('meal_type', 'logged_at')


@admin.register(WorkoutLog)
class WorkoutLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'exercise_name', 'category', 'duration_minutes', 'calories_burned', 'logged_at')
    search_fields = ('user__username', 'exercise_name')
    list_filter = ('category', 'logged_at')


@admin.register(DietPlan)
class DietPlanAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'calories', 'is_active', 'created_at')
    search_fields = ('user__username', 'title')


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'goal_type', 'is_applied', 'created_at')
    list_filter = ('type', 'goal_type', 'is_applied')


@admin.register(PostureAnalysis)
class PostureAnalysisAdmin(admin.ModelAdmin):
    list_display = ('user', 'exercise_type', 'accuracy_score', 'duration_seconds', 'created_at')
    list_filter = ('exercise_type', 'created_at')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'message', 'is_read', 'created_at')
    list_filter = ('type', 'is_read')


@admin.register(Friend)
class FriendAdmin(admin.ModelAdmin):
    list_display = ('user', 'friend', 'status', 'created_at')
    list_filter = ('status',)


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('user', 'content_summary', 'likes_count', 'comments_count', 'created_at')
    
    def content_summary(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_summary.short_description = 'Content'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'content_summary', 'created_at')
    
    def content_summary(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_summary.short_description = 'Comment'


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'target_id', 'status', 'created_at')
    list_filter = ('type', 'status')
