"""
train_and_launch.py - 训练31阶模型并启动UI
"""
import sys
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from scipy import signal
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import RobustScaler
from sklearn.pipeline import Pipeline
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import warnings
warnings.filterwarnings('ignore')

from feature_extractor import HARMONIC_ORDERS, CORE_FEATURE_NAMES, extract_features_for_prediction

print("=" * 70)
print("训练31阶谐波预测模型")
print("=" * 70)

# 生成训练数据
n_samples = 200
print(f"\n生成 {n_samples} 个样本...")

all_features = []
all_labels = []

freqs = np.random.uniform(5, 300, n_samples)
amplitudes = np.random.uniform(0.1, 5.0, n_samples)
duty_cycles = np.random.uniform(0.45, 0.55, n_samples)

for i, (freq, amp, duty) in enumerate(zip(freqs, amplitudes, duty_cycles)):
    if i % 50 == 0:
        print(f"  进度: {i}/{n_samples}")

    T = 1 / freq
    fs = freq * 1000
    duration = 1.0
    t = np.linspace(0, T * duration, int(fs * duration), endpoint=False)
    square_wave = amp * signal.square(2 * np.pi * freq * t, duty=duty)

    feature_vector, _ = extract_features_for_prediction(square_wave, freq, amp, duty, 1000)
    all_features.append(feature_vector)

    labels = [4.0 * amp / (n * np.pi) for n in HARMONIC_ORDERS]
    all_labels.append(labels)

X = np.array(all_features)
y = np.array(all_labels)
print(f"数据生成完成: X={X.shape}, y={y.shape}")

# 训练模型
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

pipeline = Pipeline([
    ('scaler', RobustScaler()),
    ('model', MultiOutputRegressor(
        GradientBoostingRegressor(
            n_estimators=300, max_depth=5, learning_rate=0.1,
            random_state=42, min_samples_split=3, min_samples_leaf=2, subsample=0.9
        ),
        n_jobs=-1
    ))
])

print("\n训练模型...")
pipeline.fit(X_train, y_train)

y_pred = pipeline.predict(X_test)
r2 = r2_score(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mae = mean_absolute_error(y_test, y_pred)

print(f"\n评估结果:")
print(f"  R2 Score: {r2:.6f}")
print(f"  RMSE: {rmse:.6f}")
print(f"  MAE: {mae:.6f}")

# 保存模型
label_names = [f'harmonic_{n}_amp' for n in HARMONIC_ORDERS]
joblib.dump(pipeline, 'square_wave_model.pkl')
joblib.dump(CORE_FEATURE_NAMES, 'square_wave_model_features.pkl')
joblib.dump(label_names, 'square_wave_model_labels.pkl')

print("\n模型已保存！")
print(f"  - square_wave_model.pkl")
print(f"  - square_wave_model_features.pkl")
print(f"  - square_wave_model_labels.pkl")

# 启动UI
print("\n" + "=" * 70)
print("启动 UI 界面...")
print("=" * 70)

import app_ui
