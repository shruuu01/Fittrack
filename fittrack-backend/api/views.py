import os
import json
from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Profile, FoodLog, WorkoutLog, DietPlan, 
    Recommendation, PostureAnalysis, Notification, 
    Friend, Post, Comment, Report
)
from .serializers import (
    UserSerializer, ProfileSerializer, UserRegisterSerializer,
    FoodLogSerializer, WorkoutLogSerializer, DietPlanSerializer,
    RecommendationSerializer, PostureAnalysisSerializer, NotificationSerializer,
    FriendSerializer, PostSerializer, CommentSerializer, ReportSerializer
)
from .ml.recommender import generate_fitness_recommendations
from .ml.classifier import predict_food_from_image
from .utils.notifications import create_notification

class IsSystemAdmin(permissions.BasePermission):
    """Custom permission to check for staff status or ADMIN profile role"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or 
            (hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN')
        )


class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        # Always return single profile for current user
        profile, created = Profile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        # Check streak calculation here (optional micro-interaction)
        today = timezone.localdate()
        if profile.last_active_date:
            delta = today - profile.last_active_date
            if delta.days == 1:
                profile.streak += 1
            elif delta.days > 1:
                profile.streak = 1
        else:
            profile.streak = 1
        profile.last_active_date = today

        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FoodLogViewSet(viewsets.ModelViewSet):
    serializer_class = FoodLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FoodLog.objects.filter(user=self.request.user).order_by('-logged_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def daily_summary(self, request):
        date_str = request.query_params.get('date', None)
        if date_str:
            date_parsed = timezone.datetime.strptime(date_str, "%Y-%m-%d").date()
        else:
            date_parsed = timezone.localdate()

        logs = FoodLog.objects.filter(user=request.user, logged_at__date=date_parsed)
        totals = logs.aggregate(
            total_calories=Sum('calories'),
            total_protein=Sum('protein'),
            total_carbs=Sum('carbs'),
            total_fat=Sum('fat')
        )
        
        # Hydrate defaults
        return Response({
            'date': date_parsed,
            'total_calories': totals['total_calories'] or 0,
            'total_protein': totals['total_protein'] or 0.0,
            'total_carbs': totals['total_carbs'] or 0.0,
            'total_fat': totals['total_fat'] or 0.0,
            'items': FoodLogSerializer(logs, many=True).data
        })

    @action(detail=False, methods=['post'])
    def recognize(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No image file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure media directory exists
        os.makedirs(os.path.join('media', 'food_images'), exist_ok=True)
        
        # Save temporary file for OpenCV classification
        filename = f"temp_{timezone.now().timestamp()}_{file_obj.name}"
        filepath = os.path.join('media', 'food_images', filename)
        
        with open(filepath, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        # Execute CV Classification
        prediction = predict_food_from_image(filepath)
        
        # Generate clean URL for uploaded image
        relative_url = f"/media/food_images/{filename}"

        return Response({
            'predicted_item': prediction['name'],
            'calories': prediction['calories'],
            'protein': prediction['protein'],
            'carbs': prediction['carbs'],
            'fat': prediction['fat'],
            'confidence': prediction['confidence'],
            'image_url': relative_url
        })


class WorkoutLogViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutLog.objects.filter(user=self.request.user).order_by('-logged_at')

    def perform_create(self, serializer):
        workout = serializer.save(user=self.request.user)
        # Notify user when workout logged
        create_notification(
            user=self.request.user,
            notification_type='WORKOUT',
            message=f"Awesome job logging {workout.exercise_name}! You burned {workout.calories_burned} kcal."
        )

    @action(detail=False, methods=['get'])
    def summary(self, request):
        logs = WorkoutLog.objects.filter(user=request.user)
        totals = logs.aggregate(
            total_duration=Sum('duration_minutes'),
            total_burned=Sum('calories_burned'),
            workout_count=Count('id')
        )
        return Response({
            'total_duration': totals['total_duration'] or 0,
            'total_burned': totals['total_burned'] or 0,
            'workout_count': totals['workout_count'] or 0
        })


class RecommendationViewSet(viewsets.ModelViewSet):
    serializer_class = RecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Recommendation.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def generate(self, request):
        profile = Profile.objects.get(user=request.user)
        
        # Call Scikit-learn similarity recommend logic
        rec_data = generate_fitness_recommendations(profile)
        
        # Save diet recommendation
        diet_rec = Recommendation.objects.create(
            user=request.user,
            type='DIET',
            goal_type=rec_data['goal_type'],
            content_json=json.dumps(rec_data['diet_plan']),
            is_applied=True
        )
        
        # Save workout recommendation
        workout_rec = Recommendation.objects.create(
            user=request.user,
            type='WORKOUT',
            goal_type=rec_data['goal_type'],
            content_json=json.dumps(rec_data['workout_plan']),
            is_applied=True
        )
        
        # Auto update profile goals based on calorie recommendation
        profile.daily_calorie_goal = rec_data['daily_calories']
        profile.save()

        create_notification(
            user=request.user,
            notification_type='GOAL',
            message=f"New personalized {rec_data['goal_type'].replace('_', ' ')} plans have been generated for you!"
        )

        return Response({
            'goal_type': rec_data['goal_type'],
            'daily_calories': rec_data['daily_calories'],
            'diet_recommendation': RecommendationSerializer(diet_rec).data,
            'workout_recommendation': RecommendationSerializer(workout_rec).data
        })


class PostureAnalysisViewSet(viewsets.ModelViewSet):
    serializer_class = PostureAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PostureAnalysis.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        analysis = serializer.save(user=self.request.user)
        # Check for safety alerts (e.g. if posture compliance falls below 70%)
        if analysis.accuracy_score < 70.0:
            create_notification(
                user=self.request.user,
                notification_type='WORKOUT',
                message=f"We noticed some posture discrepancies during your {analysis.exercise_type} session ({analysis.accuracy_score}%). Check reports."
            )
        else:
            create_notification(
                user=self.request.user,
                notification_type='GOAL',
                message=f"Excellent posture! Recorded {analysis.accuracy_score}% accuracy on your {analysis.exercise_type}."
            )


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['put'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})


class SocialViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def feed(self, request):
        posts = Post.objects.all().order_by('-created_at')
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def post_activity(self, request):
        content = request.data.get('content')
        image = request.FILES.get('image', None)
        
        post = Post.objects.create(
            user=request.user,
            content=content,
            image=image
        )
        return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        post = Post.objects.get(id=pk)
        content = request.data.get('content')
        comment = Comment.objects.create(
            post=post,
            user=request.user,
            content=content
        )
        post.comments_count = post.comments.count()
        post.save()
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = Post.objects.get(id=pk)
        post.likes_count += 1
        post.save()
        return Response({'likes_count': post.likes_count})

    @action(detail=False, methods=['post'])
    def friend_request(self, request):
        friend_id = request.data.get('friend_id')
        friend_user = User.objects.get(id=friend_id)
        
        connection, created = Friend.objects.get_or_create(
            user=request.user,
            friend=friend_user,
            status='PENDING'
        )
        return Response(FriendSerializer(connection).data)

    @action(detail=False, methods=['post'])
    def accept_friend(self, request):
        connection_id = request.data.get('connection_id')
        connection = Friend.objects.get(id=connection_id, friend=request.user)
        connection.status = 'ACCEPTED'
        connection.save()
        
        # Dual linking
        Friend.objects.get_or_create(
            user=request.user,
            friend=connection.user,
            status='ACCEPTED'
        )
        return Response({'status': 'friend request accepted'})

    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        # Basic suggestion engine: find users who are not friends yet
        existing_friends = Friend.objects.filter(user=request.user).values_list('friend_id', flat=True)
        suggestions = User.objects.exclude(id=request.user.id).exclude(id__in=existing_friends)[:5]
        return Response(UserSerializer(suggestions, many=True).data)


class AdminViewSet(viewsets.ViewSet):
    permission_classes = [IsSystemAdmin]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        users_count = User.objects.count()
        posts_count = Post.objects.count()
        reports_count = Report.objects.filter(status='PENDING').count()
        workouts_logged = WorkoutLog.objects.count()
        
        # Weekly trends mock/calc
        return Response({
            'total_users': users_count,
            'total_posts': posts_count,
            'pending_reports': reports_count,
            'total_workouts': workouts_logged
        })

    @action(detail=False, methods=['get'])
    def users(self, request):
        profiles = Profile.objects.all()
        return Response(ProfileSerializer(profiles, many=True).data)

    @action(detail=True, methods=['put'])
    def change_role(self, request, pk=None):
        profile = Profile.objects.get(id=pk)
        role = request.data.get('role')
        if role in ['USER', 'ADMIN']:
            profile.role = role
            profile.save()
            return Response({'status': f'Role updated to {role}'})
        return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def reports(self, request):
        reports = Report.objects.all().order_by('-created_at')
        return Response(ReportSerializer(reports, many=True).data)

    @action(detail=True, methods=['post'])
    def resolve_report(self, request, pk=None):
        report = Report.objects.get(id=pk)
        report.status = 'RESOLVED'
        report.save()
        return Response({'status': 'Report resolved'})
