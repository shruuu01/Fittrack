from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Profile, FoodLog, WorkoutLog, DietPlan, 
    Recommendation, PostureAnalysis, Notification, 
    Friend, Post, Comment, Report
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'name', 'age', 'gender', 
            'height', 'weight', 'target_weight', 
            'activity_level', 'daily_calorie_goal', 
            'daily_water_goal', 'streak', 'last_active_date', 'role'
        ]
        read_only_fields = ['streak', 'last_active_date']


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class FoodLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodLog
        fields = '__all__'
        read_only_fields = ['user', 'logged_at']


class WorkoutLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutLog
        fields = '__all__'
        read_only_fields = ['user', 'logged_at']


class DietPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = DietPlan
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class PostureAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostureAnalysis
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class FriendSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    friend_detail = UserSerializer(source='friend', read_only=True)

    class Meta:
        model = Friend
        fields = ['id', 'user', 'friend', 'user_detail', 'friend_detail', 'status', 'created_at']
        read_only_fields = ['user', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'username', 'content', 'created_at']
        read_only_fields = ['user', 'created_at']


class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'user', 'username', 'content', 'image', 'likes_count', 'comments_count', 'comments', 'created_at']
        read_only_fields = ['user', 'likes_count', 'comments_count', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ['user', 'created_at']
