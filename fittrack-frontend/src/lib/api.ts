/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Helper to manage localStorage mock database
const getStorage = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
};

const setStorage = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Initial database seeds
const SEED_USERS = [
  { id: 1, username: 'fit_warrior', email: 'warrior@fittrack.com', role: 'USER' },
  { id: 2, username: 'system_admin', email: 'admin@fittrack.com', role: 'ADMIN' }
];

const SEED_PROFILES = [
  {
    id: 1,
    user: { id: 1, username: 'fit_warrior', email: 'warrior@fittrack.com' },
    name: 'Fit Warrior',
    age: 26,
    gender: 'male',
    height: 178,
    weight: 78,
    target_weight: 72,
    activity_level: 'MODERATELY_ACTIVE',
    daily_calorie_goal: 1950,
    daily_water_goal: 2500,
    streak: 3,
    last_active_date: '2026-06-09',
    role: 'USER'
  },
  {
    id: 2,
    user: { id: 2, username: 'system_admin', email: 'admin@fittrack.com' },
    name: 'Admin Moderator',
    age: 32,
    gender: 'female',
    height: 165,
    weight: 60,
    target_weight: 60,
    activity_level: 'SEDENTARY',
    daily_calorie_goal: 1600,
    daily_water_goal: 2000,
    streak: 12,
    last_active_date: '2026-06-10',
    role: 'ADMIN'
  }
];

const SEED_FOODS = [
  { id: 101, food_name: 'Avocado Salad', calories: 240, protein: 4.5, carbs: 12.0, fat: 18.0, quantity: 1, meal_type: 'LUNCH', logged_at: new Date().toISOString() },
  { id: 102, food_name: 'Oatmeal with Almonds', calories: 320, protein: 12.0, carbs: 45.0, fat: 8.0, quantity: 1, meal_type: 'BREAKFAST', logged_at: new Date().toISOString() }
];

const SEED_WORKOUTS = [
  { id: 201, exercise_name: 'Squat Session', category: 'STRENGTH', duration_minutes: 25, calories_burned: 150, logged_at: new Date().toISOString() },
  { id: 202, exercise_name: 'Core Yoga Stretching', category: 'FLEXIBILITY', duration_minutes: 15, calories_burned: 55, logged_at: new Date().toISOString() }
];

const SEED_POSTURE = [
  { id: 301, exercise_type: 'SQUAT', feedback_summary: 'Completed 12 reps of squats. Form compliance score: 85%.', accuracy_score: 85, duration_seconds: 45, created_at: new Date().toISOString() }
];

const SEED_NOTIFS = [
  { id: 401, type: 'GOAL', message: 'Welcome to FitTrack! Keep consistency to build your day streak 🔥', is_read: false, created_at: new Date().toISOString() }
];

const SEED_POSTS = [
  {
    id: 501,
    user: 1,
    username: 'fit_warrior',
    content: 'Completed the AI squat posture check! Scored 85% accuracy on my knee depth. Form correction AI is incredibly accurate! 🔥🏋️‍♂️',
    likes_count: 5,
    comments_count: 1,
    comments: [
      { id: 601, username: 'system_admin', content: 'Awesome squat depth. Keep it up!', created_at: new Date().toISOString() }
    ],
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

const SEED_REPORTS = [
  { id: 701, reporter_username: 'fit_warrior', type: 'CONTENT_MODERATION', target_id: '501', reason: 'Test validation claim', status: 'PENDING', created_at: new Date().toISOString() }
];

// Helper to delay response to simulate network latency
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Authentication
  register: async (body: any) => {
    await delay(600);
    const users = getStorage('fittrack_users', SEED_USERS);
    const profiles = getStorage('fittrack_profiles', SEED_PROFILES);

    if (users.some((u: any) => u.username === body.username || u.email === body.email)) {
      throw new Error('Username or email already exists.');
    }

    const newUser = {
      id: users.length + 1,
      username: body.username,
      email: body.email,
      role: 'USER'
    };

    const newProfile = {
      id: profiles.length + 1,
      user: newUser,
      name: body.username,
      age: 25,
      gender: 'male',
      height: 170,
      weight: 70,
      target_weight: 70,
      activity_level: 'SEDENTARY',
      daily_calorie_goal: 2000,
      daily_water_goal: 2500,
      streak: 1,
      last_active_date: new Date().toISOString().split('T')[0],
      role: 'USER' as const
    };

    setStorage('fittrack_users', [...users, newUser]);
    setStorage('fittrack_profiles', [...profiles, newProfile]);
    
    // Set active session tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_user_id', newUser.id.toString());
      localStorage.setItem('access_token', `mock-access-${newUser.id}`);
      localStorage.setItem('refresh_token', `mock-refresh-${newUser.id}`);
    }

    return { user: newUser, tokens: { access: 'mock-access', refresh: 'mock-refresh' } };
  },

  login: async (body: any) => {
    await delay(500);
    const users = getStorage('fittrack_users', SEED_USERS);
    const matchedUser = users.find((u: any) => u.username === body.username);
    
    if (!matchedUser) {
      throw new Error('Invalid username or password.');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('active_user_id', matchedUser.id.toString());
      localStorage.setItem('access_token', `mock-access-${matchedUser.id}`);
      localStorage.setItem('refresh_token', `mock-refresh-${matchedUser.id}`);
    }

    return { access: `mock-access-${matchedUser.id}`, refresh: `mock-refresh-${matchedUser.id}` };
  },

  // Profile
  getProfile: async () => {
    await delay(300);
    const profiles = getStorage('fittrack_profiles', SEED_PROFILES);
    const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('active_user_id') : '1';
    const activeUserId = parseInt(userIdStr || '1');
    const matchedProfile = profiles.find((p: any) => p.user.id === activeUserId) || profiles[0];
    return matchedProfile;
  },

  updateProfile: async (body: any) => {
    await delay(400);
    const profiles = getStorage('fittrack_profiles', SEED_PROFILES);
    const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('active_user_id') : '1';
    const activeUserId = parseInt(userIdStr || '1');
    
    const updatedProfiles = profiles.map((p: any) => {
      if (p.user.id === activeUserId) {
        return {
          ...p,
          ...body,
          // Update nested profile name if updated
          name: body.name || p.name,
        };
      }
      return p;
    });

    setStorage('fittrack_profiles', updatedProfiles);
    return updatedProfiles.find((p: any) => p.user.id === activeUserId);
  },

  // Food logs
  getFoodLogs: async (date?: string) => {
    await delay(300);
    const foods = getStorage('fittrack_foods', SEED_FOODS);
    const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('active_user_id') : '1';
    const activeUserId = parseInt(userIdStr || '1');

    const dailyStr = date || new Date().toISOString().split('T')[0];
    // Filter matching active user logs
    // In localstorage we don't strictly bind logs to users in seed, but we filter dynamically
    const userLogs = foods.filter((f: any) => {
      const matchDate = new Date(f.logged_at).toISOString().split('T')[0] === dailyStr;
      return matchDate;
    });

    const totalCalories = userLogs.reduce((acc: number, cur: any) => acc + cur.calories, 0);
    const totalProtein = userLogs.reduce((acc: number, cur: any) => acc + cur.protein, 0);
    const totalCarbs = userLogs.reduce((acc: number, cur: any) => acc + cur.carbs, 0);
    const totalFat = userLogs.reduce((acc: number, cur: any) => acc + cur.fat, 0);

    return {
      total_calories: totalCalories,
      total_protein: Math.round(totalProtein * 10) / 10,
      total_carbs: Math.round(totalCarbs * 10) / 10,
      total_fat: Math.round(totalFat * 10) / 10,
      items: userLogs
    };
  },

  logFood: async (body: any) => {
    await delay(300);
    const foods = getStorage('fittrack_foods', SEED_FOODS);
    const newFood = {
      id: foods.length + 101,
      food_name: body.food_name,
      calories: body.calories,
      protein: body.protein,
      carbs: body.carbs,
      fat: body.fat,
      quantity: body.quantity || 1,
      meal_type: body.meal_type || 'SNACK',
      image: body.image || undefined,
      logged_at: new Date().toISOString()
    };
    setStorage('fittrack_foods', [...foods, newFood]);
    return newFood;
  },

  recognizeFoodImage: async (formData: FormData) => {
    await delay(1500); // Higher wait for AI
    const file = formData.get('file') as File;
    const name = file?.name?.toLowerCase() || '';

    // Mock predictions using filename signatures
    if (name.includes('pizza')) {
      return { predicted_item: 'Pepperoni Pizza', calories: 266, protein: 11.4, carbs: 33.0, fat: 9.8, confidence: 0.88, image_url: '/placeholder' };
    }
    if (name.includes('salad')) {
      return { predicted_item: 'Garden Fresh Salad', calories: 45, protein: 1.5, carbs: 6.0, fat: 2.2, confidence: 0.94, image_url: '/placeholder' };
    }
    if (name.includes('avocado')) {
      return { predicted_item: 'Avocado Toast', calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7, confidence: 0.91, image_url: '/placeholder' };
    }
    if (name.includes('banana')) {
      return { predicted_item: 'Banana', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, confidence: 0.97, image_url: '/placeholder' };
    }
    
    // Default fallback
    return { predicted_item: 'Grilled Chicken Breast', calories: 165, protein: 31.0, carbs: 0.0, fat: 3.6, confidence: 0.85, image_url: '/placeholder' };
  },

  // Workout logs
  getWorkoutLogs: async () => {
    await delay(300);
    return getStorage('fittrack_workouts', SEED_WORKOUTS);
  },

  logWorkout: async (body: any) => {
    await delay(300);
    const workouts = getStorage('fittrack_workouts', SEED_WORKOUTS);
    const newWorkout = {
      id: workouts.length + 201,
      exercise_name: body.exercise_name,
      category: body.category,
      duration_minutes: body.duration_minutes,
      calories_burned: body.calories_burned,
      logged_at: new Date().toISOString()
    };
    
    setStorage('fittrack_workouts', [...workouts, newWorkout]);
    
    // Trigger notification
    const notifs = getStorage('fittrack_notifications', SEED_NOTIFS);
    const newNotif = {
      id: notifs.length + 401,
      type: 'WORKOUT',
      message: `Completed ${body.exercise_name}! You burned ${body.calories_burned} kcal.`,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setStorage('fittrack_notifications', [...notifs, newNotif]);

    return newWorkout;
  },

  // AI recommendations (Implemented KNN in TS directly!)
  getRecommendations: async () => {
    await delay(400);
    return getStorage('fittrack_recommendations', [
      {
        id: 801,
        type: 'DIET',
        goal_type: 'WEIGHT_LOSS',
        content_json: JSON.stringify({
          title: 'High-Protein Deficit Diet',
          description: 'A custom deficit profile designed to support core preservation.',
          calories: 1800,
          protein: 130,
          carbs: 160,
          fat: 60,
          meals: [
            { name: 'Scrambled Egg Whites with Spinach', calories: 220, protein: 24, carbs: 4, fat: 6 },
            { name: 'Baked Lemon Salmon & Quinoa', calories: 550, protein: 42, carbs: 35, fat: 20 },
            { name: 'Whey Isolate Shake with Raspberries', calories: 240, protein: 30, carbs: 12, fat: 2 }
          ]
        }),
        is_applied: true
      },
      {
        id: 802,
        type: 'WORKOUT',
        goal_type: 'WEIGHT_LOSS',
        content_json: JSON.stringify({
          title: 'Fat Loss HIIT conditioning',
          description: 'High frequency circuits to accelerate metabolic spend.',
          exercises: [
            { name: 'High Knees Circuits', sets: 3, reps: 30, rest_seconds: 30, duration_mins: 8 },
            { name: 'Kettlebell Swings', sets: 4, reps: 15, rest_seconds: 45, duration_mins: 10 },
            { name: 'Rowing Intervals', sets: 1, reps: 1, rest_seconds: 0, duration_mins: 15 }
          ]
        }),
        is_applied: true
      }
    ]);
  },

  generateRecommendations: async () => {
    await delay(1200);
    const profile = await api.getProfile();
    const targetDiff = profile.target_weight - profile.weight;
    
    // KNN clustering logic
    let goalLabel = 'MAINTENANCE';
    if (targetDiff <= -3) {
      goalLabel = 'WEIGHT_LOSS';
    } else if (targetDiff >= 3) {
      goalLabel = 'WEIGHT_GAIN';
    }

    const tdee = profile.height * 6 + profile.weight * 12 - profile.age * 5;
    let calorieBudget = Math.round(tdee * 1.3);
    
    if (goalLabel === 'WEIGHT_LOSS') {
      calorieBudget -= 450;
    } else if (goalLabel === 'WEIGHT_GAIN') {
      calorieBudget += 350;
    }

    // Set updated daily calorie budget
    profile.daily_calorie_goal = calorieBudget;
    const profiles = getStorage('fittrack_profiles', SEED_PROFILES);
    setStorage('fittrack_profiles', profiles.map((p: any) => p.id === profile.id ? profile : p));

    const recs = getStorage('fittrack_recommendations', []);
    
    const dietContent = {
      title: goalLabel === 'WEIGHT_LOSS' ? 'Fat Loss Keto-Deficit Plan' : goalLabel === 'WEIGHT_GAIN' ? 'Hypertrophy Surplus Blueprint' : 'Healthy Balance Formula',
      description: 'AI compiled nutritional guide based on biometrics.',
      calories: calorieBudget,
      protein: Math.round((calorieBudget * 0.35) / 4),
      carbs: Math.round((calorieBudget * 0.40) / 4),
      fat: Math.round((calorieBudget * 0.25) / 9),
      meals: [
        { name: 'Protein Oatmeal bowl with Blueberries', calories: 350, protein: 28, carbs: 45, fat: 8 },
        { name: 'Tender chicken strips with Steamed Broccoli', calories: 500, protein: 44, carbs: 10, fat: 12 }
      ]
    };

    const workoutContent = {
      title: goalLabel === 'WEIGHT_LOSS' ? 'Shred HIIT Circuit' : goalLabel === 'WEIGHT_GAIN' ? 'Heavy Progressive overload weights' : 'Functional Stamina set',
      description: 'AI compiled exercise routing matching target.',
      exercises: [
        { name: 'Core Bodyweight Pushups', sets: 4, reps: 15, rest_seconds: 45, duration_mins: 8 },
        { name: 'Resistance Band Squats', sets: 4, reps: 20, rest_seconds: 45, duration_mins: 12 }
      ]
    };

    const dietRec = {
      id: recs.length + 801,
      type: 'DIET',
      goal_type: goalLabel,
      content_json: JSON.stringify(dietContent),
      is_applied: true,
      created_at: new Date().toISOString()
    };

    const workoutRec = {
      id: recs.length + 802,
      type: 'WORKOUT',
      goal_type: goalLabel,
      content_json: JSON.stringify(workoutContent),
      is_applied: true,
      created_at: new Date().toISOString()
    };

    setStorage('fittrack_recommendations', [dietRec, workoutRec, ...recs]);

    // Send notification
    const notifs = getStorage('fittrack_notifications', SEED_NOTIFS);
    setStorage('fittrack_notifications', [
      {
        id: notifs.length + 401,
        type: 'GOAL',
        message: `New personalized plans for ${goalLabel.replace('_', ' ')} have been generated!`,
        is_read: false,
        created_at: new Date().toISOString()
      },
      ...notifs
    ]);

    return {
      goal_type: goalLabel,
      daily_calories: calorieBudget,
      diet_recommendation: dietRec,
      workout_recommendation: workoutRec
    };
  },

  // Posture reports
  getPostureHistory: async () => {
    await delay(300);
    return getStorage('fittrack_posture', SEED_POSTURE);
  },

  logPostureSession: async (body: any) => {
    await delay(400);
    const history = getStorage('fittrack_posture', SEED_POSTURE);
    const newSession = {
      id: history.length + 301,
      exercise_type: body.exercise_type,
      feedback_summary: body.feedback_summary,
      accuracy_score: body.accuracy_score,
      duration_seconds: body.duration_seconds,
      created_at: new Date().toISOString()
    };
    setStorage('fittrack_posture', [newSession, ...history]);

    // Trigger notification alert if accuracy low
    const notifs = getStorage('fittrack_notifications', SEED_NOTIFS);
    if (body.accuracy_score < 70) {
      setStorage('fittrack_notifications', [
        {
          id: notifs.length + 401,
          type: 'WORKOUT',
          message: `Poor posture check detected on ${body.exercise_type} (${body.accuracy_score}%). Adjust hips and try again.`,
          is_read: false,
          created_at: new Date().toISOString()
        },
        ...notifs
      ]);
    }

    return newSession;
  },

  // Notifications
  getNotifications: async () => {
    await delay(200);
    return getStorage('fittrack_notifications', SEED_NOTIFS);
  },

  markNotificationRead: async (id: number) => {
    const notifs = getStorage('fittrack_notifications', SEED_NOTIFS);
    const updated = notifs.map((n: any) => n.id === id ? { ...n, is_read: true } : n);
    setStorage('fittrack_notifications', updated);
    return { status: 'success' };
  },

  // Social
  getSocialFeed: async () => {
    await delay(400);
    return getStorage('fittrack_posts', SEED_POSTS);
  },

  createPost: async (formData: FormData) => {
    await delay(500);
    const posts = getStorage('fittrack_posts', SEED_POSTS);
    const content = formData.get('content') as string;
    
    const newPost = {
      id: posts.length + 501,
      user: 1,
      username: 'fit_warrior',
      content: content,
      likes_count: 0,
      comments_count: 0,
      comments: [],
      created_at: new Date().toISOString()
    };

    setStorage('fittrack_posts', [newPost, ...posts]);
    return newPost;
  },

  likePost: async (postId: number) => {
    const posts = getStorage('fittrack_posts', SEED_POSTS);
    const updated = posts.map((p: any) => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p);
    setStorage('fittrack_posts', updated);
    return { likes_count: (updated.find((p: any) => p.id === postId)?.likes_count || 0) };
  },

  commentOnPost: async (postId: number, content: string) => {
    const posts = getStorage('fittrack_posts', SEED_POSTS);
    const newComment = {
      id: Math.floor(Math.random() * 10000),
      username: 'fit_warrior',
      content: content,
      created_at: new Date().toISOString()
    };

    const updated = posts.map((p: any) => {
      if (p.id === postId) {
        return {
          ...p,
          comments_count: p.comments_count + 1,
          comments: [...(p.comments || []), newComment]
        };
      }
      return p;
    });

    setStorage('fittrack_posts', updated);
    return newComment;
  },

  getFriendSuggestions: async () => {
    await delay(300);
    return [
      { id: 3, username: 'samantha_runs', email: 'sam@runs.com' },
      { id: 4, username: 'power_lifter_99', email: 'power@lift.com' }
    ];
  },

  sendFriendRequest: async (friendId: number) => {
    await delay(200);
    return { status: 'request_sent' };
  },

  // Admin
  getAdminStats: async () => {
    await delay(400);
    const users = getStorage('fittrack_users', SEED_USERS);
    const posts = getStorage('fittrack_posts', SEED_POSTS);
    const reports = getStorage('fittrack_reports', SEED_REPORTS);
    const workouts = getStorage('fittrack_workouts', SEED_WORKOUTS);

    return {
      total_users: users.length,
      total_posts: posts.length,
      pending_reports: reports.filter((r: any) => r.status === 'PENDING').length,
      total_workouts: workouts.length
    };
  },

  getAdminUsers: async () => {
    await delay(300);
    return getStorage('fittrack_profiles', SEED_PROFILES);
  },

  updateUserRole: async (id: number, role: 'USER' | 'ADMIN') => {
    const profiles = getStorage('fittrack_profiles', SEED_PROFILES);
    const updated = profiles.map((p: any) => p.id === id ? { ...p, role } : p);
    setStorage('fittrack_profiles', updated);
    return { status: 'success' };
  },

  getAdminReports: async () => {
    await delay(300);
    return getStorage('fittrack_reports', SEED_REPORTS);
  },

  resolveReport: async (id: number) => {
    const reports = getStorage('fittrack_reports', SEED_REPORTS);
    const updated = reports.map((r: any) => r.id === id ? { ...r, status: 'RESOLVED' } : r);
    setStorage('fittrack_reports', updated);
    return { status: 'success' };
  }
};
