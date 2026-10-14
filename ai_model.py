"""
Optional AI price-prediction service.
Install: pip install flask scikit-learn
Run: python ai_model.py
This small example trains on synthetic demonstration data; replace with real rental data for meaningful predictions.
"""
from flask import Flask, request, jsonify
from sklearn.ensemble import RandomForestRegressor
import numpy as np

app = Flask(__name__)
types = {"Scooter": 0, "Bike": 1, "Car": 2, "SUV": 3}
X, y = [], []
base = [450, 800, 1600, 2600]
for t in range(4):
    for age in range(0, 16):
        for demand in range(3):
            price = base[t] * max(0.6, 1 - age * 0.035) * [0.85, 1.0, 1.2][demand]
            X.append([t, age, demand])
            y.append(round(price / 50) * 50)
model = RandomForestRegressor(n_estimators=80, random_state=42)
model.fit(np.array(X), np.array(y))

@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "demo-ml-price-predictor"})

@app.post("/predict")
def predict():
    data = request.get_json(silent=True) or {}
    vehicle_type = data.get("type", "Bike")
    if vehicle_type not in types:
        return jsonify({"message": "Unknown vehicle type"}), 400
    age = max(0, min(30, int(data.get("age", 3))))
    demand_name = data.get("demand", "medium")
    demand = {"low": 0, "medium": 1, "high": 2}.get(demand_name)
    if demand is None:
        return jsonify({"message": "Demand must be low, medium, or high"}), 400
    price = int(round(float(model.predict([[types[vehicle_type], age, demand]])[0]) / 50) * 50)
    return jsonify({"estimatedDailyPrice": price, "currency": "INR", "method": "Random Forest trained on synthetic demo data"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)