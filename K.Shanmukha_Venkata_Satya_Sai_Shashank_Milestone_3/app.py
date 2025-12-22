from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import json
import os
import google.generativeai as genai



app = Flask(__name__)

# Global variables to store models
model = None
scaler = None
gemini_client = None  # New: Gemini client

# Threshold configuration
THRESHOLD = 6.0

# Gemini API Configuration
GEMINI_API_KEY = ('******************')
GEMINI_MODEL = "gemini-2.5-pro"  # You can use "gemini-2.0-flash" for faster responses[citation:1]

# System prompt for FWI chatbot[citation:10]
FWI_SYSTEM_PROMPT = """You are an expert assistant specialized in Fire Weather Index (FWI) and wildfire risk assessment. 
Your knowledge should focus exclusively on:

1. **FWI Components & Calculations**:
   - FFMC (Fine Fuel Moisture Code): moisture content of litter and other cured fine fuels
   - DMC (Duff Moisture Code): moisture content of loosely compacted organic layers
   - DC (Drought Code): moisture content of deep, compact organic layers
   - ISI (Initial Spread Index): expected fire spread rate
   - BUI (Build-Up Index): total fuel available for combustion
   - FWI (Fire Weather Index): overall fire intensity potential

2. **FWI Interpretation**:
   - FWI < 11.2: Low fire danger
   - 11.2 ≤ FWI < 21.3: Moderate fire danger
   - 21.3 ≤ FWI < 38.0: High fire danger
   - 38.0 ≤ FWI < 50.0: Very high fire danger
   - 50.0 ≤ FWI < 70.0: Extreme fire danger
   - FWI ≥ 70: Very extreme fire danger[citation:3]

3. **Related Concepts**:
   - Weather factors affecting FWI (temperature, relative humidity, wind speed, rain)
   - Fire behavior prediction
   - Wildfire prevention and safety measures
   - Risk assessment methodologies[citation:3][citation:8]

**IMPORTANT RULES**:
- ONLY answer questions related to FWI, wildfire risk, fire weather, or fire safety
- If asked about unrelated topics, politely decline and redirect to FWI topics
- Provide accurate, scientifically-grounded information
- Cite standard FWI classification ranges when discussing risk levels
- If uncertain, acknowledge the limitation of your knowledge

Begin by introducing yourself as an FWI specialist assistant."""

def load_models():
    """Load both scaler, model, and initialize Gemini client"""
    global model, scaler, gemini_client
    
    try:
        # Load existing models
        with open('scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)
        print("Scaler loaded successfully")
        
        with open('ridge_model.pkl', 'rb') as f:
            model = pickle.load(f)
        print("Model loaded successfully")
        
        # Initialize Gemini client[citation:1][citation:4]
        if GEMINI_API_KEY:
            gemini_client = genai.Client(api_key=GEMINI_API_KEY)
            print("Gemini client initialized successfully")
        else:
            print("Warning: GEMINI_API_KEY not found in environment variables")
            gemini_client = None
        
        print(f"Threshold set to: {THRESHOLD}")
        return True
        
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

def get_gemini_response(user_message, chat_history=None):
    """Get response from Gemini API with FWI-specific context"""
    if not gemini_client:
        return "Error: Gemini API is not configured. Please check your API key."
    
    try:
        # Prepare the conversation history with system prompt[citation:2]
        contents = []
        
        # Add system prompt as first message[citation:10]
        contents.append({
            "role": "user",
            "parts": [{"text": FWI_SYSTEM_PROMPT}]
        })
        
        # Add initial model acknowledgment
        contents.append({
            "role": "model",
            "parts": [{"text": "I am an expert assistant specialized in Fire Weather Index (FWI) and wildfire risk assessment. I can help you understand FWI components, calculations, risk levels, and related fire weather concepts. How can I assist you with FWI today?"}]
        })
        
        # Add chat history if provided (for multi-turn conversations)[citation:2]
        if chat_history:
            for msg in chat_history[-6:]:  # Keep last 6 messages for context
                role = "user" if msg.get("is_user") else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg.get("text", "")}]
                })
        
        # Add current user message
        contents.append({
            "role": "user",
            "parts": [{"text": user_message}]
        })
        
        # Call Gemini API[citation:4]
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents
        )
        
        return response.text
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"Error getting response from AI assistant: {str(e)}"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None or scaler is None:
            if not load_models():
                return jsonify({
                    'success': False,
                    'error': 'Models not found or cannot be loaded'
                })
        
        # Get data from form
        data = request.json
        
        # Extract features in the correct order (9 features)
        features = [
            float(data['temperature']),
            float(data['rh']),
            float(data['ws']),
            float(data['rain']),
            float(data['ffmc']),
            float(data['dmc']),
            float(data['dc']),
            float(data['isi']),
            float(data['bui'])
        ]
        
        # Convert to numpy array and reshape
        features_array = np.array(features).reshape(1, -1)
        
        # Scale features
        scaled_features = scaler.transform(features_array)
        
        # Make prediction
        prediction = model.predict(scaled_features)
        
        # Get FWI score
        fwi_score = float(prediction[0])
        
        # Determine risk level based on threshold (6+ = high risk)
        if fwi_score >= THRESHOLD:
            risk_level = "HIGH RISK"
            risk_color = "#FF4444"
            risk_category = "danger"
            risk_icon = "fas fa-exclamation-triangle"
        else:
            risk_level = "SAFE"
            risk_color = "#44FF88"
            risk_category = "safe"
            risk_icon = "fas fa-check-circle"
        
        return jsonify({
            'success': True,
            'fwi_score': round(fwi_score, 2),
            'risk_level': risk_level,
            'risk_color': risk_color,
            'risk_category': risk_category,
            'risk_icon': risk_icon,
            'threshold': THRESHOLD,
            'is_high_risk': fwi_score >= THRESHOLD
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/chat', methods=['POST'])
def chat():
    """Chat endpoint for FWI-related questions using Gemini API"""
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({
                'success': False,
                'error': 'Message cannot be empty'
            })
        
        # Get chat history if provided[citation:2]
        chat_history = data.get('history', [])
        
        # Get response from Gemini
        response = get_gemini_response(user_message, chat_history)
        
        return jsonify({
            'success': True,
            'response': response,
            'history': chat_history + [
                {'is_user': True, 'text': user_message},
                {'is_user': False, 'text': response}
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/reset_chat', methods=['POST'])
def reset_chat():
    """Reset chat history"""
    return jsonify({
        'success': True,
        'message': 'Chat history reset'
    })

@app.route('/sample_data')
def sample_data():
    """Return sample data for quick testing"""
    samples = [
        {
            'temperature': 35,
            'rh': 34,
            'ws': 17,
            'rain': 0.0,
            'ffmc': 92.2,
            'dmc': 23.6,
            'dc': 97.3,
            'isi': 13.8,
            'bui': 29.4
        },
        {
            'temperature': 28,
            'rh': 67,
            'ws': 19,
            'rain': 0,
            'ffmc': 75.4,
            'dmc': 2.9,
            'dc': 16.3,
            'isi': 2,
            'bui': 4
        },
        {
            'temperature': 39,
            'rh': 39,
            'ws': 15,
            'rain': 0.2,
            'ffmc': 89.3,
            'dmc': 15.8,
            'dc': 35.4,
            'isi': 8.2,
            'bui': 15.8
        },
        {
            'temperature': 32,
            'rh': 55,
            'ws': 14,
            'rain': 0,
            'ffmc': 86.2,
            'dmc': 8.3,
            'dc': 18.4,
            'isi': 5,
            'bui': 8.2
        },
        {
            'temperature': 37,
            'rh': 55,
            'ws': 15,
            'rain': 0,
            'ffmc': 89.3,
            'dmc': 28.3,
            'dc': 67.2,
            'isi': 8.3,
            'bui': 28.3
        }
    ]
    return jsonify(samples)

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None,
        'gemini_configured': gemini_client is not None,
        'threshold': THRESHOLD
    })

if __name__ == '__main__':
    # Load models on startup
    load_models()

    app.run(debug=True, port=5000)
