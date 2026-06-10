import json
import numpy as np
from sklearn.neighbors import NearestNeighbors

# Pre-defined templates for diets and workouts
DIET_TEMPLATES = {
    'WEIGHT_LOSS': {
        'title': 'High-Protein Caloric Deficit Plan',
        'description': 'Designed to maximize fat loss while preserving lean muscle mass. Focused on high protein, moderate fat, and low carbs.',
        'carbs_pct': 0.35,
        'protein_pct': 0.40,
        'fat_pct': 0.25,
        'meals': [
            {'name': 'Oatmeal with protein powder & berries', 'calories': 350, 'protein': 30, 'carbs': 40, 'fat': 7},
            {'name': 'Grilled chicken breast salad with olive oil', 'calories': 500, 'protein': 45, 'carbs': 15, 'fat': 18},
            {'name': 'Greek yogurt with almonds', 'calories': 200, 'protein': 20, 'carbs': 10, 'fat': 8},
            {'name': 'Baked salmon with steamed broccoli & quinoa', 'calories': 550, 'protein': 40, 'carbs': 35, 'fat': 22}
        ]
    },
    'WEIGHT_GAIN': {
        'title': 'High-Calorie Muscle Building Plan',
        'description': 'Designed to support hypertrophy and muscle gains. Focuses on calorie surplus with high complex carbs and protein.',
        'carbs_pct': 0.50,
        'protein_pct': 0.30,
        'fat_pct': 0.20,
        'meals': [
            {'name': '4 scrambled eggs, whole wheat toast & avocado', 'calories': 650, 'protein': 35, 'carbs': 45, 'fat': 30},
            {'name': 'Large beef bowl with white rice and mixed veggies', 'calories': 800, 'protein': 50, 'carbs': 80, 'fat': 24},
            {'name': 'Banana & peanut butter protein shake', 'calories': 500, 'protein': 35, 'carbs': 55, 'fat': 16},
            {'name': 'Pasta with turkey meatballs and olive oil', 'calories': 850, 'protein': 45, 'carbs': 100, 'fat': 25}
        ]
    },
    'MAINTENANCE': {
        'title': 'Balanced Health & Maintenance Plan',
        'description': 'A balanced distribution of macronutrients to support daily activities, heart health, and weight stability.',
        'carbs_pct': 0.45,
        'protein_pct': 0.30,
        'fat_pct': 0.25,
        'meals': [
            {'name': 'Fruit smoothie with yogurt and chia seeds', 'calories': 400, 'protein': 18, 'carbs': 60, 'fat': 10},
            {'name': 'Tuna wrap on whole wheat with humus', 'calories': 550, 'protein': 35, 'carbs': 40, 'fat': 15},
            {'name': 'Mixed nuts and apple', 'calories': 250, 'protein': 6, 'carbs': 25, 'fat': 15},
            {'name': 'Baked turkey breast with sweet potato and asparagus', 'calories': 600, 'protein': 40, 'carbs': 50, 'fat': 18}
        ]
    }
}

WORKOUT_TEMPLATES = {
    'WEIGHT_LOSS': {
        'title': 'Fat Shredding & HIIT Routine',
        'description': 'Combines bodyweight resistance circuits with high intensity cardio intervals to elevate heart rate and maximize calorie burn.',
        'exercises': [
            {'name': 'Jumping Jacks', 'sets': 3, 'reps': 30, 'duration_mins': 5, 'rest_seconds': 30},
            {'name': 'Bodyweight Squats', 'sets': 4, 'reps': 20, 'duration_mins': 10, 'rest_seconds': 45},
            {'name': 'Mountain Climbers', 'sets': 3, 'reps': 40, 'duration_mins': 5, 'rest_seconds': 30},
            {'name': 'HIIT Treadmill Intervals', 'sets': 1, 'reps': 1, 'duration_mins': 15, 'rest_seconds': 0},
            {'name': 'Plank Hold', 'sets': 3, 'reps': 1, 'duration_mins': 3, 'rest_seconds': 45}
        ]
    },
    'WEIGHT_GAIN': {
        'title': 'Hypertrophy Power & Strength Routine',
        'description': 'Focused on heavy compound progressive overload exercises to stimulate maximum muscle growth and strength.',
        'exercises': [
            {'name': 'Barbell Squats', 'sets': 4, 'reps': 8, 'duration_mins': 12, 'rest_seconds': 90},
            {'name': 'Bench Press', 'sets': 4, 'reps': 8, 'duration_mins': 12, 'rest_seconds': 90},
            {'name': 'Deadlifts', 'sets': 3, 'reps': 5, 'duration_mins': 10, 'rest_seconds': 120},
            {'name': 'Pull-ups', 'sets': 3, 'reps': 10, 'duration_mins': 8, 'rest_seconds': 60},
            {'name': 'Dumbbell Bicep Curls', 'sets': 3, 'reps': 12, 'duration_mins': 8, 'rest_seconds': 60}
        ]
    },
    'MAINTENANCE': {
        'title': 'Functional Fitness & Endurance Routine',
        'description': 'A moderate intensity plan balancing cardio, core strength, and muscle tone. Ideal for long-term health maintenance.',
        'exercises': [
            {'name': 'Jogging', 'sets': 1, 'reps': 1, 'duration_mins': 20, 'rest_seconds': 0},
            {'name': 'Pushups', 'sets': 3, 'reps': 15, 'duration_mins': 8, 'rest_seconds': 45},
            {'name': 'Lunges', 'sets': 3, 'reps': 12, 'duration_mins': 8, 'rest_seconds': 45},
            {'name': 'Dumbbell Shoulder Press', 'sets': 3, 'reps': 10, 'duration_mins': 8, 'rest_seconds': 60},
            {'name': 'Bicycle Crunches', 'sets': 3, 'reps': 20, 'duration_mins': 6, 'rest_seconds': 30}
        ]
    }
}

# Define reference templates training profiles
# Features: [Weight Difference (target - current), Age, Activity Level Code (1-5)]
TRAINING_PROFILES = np.array([
    [-15, 20, 2], # Lose lots of weight, young, moderate active -> Loss
    [-5,  35, 1], # Lose small weight, older, sedentary -> Loss
    [0,   28, 3], # Maintain weight, active -> Maintenance
    [0,   45, 2], # Maintain weight, older, light active -> Maintenance
    [5,   22, 4], # Build muscle, young, highly active -> Gain
    [12,  30, 3], # Build muscle, active -> Gain
])

LABELS = ['WEIGHT_LOSS', 'WEIGHT_LOSS', 'MAINTENANCE', 'MAINTENANCE', 'WEIGHT_GAIN', 'WEIGHT_GAIN']

# Initialize KNN model
knn = NearestNeighbors(n_neighbors=1, algorithm='auto')
knn.fit(TRAINING_PROFILES)

def get_activity_score(level):
    mapping = {
        'SEDENTARY': 1,
        'LIGHTLY_ACTIVE': 2,
        'MODERATELY_ACTIVE': 3,
        'VERY_ACTIVE': 4,
        'EXTRA_ACTIVE': 5
    }
    return mapping.get(level, 1)

def get_bmr(gender, weight, height, age):
    """Calculate Basal Metabolic Rate using Harris-Benedict Equation"""
    if gender.lower() == 'male':
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    elif gender.lower() == 'female':
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    else:
        return 655.0 + (9.6 * weight) + (1.8 * height) - (4.7 * age)

def get_tdee(bmr, activity_level):
    """Total Daily Energy Expenditure based on activity level"""
    multipliers = {
        'SEDENTARY': 1.2,
        'LIGHTLY_ACTIVE': 1.375,
        'MODERATELY_ACTIVE': 1.55,
        'VERY_ACTIVE': 1.725,
        'EXTRA_ACTIVE': 1.9
    }
    return bmr * multipliers.get(activity_level, 1.2)

def generate_fitness_recommendations(profile):
    """
    Main recommendation engine
    Uses KNN to match profile features to templates, and runs calorie calculators
    """
    # Features extraction
    weight_diff = profile.target_weight - profile.weight
    age = profile.age
    activity_score = get_activity_score(profile.activity_level)
    
    query = np.array([[weight_diff, age, activity_score]])
    
    # Run KNN query
    distances, indices = knn.kneighbors(query)
    matched_idx = indices[0][0]
    goal_label = LABELS[matched_idx]
    
    # Calculate recommended calorie budget
    bmr = get_bmr(profile.gender, profile.weight, profile.height, profile.age)
    tdee = get_tdee(bmr, profile.activity_level)
    
    # Calorie Adjustment based on Goal
    if goal_label == 'WEIGHT_LOSS':
        calorie_recommendation = int(tdee - 500)
    elif goal_label == 'WEIGHT_GAIN':
        calorie_recommendation = int(tdee + 400)
    else:
        calorie_recommendation = int(tdee)
        
    # Boundary constraints
    calorie_recommendation = max(1200, calorie_recommendation)
    
    # Distribute Macros
    diet_template = DIET_TEMPLATES[goal_label].copy()
    workout_template = WORKOUT_TEMPLATES[goal_label].copy()
    
    protein_g = (calorie_recommendation * diet_template['protein_pct']) / 4.0
    carbs_g = (calorie_recommendation * diet_template['carbs_pct']) / 4.0
    fat_g = (calorie_recommendation * diet_template['fat_pct']) / 9.0
    
    # Assemble recommendations
    diet_plan_details = {
        'title': diet_template['title'],
        'description': diet_template['description'],
        'calories': calorie_recommendation,
        'protein': round(protein_g, 1),
        'carbs': round(carbs_g, 1),
        'fat': round(fat_g, 1),
        'meals': diet_template['meals']
    }
    
    workout_plan_details = {
        'title': workout_template['title'],
        'description': workout_template['description'],
        'exercises': workout_template['exercises']
    }
    
    return {
        'goal_type': goal_label,
        'daily_calories': calorie_recommendation,
        'diet_plan': diet_plan_details,
        'workout_plan': workout_plan_details
    }
