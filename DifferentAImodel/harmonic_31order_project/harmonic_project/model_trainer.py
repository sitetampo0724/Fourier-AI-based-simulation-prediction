"""
model_trainer.py - 31阶谐波模型训练器
功能：
  1. 生成训练数据（频率和幅度随机组合）
  2. 训练Gradient Boosting多输出回归模型
  3. 交叉验证和模型评估
  4. 特征重要性分析
  5. 保存模型
"""

import numpy as np
import pandas as pd
from scipy import signal
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import RobustScaler
from sklearn.pipeline import Pipeline
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.inspection import permutation_importance
import joblib
import warnings
import os

warnings.filterwarnings('ignore')

from feature_extractor import extract_features_for_prediction, HARMONIC_ORDERS


def generate_training_data(n_samples=5000):
    """
    生成训练数据 - 使用与预测时完全一致的信号生成方式

    参数:
        n_samples: 样本数量（默认5000，31阶需要更多数据）
    """
    print("=" * 70)
    print(f"生成训练数据: {n_samples} 个样本")
    print(f"谐波阶数: {HARMONIC_ORDERS}")
    print(f"输出维度: {len(HARMONIC_ORDERS)} 个谐波幅度")
    print("=" * 70)

    all_features = []
    all_labels = []

    # 更广泛的频率和幅度范围
    freqs = np.random.uniform(5, 300, n_samples)
    amplitudes = np.random.uniform(0.1, 5.0, n_samples)
    duty_cycles = np.random.uniform(0.45, 0.55, n_samples)  # 占空比小范围变化

    for i, (freq, amp, duty) in enumerate(zip(freqs, amplitudes, duty_cycles)):
        if i % 500 == 0:
            print(f"  进度: {i}/{n_samples} ({i/n_samples*100:.1f}%)")

        T = 1 / freq
        fs = freq * 1000
        duration = 1.0
        t = np.linspace(0, T * duration, int(fs * duration), endpoint=False)
        square_wave = amp * signal.square(2 * np.pi * freq * t, duty=duty)

        feature_vector, _ = extract_features_for_prediction(
            square_wave, freq, amp, duty, 1000
        )
        all_features.append(feature_vector)

        labels = [4.0 * amp / (n * np.pi) for n in HARMONIC_ORDERS]
        all_labels.append(labels)

    X = np.array(all_features)
    y = np.array(all_labels)

    print(f"\n数据形状: X={X.shape}, y={y.shape}")
    print(f"特征数量: {X.shape[1]}")
    print(f"标签数量: {y.shape[1]} (对应 {len(HARMONIC_ORDERS)} 个谐波阶数)")
    print("=" * 70)
    return X, y


def train_and_evaluate_model(X, y, feature_names, label_names, test_size=0.2):
    """训练并评估模型 - 增强版"""
    print("\n" + "=" * 70)
    print("开始训练模型...")
    print("=" * 70)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )

    print(f"训练集: {X_train.shape}, 测试集: {X_test.shape}")
    print(f"标签: {len(label_names)} 个谐波幅度")


    pipeline = Pipeline([
        ('scaler', RobustScaler()),
        ('model', MultiOutputRegressor(
            GradientBoostingRegressor(
                n_estimators=800,
                max_depth=7,
                learning_rate=0.05,
                random_state=42,
                min_samples_split=3,
                min_samples_leaf=2,
                subsample=0.9,
                max_features='sqrt',
            ),
            n_jobs=-1
        ))
    ])

    print("\n模型配置:")
    print(f"  - 基学习器: GradientBoostingRegressor")
    print(f"  - 树数量: 800")
    print(f"  - 最大深度: 7")
    print(f"  - 学习率: 0.05")
    print(f"  - 输出维度: {len(label_names)}")

    print("\n交叉验证中...")
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='r2')
    print(f"CV R2: {np.mean(cv_scores):.4f} ± {np.std(cv_scores):.4f}")

    print("\n训练中...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)

    # 整体评估
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)

    print(f"\n{'='*70}")
    print(f"整体评估结果:")
    print(f"  R2 Score:  {r2:.6f}")
    print(f"  RMSE:      {rmse:.6f}")
    print(f"  MAE:       {mae:.6f}")

    # 各阶谐波单独评估
    print(f"\n各阶谐波评估:")
    print(f"{'谐波阶数':>8} {'R2':>10} {'RMSE':>10} {'MAE':>10}")
    print("-" * 45)

    per_harmonic_metrics = {}
    for j, label in enumerate(label_names):
        order = int(label.split('_')[1])
        r2_h = r2_score(y_test[:, j], y_pred[:, j])
        rmse_h = np.sqrt(mean_squared_error(y_test[:, j], y_pred[:, j]))
        mae_h = mean_absolute_error(y_test[:, j], y_pred[:, j])
        per_harmonic_metrics[order] = {'r2': r2_h, 'rmse': rmse_h, 'mae': mae_h}
        marker = "OK" if r2_h > 0.99 else "~" if r2_h > 0.95 else "!"
        print(f"{order:6d}th {r2_h:9.4f} {rmse_h:9.6f} {mae_h:9.6f} {marker}")

    print(f"{'='*70}")

    # 特征重要性
    print("\n计算特征重要性...")
    perm = permutation_importance(pipeline, X_test, y_test, n_repeats=10,
                                   random_state=42, n_jobs=-1)
    print(f"\n特征重要性 (permutation):")
    for idx in perm.importances_mean.argsort()[::-1]:
        print(f"  {feature_names[idx]:25s}: {perm.importances_mean[idx]:.4f} ± {perm.importances_std[idx]:.4f}")

    return pipeline, X_test, y_test, y_pred, per_harmonic_metrics


def save_model(pipeline, feature_names, label_names, path='square_wave_model'):
    """保存模型"""
    joblib.dump(pipeline, f'{path}.pkl')
    joblib.dump(feature_names, f'{path}_features.pkl')
    joblib.dump(label_names, f'{path}_labels.pkl')
    print(f"\n模型已保存:")
    print(f"  - 模型: {path}.pkl")
    print(f"  - 特征: {path}_features.pkl")
    print(f"  - 标签: {path}_labels.pkl")


def plot_training_results(y_test, y_pred, label_names, per_harmonic_metrics, output_dir='training_visualizations'):
    """绘制训练结果可视化"""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt

    os.makedirs(output_dir, exist_ok=True)

    # 1. 各阶谐波R2分数
    fig, ax = plt.subplots(figsize=(12, 6))
    orders = sorted(per_harmonic_metrics.keys())
    r2_scores = [per_harmonic_metrics[o]['r2'] for o in orders]
    colors = ['#2ecc71' if r > 0.99 else '#f39c12' if r > 0.95 else '#e74c3c' for r in r2_scores]

    ax.bar(range(len(orders)), r2_scores, color=colors, alpha=0.85, edgecolor='black', linewidth=0.5)
    ax.axhline(y=0.99, color='green', linestyle='--', alpha=0.7, label='R2=0.99')
    ax.axhline(y=0.95, color='orange', linestyle='--', alpha=0.7, label='R2=0.95')
    ax.set_xticks(range(len(orders)))
    ax.set_xticklabels([f'{o}次' for o in orders], fontsize=10)
    ax.set_xlabel('谐波阶数', fontsize=12)
    ax.set_ylabel('R2 Score', fontsize=12)
    ax.set_title('各阶谐波预测 R2 Score', fontsize=14, fontweight='bold')
    ax.legend(fontsize=10)
    ax.grid(True, alpha=0.3, axis='y')
    ax.set_ylim([min(r2_scores) * 0.95, 1.005])

    for i, v in enumerate(r2_scores):
        ax.text(i, v + 0.001, f'{v:.4f}', ha='center', fontsize=9)

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'training_r2_scores.png'), dpi=150, bbox_inches='tight')
    plt.close()

    # 2. 预测值 vs 真实值散点图
    fig, axes = plt.subplots(4, 4, figsize=(16, 16))
    axes = axes.flatten()

    for idx, (label, ax) in enumerate(zip(label_names, axes)):
        order = int(label.split('_')[1])
        y_true_col = y_test[:, idx]
        y_pred_col = y_pred[:, idx]

        ax.scatter(y_true_col, y_pred_col, alpha=0.5, s=20, edgecolors='none')
        max_val = max(y_true_col.max(), y_pred_col.max())
        ax.plot([0, max_val], [0, max_val], 'r--', linewidth=1.5, alpha=0.7)
        ax.set_xlabel('真实值', fontsize=9)
        ax.set_ylabel('预测值', fontsize=9)
        ax.set_title(f'{order}次谐波 R2={per_harmonic_metrics[order]["r2"]:.4f}', fontsize=10, fontweight='bold')
        ax.grid(True, alpha=0.3)

    plt.suptitle('各阶谐波: 预测值 vs 真实值', fontsize=16, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'training_scatter.png'), dpi=150, bbox_inches='tight')
    plt.close()

    print(f"训练可视化已保存到 {output_dir}/")
