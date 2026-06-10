from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    ACTIVITY_CHOICES = [
        ('SEDENTARY', 'Sedentary'),
        ('LIGHTLY_ACTIVE', 'Lightly Active'),
        ('MODERATELY_ACTIVE', 'Moderately Active'),
        ('VERY_ACTIVE', 'Very Active'),
        ('EXTRA_ACTIVE', 'Extra Active'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    name = models.CharField(max_length=100, blank=True)
    age = models.IntegerField(default=25)
    gender = models.CharField(max_length=20, default='other')
    height = models.FloatField(default=170.0)  # in cm
    weight = models.FloatField(default=70.0)   # in kg
    target_weight = models.FloatField(default=70.0) # in kg
    activity_level = models.CharField(max_length=30, choices=ACTIVITY_CHOICES, default='SEDENTARY')
    daily_calorie_goal = models.IntegerField(default=2000)
    daily_water_goal = models.IntegerField(default=2500) # in ml
    streak = models.IntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=[('USER', 'User'), ('ADMIN', 'Admin')], default='USER')

    def __str__(self):
        return f"{self.user.username}'s Profile"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance, name=instance.username)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


class FoodLog(models.Model):
    MEAL_CHOICES = [
        ('BREAKFAST', 'Breakfast'),
        ('LUNCH', 'Lunch'),
        ('DINNER', 'Dinner'),
        ('SNACK', 'Snack'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='food_logs')
    food_name = models.CharField(max_length=150)
    calories = models.IntegerField(default=0)
    protein = models.FloatField(default=0.0) # in g
    carbs = models.FloatField(default=0.0)   # in g
    fat = models.FloatField(default=0.0)     # in g
    quantity = models.FloatField(default=1.0) # portions or serving units
    meal_type = models.CharField(max_length=20, choices=MEAL_CHOICES, default='SNACK')
    image = models.ImageField(upload_to='food_images/', null=True, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.food_name} ({self.calories} kcal)"


class WorkoutLog(models.Model):
    CATEGORY_CHOICES = [
        ('CARDIO', 'Cardio'),
        ('STRENGTH', 'Strength'),
        ('FLEXIBILITY', 'Flexibility'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_logs')
    exercise_name = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='STRENGTH')
    duration_minutes = models.IntegerField(default=30)
    calories_burned = models.IntegerField(default=200)
    logged_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.exercise_name} ({self.duration_minutes} mins)"


class DietPlan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='diet_plans')
    title = models.CharField(max_length=150)
    description = models.TextField()
    calories = models.IntegerField(default=2000)
    protein = models.FloatField(default=120.0)
    carbs = models.FloatField(default=200.0)
    fat = models.FloatField(default=70.0)
    duration_days = models.IntegerField(default=7)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} Plan: {self.title}"


class Recommendation(models.Model):
    TYPE_CHOICES = [
        ('DIET', 'Diet Recommendation'),
        ('WORKOUT', 'Workout Recommendation'),
    ]
    GOAL_CHOICES = [
        ('WEIGHT_LOSS', 'Weight Loss'),
        ('WEIGHT_GAIN', 'Weight Gain'),
        ('MAINTENANCE', 'Weight Maintenance'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    content_json = models.TextField() # Structed recommendation content
    goal_type = models.CharField(max_length=30, choices=GOAL_CHOICES, default='MAINTENANCE')
    is_applied = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.goal_type}"


class PostureAnalysis(models.Model):
    EXERCISE_CHOICES = [
        ('SQUAT', 'Squat'),
        ('PUSHUP', 'Pushup'),
        ('PLANK', 'Plank'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posture_analyses')
    exercise_type = models.CharField(max_length=20, choices=EXERCISE_CHOICES)
    feedback_summary = models.TextField()
    accuracy_score = models.FloatField(default=0.0) # Percentage score e.g. 85.5
    duration_seconds = models.IntegerField(default=0)
    video_url = models.CharField(max_length=300, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.exercise_type} ({self.accuracy_score}%)"


class Notification(models.Model):
    NOTIF_CHOICES = [
        ('WORKOUT', 'Workout Reminder'),
        ('WATER', 'Water Intake Reminder'),
        ('DIET', 'Diet Reminder'),
        ('GOAL', 'Goal Achieved'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIF_CHOICES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.is_read}"


class Friend(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Request'),
        ('ACCEPTED', 'Accepted Friend'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_friend_requests')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_friend_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'friend')

    def __str__(self):
        return f"{self.user.username} -> {self.friend.username} ({self.status})"


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='social_posts/', null=True, blank=True)
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Post ({self.created_at.strftime('%Y-%m-%d %H:%M')})"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} on Post {self.post.id}"


class Report(models.Model):
    TYPE_CHOICES = [
        ('USER_REPORT', 'User Moderation'),
        ('CONTENT_MODERATION', 'Post Content Flag'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending Resolution'),
        ('RESOLVED', 'Resolved'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_reports')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    target_id = models.CharField(max_length=100) # User ID or Post ID
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} - Flagged: {self.target_id} ({self.status})"
