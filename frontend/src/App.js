import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Components
const CameraCapture = ({ onImageCapture, isCapturing, setIsCapturing, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Could not access camera. Please allow camera permissions.');
      }
    };

    if (isCapturing) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCapturing]);

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          onImageCapture(blob);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
    onClose();
  };

  if (!isCapturing) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex justify-center space-x-4">
            <button
              onClick={stopCamera}
              className="btn-secondary px-6 py-3"
            >
              Cancel
            </button>
            <button
              onClick={captureImage}
              className="btn-primary px-8 py-3"
            >
              Capture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileSetup = ({ onProfileCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    height_cm: '',
    weight_kg: '',
    activity_level: 'moderately_active',
    goal: 'maintain_weight',
    goal_weight_kg: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/profile`, {
        ...formData,
        age: parseInt(formData.age),
        height_cm: parseFloat(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        goal_weight_kg: formData.goal_weight_kg ? parseFloat(formData.goal_weight_kg) : null
      });

      onProfileCreated(response.data);
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="heading-1 mb-4">Welcome to FitSpice</h1>
            <p className="body-large text-text-secondary">
              Your AI-powered nutrition companion for South Asian cuisine
            </p>
          </div>

          <div className="bg-bg-card rounded-12 p-8 border border-border-light">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.height_cm}
                    onChange={(e) => setFormData({...formData, height_cm: e.target.value})}
                    className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
                    className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Activity Level
                </label>
                <select
                  value={formData.activity_level}
                  onChange={(e) => setFormData({...formData, activity_level: e.target.value})}
                  className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  <option value="sedentary">Sedentary (desk job, no exercise)</option>
                  <option value="lightly_active">Lightly Active (light exercise 1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</option>
                  <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
                  <option value="extremely_active">Extremely Active (very hard exercise, physical job)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Goal
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({...formData, goal: e.target.value})}
                  className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  <option value="lose_weight">Lose Weight</option>
                  <option value="maintain_weight">Maintain Weight</option>
                  <option value="gain_weight">Gain Weight</option>
                </select>
              </div>

              {formData.goal !== 'maintain_weight' && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Goal Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.goal_weight_kg}
                    onChange={(e) => setFormData({...formData, goal_weight_kg: e.target.value})}
                    className="w-full px-4 py-3 border border-border-medium rounded-8 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4"
              >
                {loading ? 'Creating Profile...' : 'Create Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const FoodAnalysis = ({ imageBlob, onAnalysisComplete, userId }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [mealType, setMealType] = useState('lunch');

  useEffect(() => {
    if (imageBlob) {
      analyzeFood();
    }
  }, [imageBlob]);

  const analyzeFood = async () => {
    setAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'food-image.jpg');
      formData.append('user_id', userId);
      formData.append('meal_type', mealType);

      const response = await axios.post(`${API}/analyze-food`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onAnalysisComplete(response.data);
    } catch (error) {
      console.error('Error analyzing food:', error);
      alert('Failed to analyze food. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-bg-page flex items-center justify-center p-6">
      <div className="bg-bg-card rounded-12 p-8 max-w-md w-full border border-border-light">
        <div className="text-center">
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
              <h3 className="heading-3 mb-2">Analyzing Your Food</h3>
              <p className="body-medium text-text-secondary">
                Our AI is identifying ingredients and calculating nutrition...
              </p>
            </>
          ) : (
            <>
              <h3 className="heading-3 mb-4">Select Meal Type</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`py-3 px-4 rounded-8 border transition-all ${
                      mealType === type 
                        ? 'bg-brand-primary text-white border-brand-primary' 
                        : 'bg-bg-card text-text-primary border-border-medium hover:border-brand-primary'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={analyzeFood}
                className="btn-primary w-full py-3"
              >
                Analyze Food
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ profile, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('scan');
  const [isCapturing, setIsCapturing] = useState(false);
  const [imageBlob, setImageBlob] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dailyStats, setDailyStats] = useState(null);
  const [foodEntries, setFoodEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDailyStats();
    loadFoodEntries();
  }, []);

  const loadDailyStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/daily-stats/${profile.id}/${today}`);
      setDailyStats(response.data);
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  };

  const loadFoodEntries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${API}/food-entries/${profile.id}?date_filter=${today}`);
      setFoodEntries(response.data);
    } catch (error) {
      console.error('Error loading food entries:', error);
    }
  };

  const handleImageCapture = (blob) => {
    setImageBlob(blob);
  };

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setImageBlob(null);
    loadDailyStats();
    loadFoodEntries();
  };

  const startFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setImageBlob(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Header */}
      <div className="bg-bg-card border-b border-border-light">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="heading-3">Welcome back, {profile.name}!</h1>
              <p className="body-small text-text-secondary">
                Daily target: {Math.round(profile.daily_calorie_target)} calories
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="btn-secondary px-4 py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Daily Stats */}
      {dailyStats && (
        <div className="container mx-auto px-6 py-6">
          <div className="bg-bg-card rounded-12 p-6 border border-border-light mb-6">
            <h2 className="heading-4 mb-4">Today's Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-primary">
                  {Math.round(dailyStats.calories_consumed)}
                </div>
                <div className="body-small text-text-secondary">Consumed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(dailyStats.calories_burned)}
                </div>
                <div className="body-small text-text-secondary">Burned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(dailyStats.remaining_calories)}
                </div>
                <div className="body-small text-text-secondary">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {dailyStats.meals_logged}
                </div>
                <div className="body-small text-text-secondary">Meals</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="container mx-auto px-6">
        <div className="flex space-x-1 bg-bg-section rounded-8 p-1 mb-6">
          {[
            { id: 'scan', label: 'Scan Food' },
            { id: 'diary', label: 'Food Diary' },
            { id: 'recipes', label: 'Recipes' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-8 transition-all ${
                activeTab === tab.id
                  ? 'bg-bg-card shadow-sm text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            <div className="bg-bg-card rounded-12 p-8 border border-border-light text-center">
              <h2 className="heading-3 mb-4">Analyze Your Food</h2>
              <p className="body-medium text-text-secondary mb-6">
                Take a photo or upload an image of your meal to get instant nutritional analysis
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setIsCapturing(true)}
                  className="btn-primary px-6 py-3"
                >
                  📸 Take Photo
                </button>
                <button
                  onClick={startFileUpload}
                  className="btn-secondary px-6 py-3"
                >
                  📁 Upload Image
                </button>
              </div>
            </div>

            {analysisResult && (
              <div className="bg-bg-card rounded-12 p-6 border border-border-light">
                <h3 className="heading-4 mb-4">Analysis Result</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-text-primary">
                      {analysisResult.food_entry.meal_name}
                    </h4>
                    <p className="body-small text-text-secondary">
                      {analysisResult.food_entry.serving_size}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-lg font-bold text-brand-primary">
                        {Math.round(analysisResult.food_entry.calories_per_serving)}
                      </div>
                      <div className="body-small text-text-secondary">Calories</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {Math.round(analysisResult.food_entry.protein_g)}g
                      </div>
                      <div className="body-small text-text-secondary">Protein</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">
                        {Math.round(analysisResult.food_entry.carbs_g)}g
                      </div>
                      <div className="body-small text-text-secondary">Carbs</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">
                        {Math.round(analysisResult.food_entry.fat_g)}g
                      </div>
                      <div className="body-small text-text-secondary">Fat</div>
                    </div>
                  </div>

                  {analysisResult.ingredient_substitutions.length > 0 && (
                    <div>
                      <h5 className="font-medium text-text-primary mb-2">
                        Ingredient Substitutions for Western Stores:
                      </h5>
                      <div className="space-y-2">
                        {analysisResult.ingredient_substitutions.map((sub, index) => (
                          <div key={index} className="bg-bg-section p-3 rounded-8">
                            <div className="font-medium">{sub.original} → {sub.western_substitute}</div>
                            <div className="body-small text-text-secondary">{sub.notes}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResult.quick_recipe_tips && (
                    <div>
                      <h5 className="font-medium text-text-primary mb-2">Quick Recipe Tips:</h5>
                      <p className="body-small text-text-secondary bg-bg-section p-3 rounded-8">
                        {analysisResult.quick_recipe_tips}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diary' && (
          <div className="space-y-4">
            <h2 className="heading-3">Today's Food Diary</h2>
            {foodEntries.length === 0 ? (
              <div className="bg-bg-card rounded-12 p-8 border border-border-light text-center">
                <p className="body-medium text-text-secondary">
                  No meals logged today. Start by scanning some food!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {foodEntries.map((entry) => (
                  <div key={entry.id} className="bg-bg-card rounded-12 p-6 border border-border-light">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-text-primary">{entry.meal_name}</h4>
                        <p className="body-small text-text-secondary">
                          {entry.meal_type.charAt(0).toUpperCase() + entry.meal_type.slice(1)} • {entry.serving_size}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-brand-primary">
                          {Math.round(entry.calories_per_serving)} cal
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="font-medium">{Math.round(entry.protein_g)}g</div>
                        <div className="body-small text-text-secondary">Protein</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(entry.carbs_g)}g</div>
                        <div className="body-small text-text-secondary">Carbs</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(entry.fat_g)}g</div>
                        <div className="body-small text-text-secondary">Fat</div>
                      </div>
                      <div>
                        <div className="font-medium">{Math.round(entry.fiber_g)}g</div>
                        <div className="body-small text-text-secondary">Fiber</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <div className="bg-bg-card rounded-12 p-8 border border-border-light text-center">
              <h2 className="heading-3 mb-4">Recipe Suggestions</h2>
              <p className="body-medium text-text-secondary mb-6">
                Coming soon! We'll suggest healthy South Asian recipes adapted for your local ingredients.
              </p>
              <div className="bg-bg-section p-6 rounded-8">
                <h4 className="font-medium text-text-primary mb-2">Featured: Quick Dal Recipe</h4>
                <p className="body-small text-text-secondary">
                  Traditional dal made in 15 minutes using split red lentils (available at most Western grocery stores). 
                  Perfect for busy students and working professionals!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      <CameraCapture
        onImageCapture={handleImageCapture}
        isCapturing={isCapturing}
        setIsCapturing={setIsCapturing}
        onClose={() => setIsCapturing(false)}
      />

      {/* Analysis Modal */}
      {imageBlob && (
        <FoodAnalysis
          imageBlob={imageBlob}
          onAnalysisComplete={handleAnalysisComplete}
          userId={profile.id}
        />
      )}
    </div>
  );
};

function App() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has a profile saved locally
    const savedProfile = localStorage.getItem('fitspice_profile');
    if (savedProfile) {
      setCurrentProfile(JSON.parse(savedProfile));
    }
    setLoading(false);
  }, []);

  const handleProfileCreated = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('fitspice_profile', JSON.stringify(profile));
  };

  const handleSignOut = () => {
    setCurrentProfile(null);
    localStorage.removeItem('fitspice_profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="body-medium text-text-secondary">Loading FitSpice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {!currentProfile ? (
        <ProfileSetup onProfileCreated={handleProfileCreated} />
      ) : (
        <Dashboard profile={currentProfile} onSignOut={handleSignOut} />
      )}
    </div>
  );
}

export default App;