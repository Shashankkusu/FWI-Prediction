from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import json

app = Flask(__name__)

# Global variables to store models
model = None
scaler = None

# Threshold configuration
THRESHOLD = 6.0

def load_models():
    """Load both scaler and model"""
    global model, scaler
    try:
        with open('scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)
        print("Scaler loaded successfully")
        
        with open('ridge_model.pkl', 'rb') as f:
            model = pickle.load(f)
        print("Model loaded successfully")
        
        print(f"Threshold set to: {THRESHOLD}")
        return True
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

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
        'threshold': THRESHOLD
    })

if __name__ == '__main__':
    # Load models on startup
    load_models()
    app.run(debug=True, port=5000)