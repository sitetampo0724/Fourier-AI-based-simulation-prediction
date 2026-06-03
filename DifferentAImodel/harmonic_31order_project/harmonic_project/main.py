"""
main.py - 31阶谐波模型训练主程序
训练流程：
  1. 生成5000个样本的训练数据
  2. 训练Gradient Boosting多输出回归模型
  3. 评估模型性能（整体 + 各阶谐波）
  4. 保存模型和可视化结果
"""

import warnings
warnings.filterwarnings('ignore')
import os

from model_trainer import generate_training_data, train_and_evaluate_model, save_model, plot_training_results
from feature_extractor import CORE_FEATURE_NAMES, HARMONIC_ORDERS


def main():
    print("=" * 70)
    print("=== 理想方波 31阶谐波分析模型训练 ===")
    print("=" * 70)
    print(f"谐波阶数范围: {HARMONIC_ORDERS[0]} ~ {HARMONIC_ORDERS[-1]} (共 {len(HARMONIC_ORDERS)} 个奇次谐波)")
    print(f"特征维度: {len(CORE_FEATURE_NAMES)}")
    print(f"输出维度: {len(HARMONIC_ORDERS)} (每阶谐波的幅度)")
    print("=" * 70)

    # 设置样本数量
    n_samples = 5000  # 31阶需要更多数据

    # 生成训练数据
    X, y = generate_training_data(n_samples)

    # 准备标签名称
    label_names = [f'harmonic_{n}_amp' for n in HARMONIC_ORDERS]

    # 训练并评估模型
    pipeline, X_test, y_test, y_pred, per_harmonic_metrics = train_and_evaluate_model(
        X, y, CORE_FEATURE_NAMES, label_names
    )

    # 保存模型
    save_model(pipeline, CORE_FEATURE_NAMES, label_names)

    # 生成训练可视化
    print("\n生成训练可视化图表...")
    plot_training_results(y_test, y_pred, label_names, per_harmonic_metrics)

    print("\n" + "=" * 70)
    print("训练完成！")
    print("=" * 70)
    print("\n生成文件:")
    print("  - square_wave_model.pkl (模型)")
    print("  - square_wave_model_features.pkl (特征名称)")
    print("  - square_wave_model_labels.pkl (标签名称)")
    print("  - training_visualizations/training_r2_scores.png (R2分数图)")
    print("  - training_visualizations/training_scatter.png (散点图)")
    print("\n下一步: 运行 predict_harmonics_final.py 进行预测和可视化")
    print("=" * 70)


if __name__ == "__main__":
    main()
