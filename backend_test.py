#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for FitSpice App
Tests all backend APIs including profile creation, food analysis, data retrieval, and database operations.
"""

import requests
import json
import base64
import os
from datetime import datetime, date
from io import BytesIO
from PIL import Image
import time

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BACKEND_URL = get_backend_url()
if not BACKEND_URL:
    print("ERROR: Could not get backend URL from frontend/.env")
    exit(1)

API_BASE = f"{BACKEND_URL}/api"
print(f"Testing backend at: {API_BASE}")

class FitSpiceAPITester:
    def __init__(self):
        self.test_user_id = None
        self.test_profile_id = None
        self.test_results = {
            "profile_creation": {"status": "pending", "details": ""},
            "food_analysis": {"status": "pending", "details": ""},
            "data_retrieval": {"status": "pending", "details": ""},
            "database_operations": {"status": "pending", "details": ""},
            "error_handling": {"status": "pending", "details": ""}
        }
        
    def create_test_image(self):
        """Create a test food image for analysis"""
        try:
            # Create a simple test image that looks like food
            img = Image.new('RGB', (400, 300), color='orange')
            # Add some visual elements to make it look more like food
            from PIL import ImageDraw
            draw = ImageDraw.Draw(img)
            draw.ellipse([50, 50, 350, 250], fill='brown', outline='black', width=3)
            draw.ellipse([100, 100, 200, 150], fill='yellow')
            draw.ellipse([250, 120, 320, 180], fill='red')
            
            # Convert to base64
            buffer = BytesIO()
            img.save(buffer, format='JPEG')
            img_data = buffer.getvalue()
            return img_data
        except Exception as e:
            print(f"Error creating test image: {e}")
            return None

    def test_profile_creation(self):
        """Test Profile Creation API (POST /api/profile)"""
        print("\n=== Testing Profile Creation API ===")
        
        try:
            # Test data for a realistic user profile
            profile_data = {
                "name": "Priya Sharma",
                "age": 28,
                "gender": "female",
                "height_cm": 165.0,
                "weight_kg": 62.0,
                "activity_level": "moderately_active",
                "goal": "lose_weight",
                "goal_weight_kg": 58.0
            }
            
            print(f"Sending POST request to {API_BASE}/profile")
            print(f"Profile data: {json.dumps(profile_data, indent=2)}")
            
            response = requests.post(f"{API_BASE}/profile", json=profile_data, timeout=30)
            
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                profile_response = response.json()
                print(f"Profile created successfully: {json.dumps(profile_response, indent=2, default=str)}")
                
                # Store user ID for other tests
                self.test_user_id = profile_response.get('id')
                self.test_profile_id = profile_response.get('id')
                
                # Verify BMR and calorie calculations
                expected_bmr = 10 * 62.0 + 6.25 * 165.0 - 5 * 28 - 161  # Female formula
                expected_maintenance = expected_bmr * 1.55  # moderately_active
                expected_target = expected_maintenance - 500  # lose_weight
                
                actual_target = profile_response.get('daily_calorie_target', 0)
                
                print(f"Expected BMR: {expected_bmr:.2f}")
                print(f"Expected maintenance calories: {expected_maintenance:.2f}")
                print(f"Expected target calories: {expected_target:.2f}")
                print(f"Actual target calories: {actual_target:.2f}")
                
                if abs(actual_target - expected_target) < 10:  # Allow small rounding differences
                    self.test_results["profile_creation"]["status"] = "passed"
                    self.test_results["profile_creation"]["details"] = f"Profile created successfully with correct calorie calculation. Target: {actual_target:.2f} calories/day"
                else:
                    self.test_results["profile_creation"]["status"] = "failed"
                    self.test_results["profile_creation"]["details"] = f"Calorie calculation incorrect. Expected: {expected_target:.2f}, Got: {actual_target:.2f}"
                    
            else:
                error_text = response.text
                print(f"Profile creation failed: {error_text}")
                self.test_results["profile_creation"]["status"] = "failed"
                self.test_results["profile_creation"]["details"] = f"HTTP {response.status_code}: {error_text}"
                
        except Exception as e:
            print(f"Exception during profile creation test: {str(e)}")
            self.test_results["profile_creation"]["status"] = "failed"
            self.test_results["profile_creation"]["details"] = f"Exception: {str(e)}"

    def test_profile_retrieval(self):
        """Test getting user profile by ID"""
        if not self.test_profile_id:
            print("Skipping profile retrieval test - no profile ID available")
            return
            
        print(f"\n=== Testing Profile Retrieval API ===")
        
        try:
            print(f"Sending GET request to {API_BASE}/profile/{self.test_profile_id}")
            response = requests.get(f"{API_BASE}/profile/{self.test_profile_id}", timeout=30)
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                profile_data = response.json()
                print(f"Profile retrieved successfully: {json.dumps(profile_data, indent=2, default=str)}")
                return True
            else:
                print(f"Profile retrieval failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"Exception during profile retrieval test: {str(e)}")
            return False

    def test_food_analysis(self):
        """Test Food Analysis API (POST /api/analyze-food)"""
        print("\n=== Testing Food Analysis API ===")
        
        if not self.test_user_id:
            print("Skipping food analysis test - no user ID available")
            self.test_results["food_analysis"]["status"] = "skipped"
            self.test_results["food_analysis"]["details"] = "No user ID available from profile creation"
            return
            
        try:
            # Create test image
            img_data = self.create_test_image()
            if not img_data:
                self.test_results["food_analysis"]["status"] = "failed"
                self.test_results["food_analysis"]["details"] = "Could not create test image"
                return
                
            print(f"Created test image of size: {len(img_data)} bytes")
            
            # Prepare multipart form data
            files = {
                'file': ('test_food.jpg', img_data, 'image/jpeg')
            }
            data = {
                'user_id': self.test_user_id,
                'meal_type': 'lunch'
            }
            
            print(f"Sending POST request to {API_BASE}/analyze-food")
            print(f"Form data: {data}")
            
            response = requests.post(f"{API_BASE}/analyze-food", files=files, data=data, timeout=60)
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                analysis_response = response.json()
                print(f"Food analysis successful: {json.dumps(analysis_response, indent=2, default=str)}")
                
                # Verify response structure
                food_entry = analysis_response.get('food_entry', {})
                required_fields = ['meal_name', 'ingredients', 'calories_per_serving', 'protein_g', 'carbs_g', 'fat_g']
                
                missing_fields = [field for field in required_fields if field not in food_entry]
                
                if not missing_fields:
                    self.test_results["food_analysis"]["status"] = "passed"
                    self.test_results["food_analysis"]["details"] = f"Food analysis completed successfully. Meal: {food_entry.get('meal_name')}, Calories: {food_entry.get('calories_per_serving')}"
                else:
                    self.test_results["food_analysis"]["status"] = "failed"
                    self.test_results["food_analysis"]["details"] = f"Missing required fields in response: {missing_fields}"
                    
            else:
                error_text = response.text
                print(f"Food analysis failed: {error_text}")
                self.test_results["food_analysis"]["status"] = "failed"
                self.test_results["food_analysis"]["details"] = f"HTTP {response.status_code}: {error_text}"
                
        except Exception as e:
            print(f"Exception during food analysis test: {str(e)}")
            self.test_results["food_analysis"]["status"] = "failed"
            self.test_results["food_analysis"]["details"] = f"Exception: {str(e)}"

    def test_data_retrieval(self):
        """Test Data Retrieval APIs"""
        print("\n=== Testing Data Retrieval APIs ===")
        
        if not self.test_user_id:
            print("Skipping data retrieval tests - no user ID available")
            self.test_results["data_retrieval"]["status"] = "skipped"
            self.test_results["data_retrieval"]["details"] = "No user ID available"
            return
            
        try:
            results = []
            
            # Test 1: Get food entries for user
            print(f"Testing GET {API_BASE}/food-entries/{self.test_user_id}")
            response = requests.get(f"{API_BASE}/food-entries/{self.test_user_id}", timeout=30)
            print(f"Food entries response status: {response.status_code}")
            
            if response.status_code == 200:
                food_entries = response.json()
                print(f"Retrieved {len(food_entries)} food entries")
                results.append(f"Food entries retrieval: SUCCESS ({len(food_entries)} entries)")
            else:
                print(f"Food entries retrieval failed: {response.text}")
                results.append(f"Food entries retrieval: FAILED - {response.status_code}")
            
            # Test 2: Get daily stats
            today_str = date.today().strftime("%Y-%m-%d")
            print(f"Testing GET {API_BASE}/daily-stats/{self.test_user_id}/{today_str}")
            response = requests.get(f"{API_BASE}/daily-stats/{self.test_user_id}/{today_str}", timeout=30)
            print(f"Daily stats response status: {response.status_code}")
            
            if response.status_code == 200:
                daily_stats = response.json()
                print(f"Daily stats: {json.dumps(daily_stats, indent=2)}")
                results.append(f"Daily stats retrieval: SUCCESS")
            else:
                print(f"Daily stats retrieval failed: {response.text}")
                results.append(f"Daily stats retrieval: FAILED - {response.status_code}")
            
            # Test 3: Get ingredient substitutions
            print(f"Testing GET {API_BASE}/ingredient-substitutions/garam masala")
            response = requests.get(f"{API_BASE}/ingredient-substitutions/garam masala", timeout=30)
            print(f"Ingredient substitutions response status: {response.status_code}")
            
            if response.status_code == 200:
                substitution = response.json()
                print(f"Substitution: {json.dumps(substitution, indent=2)}")
                results.append(f"Ingredient substitutions: SUCCESS")
            else:
                print(f"Ingredient substitutions failed: {response.text}")
                results.append(f"Ingredient substitutions: FAILED - {response.status_code}")
            
            # Determine overall status
            failed_tests = [r for r in results if "FAILED" in r]
            if not failed_tests:
                self.test_results["data_retrieval"]["status"] = "passed"
                self.test_results["data_retrieval"]["details"] = "; ".join(results)
            else:
                self.test_results["data_retrieval"]["status"] = "failed"
                self.test_results["data_retrieval"]["details"] = "; ".join(results)
                
        except Exception as e:
            print(f"Exception during data retrieval tests: {str(e)}")
            self.test_results["data_retrieval"]["status"] = "failed"
            self.test_results["data_retrieval"]["details"] = f"Exception: {str(e)}"

    def test_database_operations(self):
        """Test Database Operations"""
        print("\n=== Testing Database Operations ===")
        
        try:
            # Test database connectivity by creating and retrieving a profile
            if self.test_profile_id and self.test_profile_retrieval():
                self.test_results["database_operations"]["status"] = "passed"
                self.test_results["database_operations"]["details"] = "Database connectivity and operations working correctly"
            else:
                self.test_results["database_operations"]["status"] = "failed"
                self.test_results["database_operations"]["details"] = "Database operations failed - could not retrieve created profile"
                
        except Exception as e:
            print(f"Exception during database operations test: {str(e)}")
            self.test_results["database_operations"]["status"] = "failed"
            self.test_results["database_operations"]["details"] = f"Exception: {str(e)}"

    def test_error_handling(self):
        """Test Error Handling"""
        print("\n=== Testing Error Handling ===")
        
        try:
            results = []
            
            # Test 1: Invalid profile data
            print("Testing invalid profile data...")
            invalid_profile = {"name": "Test", "age": -5}  # Invalid age
            response = requests.post(f"{API_BASE}/profile", json=invalid_profile, timeout=30)
            if response.status_code >= 400:
                results.append("Invalid profile validation: SUCCESS")
            else:
                results.append("Invalid profile validation: FAILED - should have rejected invalid data")
            
            # Test 2: Non-existent profile retrieval
            print("Testing non-existent profile retrieval...")
            response = requests.get(f"{API_BASE}/profile/non-existent-id", timeout=30)
            if response.status_code == 404:
                results.append("Non-existent profile handling: SUCCESS")
            else:
                results.append(f"Non-existent profile handling: FAILED - got {response.status_code} instead of 404")
            
            # Test 3: Invalid date format in daily stats
            print("Testing invalid date format...")
            response = requests.get(f"{API_BASE}/daily-stats/test-user/invalid-date", timeout=30)
            if response.status_code >= 400:
                results.append("Invalid date format handling: SUCCESS")
            else:
                results.append("Invalid date format handling: FAILED - should have rejected invalid date")
            
            # Determine overall status
            failed_tests = [r for r in results if "FAILED" in r]
            if not failed_tests:
                self.test_results["error_handling"]["status"] = "passed"
                self.test_results["error_handling"]["details"] = "; ".join(results)
            else:
                self.test_results["error_handling"]["status"] = "failed"
                self.test_results["error_handling"]["details"] = "; ".join(results)
                
        except Exception as e:
            print(f"Exception during error handling tests: {str(e)}")
            self.test_results["error_handling"]["status"] = "failed"
            self.test_results["error_handling"]["details"] = f"Exception: {str(e)}"

    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("FITSPICE BACKEND API COMPREHENSIVE TESTING")
        print("=" * 60)
        
        # Run tests in order
        self.test_profile_creation()
        self.test_food_analysis()
        self.test_data_retrieval()
        self.test_database_operations()
        self.test_error_handling()
        
        # Print summary
        print("\n" + "=" * 60)
        print("TEST RESULTS SUMMARY")
        print("=" * 60)
        
        for test_name, result in self.test_results.items():
            status_symbol = "✅" if result["status"] == "passed" else "❌" if result["status"] == "failed" else "⏭️"
            print(f"{status_symbol} {test_name.replace('_', ' ').title()}: {result['status'].upper()}")
            if result["details"]:
                print(f"   Details: {result['details']}")
        
        # Overall assessment
        passed_tests = sum(1 for r in self.test_results.values() if r["status"] == "passed")
        failed_tests = sum(1 for r in self.test_results.values() if r["status"] == "failed")
        skipped_tests = sum(1 for r in self.test_results.values() if r["status"] == "skipped")
        
        print(f"\nOverall Results: {passed_tests} passed, {failed_tests} failed, {skipped_tests} skipped")
        
        return self.test_results

if __name__ == "__main__":
    tester = FitSpiceAPITester()
    results = tester.run_all_tests()