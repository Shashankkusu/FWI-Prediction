# 🔥 Wildfire Prediction Analysis

## 📊 Project Overview
This project focuses on analyzing and preprocessing wildfire data to build a predictive model for classifying fire occurrences based on various meteorological and environmental factors.

## 🎯 Objectives
- Clean and preprocess wildfire dataset
- Handle missing values and data inconsistencies
- Prepare data for machine learning classification
- Explore relationships between fire weather indices and fire occurrences

## 📁 Dataset
The dataset contains meteorological and fire danger rating system variables:

### 🌡️ Meteorological Variables
- **Temperature** - Air temperature (°C)
- **RH** - Relative Humidity (%)
- **Ws** - Wind Speed (km/h or m/s)
- **Rain** - Rainfall amount (mm)

### 🔥 Fire Weather Indices (Canadian FWI System)
- **FFMC** - Fine Fuel Moisture Code
- **DMC** - Duff Moisture Code  
- **DC** - Drought Code
- **ISI** - Initial Spread Index
- **BUI** - Build Up Index
- **FWI** - Fire Weather Index

### 🏷️ Target Variable
- **Classes** - Binary classification:
  - `fire` 🔥 (encoded as 1)
  - `not fire` ❄️ (encoded as 0)

## 🛠️ Data Preprocessing Steps

### 1. 🔍 Data Quality Assessment
- Checked for missing values
- Identified column name inconsistencies with whitespace
- Analyzed class distribution imbalance

### 2. 🧹 Data Cleaning
- Stripped whitespace from column names
- Standardized "Classes" column values:
  - Converted to lowercase
  - Removed extra spaces
  - Mapped to binary values (fire: 1, not fire: 0)
- Dropped rows with invalid "nan" class values

### 3. 📈 Data Exploration
- Initial dataset shape analysis
- Class distribution visualization
- Feature correlation analysis

## 📊 Results
After preprocessing:
- **Total samples**: 364
- **Fire cases**: 215 (59%)
- **Non-fire cases**: 149 (41%)
- **No missing values** in any features

## 🚀 Next Steps
The cleaned dataset is now ready for:
- 🔬 Exploratory Data Analysis (EDA)
- 🤖 Machine Learning model training
- 📈 Feature importance analysis
- 🎯 Model evaluation and deployment

## 🛡️ Applications
This analysis can help:
- 🚒 Fire departments in early warning systems
- 🌲 Forest management agencies
- 🔬 Climate change researchers
- 🏞️ Park and wildlife management

## 💻 Technologies Used
- Python 🐍
- Pandas 📊
- NumPy 🔢
- Data visualization libraries

---

*This preprocessing pipeline ensures high-quality data for building accurate wildfire prediction models!* 🌟
