# **Wildfire Prediction Analysis: Data Cleaning and Model Training**

## **Project Overview**
This project focuses on analyzing and preprocessing wildfire data to build a predictive model for classifying fire occurrences based on various meteorological and environmental factors using the **Canadian Forest Fire Weather Index System (CFFWIS)**.

The goal is to develop a reliable machine learning model that can predict forest fire occurrences based on weather and fuel moisture indicators.

---

## **📂 Dataset Description**
The dataset contains meteorological and fire danger rating system variables:

### **🌡️ Meteorological Variables**
- **Temperature** – Air temperature (°C)
- **RH** – Relative Humidity (%)
- **Ws** – Wind Speed (km/h or m/s)
- **Rain** – Rainfall amount (mm)

### **🔥 Fire Weather Indices (CFFWIS)**
- **FFMC** – Fine Fuel Moisture Code (fast-drying surface fuels)
- **DMC** – Duff Moisture Code (upper layer of compact organic material)
- **DC** – Drought Code (deep soil moisture)
- **ISI** – Initial Spread Index (fire spread rate)
- **BUI** – Build Up Index (available fuel based on deeper moisture)
- **FWI** – Fire Weather Index (final fire intensity score)

### **🏷️ Target Variable**
- **Classes** – Binary classification:
  - `fire` 🔥 → encoded as `1`
  - `not fire` ❄️ → encoded as `0`

---

## **Task 1: Data Preprocessing and Cleaning**

### **1. 🔍 Initial Data Assessment**
- Loaded the dataset `merged_data.csv` using `pandas`.
- Checked for missing values using `df.isnull().sum()`:
  - Found **2 missing values** in the `Classes` column.
- Identified inconsistencies in column names (extra whitespace in `Classes  `).

### **2. 🧹 Data Cleaning Steps**
- **Column Name Standardization:**
  ```python
  df.columns = df.columns.str.strip()
  ```
- **Class Value Standardization:**
  - Converted `Classes` values to lowercase.
  - Removed extra spaces.
  - Replaced `"fire"` with `1` and `"not fire"` with `0`.
- **Handling Missing Values:**
  - Dropped rows where `Classes` was `"nan"` (2 rows removed).

### **3. 📊 Final Cleaned Dataset**
- **Total Samples:** 364
- **Fire Cases:** 215 (59%)
- **Non-Fire Cases:** 149 (41%)
- **No missing values** in any feature columns.

**Cleaned Data Sample:**
| day | month | year | Temperature | RH | Ws | Rain | FFMC | DMC | DC | ISI | BUI | FWI | Classes |
|-----|-------|------|-------------|----|----|------|------|-----|----|-----|-----|-----|---------|
| 1   | 6     | 2012 | 32          | 71 | 12 | 0.7  | 57.1 | 2.5 | 8.2 | 0.6 | 2.8 | 0.2 | 0       |

---

## **Task 1.5: Exploratory Data Analysis (EDA) and Visualization**

### **1. 📈 Histogram Analysis**
Histograms were plotted for all numerical features to:
- **Show distribution** of values across the dataset.
- **Check for class imbalance** in the target variable.
- **Identify outliers or skewed distributions**.

**Key Insights:**
- The dataset shows a **moderate class imbalance** (59% fire vs. 41% non-fire).
- Features like `FFMC`, `DMC`, and `DC` show **right-skewed distributions**, indicating higher moisture variability.
- `Temperature` and `RH` are **normally distributed**, suggesting stable weather conditions in the dataset.

### **2. 🔥 Fire vs. Non-Fire Distribution**
- Fire cases are **more frequent** in the dataset.
- This imbalance was considered during **model training** to avoid bias.

### **3. 🌡️ Feature Correlation Analysis**
- **Positive Correlations:**
  - `FFMC` ↔ `ISI` (fine fuel moisture affects fire spread).
  - `DMC` ↔ `DC` (deeper moisture levels are related).
- **Negative Correlations:**
  - `RH` ↔ `Temperature` (typical meteorological inverse relationship).
  - `Rain` ↔ `FWI` (rain reduces fire risk).

### **4. 📊 Visualization Libraries Used**
- **Matplotlib** & **Seaborn** for plotting.
- **Histograms, Boxplots, and Heatmaps** for multi-dimensional analysis.

---

## **Task 2: Feature Scaling and Regression Modeling**

### **1. 🔧 Feature Scaling**
Before training regression models, **feature scaling** was applied to ensure all features contribute equally to the model:

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

**Why Feature Scaling?**
- Prevents features with larger ranges from dominating the model
- Improves convergence speed for gradient-based algorithms
- Essential for regularization methods (Lasso, Ridge, Elastic Net)

### **2. 🤖 Regression Models Implemented**

Four regression models were trained and compared to predict the **Fire Weather Index (FWI)**:

#### **A. Linear Regression**
- **Description:** Basic linear model that finds the best-fitting linear relationship
- **Strengths:** Simple, interpretable, no hyperparameters
- **Results:** 
  - MAE: 0.7749
  - MSE: 2.7456
  - R²: 0.9416
  - **Performance:** Good baseline but may overfit

#### **B. Lasso Regression (L1 Regularization)**
- **Description:** Linear regression with L1 penalty that can shrink coefficients to zero
- **Strengths:** Performs feature selection automatically
- **Results:**
  - MAE: 0.7781
  - MSE: 2.6990
  - R²: 0.9426
  - **Performance:** Slight improvement over Linear Regression

#### **C. Ridge Regression (L2 Regularization)**
- **Description:** Linear regression with L2 penalty that shrinks coefficients but doesn't eliminate them
- **Strengths:** Handles multicollinearity well, more stable than standard regression
- **Results:**
  - MAE: 0.8638
  - MSE: 2.6308
  - R²: 0.9440
  - **Performance:** Best overall model with lowest error metrics

#### **D. Elastic Net Regression (L1 + L2)**
- **Description:** Combines L1 and L2 regularization penalties
- **Strengths:** Balances feature selection and coefficient shrinkage
- **Results:**
  - MAE: 0.8480
  - MSE: 2.6092
  - R²: 0.9445
  - **Performance:** Competitive but shows slight overfitting

---

# 📊 Regression Model Comparison Metrics

| Model                 |  MAE |  MSE |  RMSE |  R² | Explained Variance |
|-----------------------|----------|----------|-----------|---------|------------------|
| Linear Regression     | 0.7749   | 2.7456   | 1.6569    | 0.9416  | 0.9421           |
| Lasso Regression      | 0.7781   | 2.6990   | 1.6429    | 0.9426  | 0.9433           |
| Ridge Regression      | 0.8638   | 2.6308   | 1.6220    | 0.9440  | 0.9449           |
| Elastic Net           | 0.8480   | 2.6092   | 1.6153    | 0.9445  | 0.9454           |
---
# 🔥 Quick Interpretation

- **Ridge Regression is the clear winner** — it delivers the strongest overall performance with the lowest MSE/RMSE and the highest R².
- **Linear Regression** is close behind but slightly less stable than Ridge.
- **Lasso and Elastic Net show overfitting**, indicating their L1 or mixed regularization doesn't suit the dataset’s feature patterns.
- **Conclusion:**  
  **Use Ridge Regression.**  
  It provides the most stable, generalizable, and reliable predictions for this dataset.
---
---

## **🔥 Model Performance Interpretation**

### **📈 Key Findings:**

1. **Ridge Regression is the Winner** 🏆
   - Lowest **MSE (2.6308)** and **RMSE (1.6220)**
   - Highest **R² (0.9440)** and **Explained Variance (0.9449)**
   - Best balance between bias and variance

2. **Regularization Improves Performance**
   - All regularized models outperformed plain Linear Regression
   - Ridge provides the most stable and generalizable predictions

3. **Overfitting Indications**
   - Lasso and Elastic Net show slight overfitting tendencies
   - Linear Regression, while simple, is surprisingly competitive

4. **Feature Importance**
   - Regularization reveals which features contribute most to FWI prediction
   - Meteorological variables show strong predictive power

### **🎯 Recommendation:**
**Use Ridge Regression** for this wildfire prediction task because:
- ✅ Most stable and reliable predictions
- ✅ Best generalization to new data
- ✅ Handles multicollinearity in weather features
- ✅ Balanced error metrics across all evaluation criteria

---

## **🔧 Technologies Used**
- **Python** 🐍
- **Pandas** & **NumPy** for data manipulation
- **Matplotlib** & **Seaborn** for visualization
- **Scikit-learn** for machine learning algorithms
- **Jupyter Notebook** for interactive analysis

---

## **🚀 Next Steps & Future Work**
1. **Model Deployment** – Implement Ridge Regression in a production environment
2. **Real-time Prediction** – Create API for live fire risk assessment
3. **Feature Engineering** – Add temporal and spatial features
4. **Ensemble Methods** – Combine multiple models for improved accuracy
5. **Explainable AI** – Use SHAP/LIME to interpret model predictions

---

## **🛡️ Applications**
This analysis supports:
- **🚒 Early Warning Systems** for fire departments
- **🌲 Forest Management & Conservation** agencies
- **🔬 Climate Change Impact Studies** and research
- **🏞️ Park & Wildlife Risk Assessment** and planning
- **🏘️ Community Safety** and evacuation planning

---

## **🌟 Conclusion**
The project successfully:
1. **Cleaned and preprocessed** wildfire data with proper handling of missing values and inconsistencies
2. **Explored relationships** between fire weather indices and meteorological variables
3. **Implemented and compared** multiple regression models
4. **Identified Ridge Regression** as the optimal model for FWI prediction
5. **Provided actionable insights** for wildfire risk assessment and management

The developed model achieves **94.4% explained variance** in predicting the Fire Weather Index, making it a reliable tool for forest fire prediction and prevention.

---

