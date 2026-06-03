"""
app_ui.py - 31阶谐波预测 Gradio UI 界面（支持自定义阶数）
功能：
  - 用户输入：频率、幅度、占空比、谐波阶数(1~31)
  - 输入9阶 → 只显示1/3/5/7/9次谐波，11~31次自动放弃
  - 显示：31阶谐波预测表格 + 8种可视化图表
"""

import gradio as gr
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy import signal
import os
import sys
import warnings
warnings.filterwarnings('ignore')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from predict_harmonics_final import HarmonicPredictor
from feature_extractor import HARMONIC_ORDERS

# 全局预测器
PREDICTOR = None

def get_predictor():
    global PREDICTOR
    if PREDICTOR is None:
        PREDICTOR = HarmonicPredictor()
    return PREDICTOR


def predict_and_visualize(freq, amplitude, duty_cycle, n_harmonics, duration, sampling_points):
    """执行预测并生成可视化 - 支持自定义阶数截取"""
    try:
        predictor = get_predictor()

        # 预测全部31阶
        predictions_all, sig, t, feature_dict = predictor.predict(
            freq=freq, amplitude=amplitude, duty_cycle=duty_cycle,
            sampling_points=sampling_points, duration=duration
        )

        # 截取用户指定的阶数
        n_harmonics = int(n_harmonics)
        # 确保是奇数且不超过31
        if n_harmonics > 31:
            n_harmonics = 31
        # 取小于等于n_harmonics的所有奇数次谐波
        selected_orders = [o for o in sorted(predictions_all.keys()) if o <= n_harmonics]

        # 构建截取后的predictions字典
        predictions = {o: predictions_all[o] for o in selected_orders}

        # 结果表格
        result_data = []
        for order in sorted(predictions.keys()):
            pred = predictions[order]['amp']
            theory = predictions[order]['theory']
            abs_err = abs(pred - theory)
            rel_err = (abs_err / theory * 100) if theory != 0 else 0
            result_data.append({
                '谐波阶数': f'{order}次',
                '频率(Hz)': f'{order*freq:.1f}',
                '预测幅度': f'{pred:.6f}',
                '理论幅度': f'{theory:.6f}',
                '绝对误差': f'{abs_err:.6f}',
                '相对误差(%)': f'{rel_err:.3f}',
                '状态': 'OK' if rel_err < 1 else '~' if rel_err < 3 else '!'
            })
        df = pd.DataFrame(result_data)

        # 生成可视化
        figures = predictor.generate_all_visualizations(
            predictions, t, sig, freq, amplitude, feature_dict, output_dir='ui_temp'
        )

        images = {}
        for name, path in figures.items():
            if os.path.exists(path):
                images[name] = path

        # 统计摘要
        pred_amps = [predictions[o]['amp'] for o in sorted(predictions.keys())]
        theory_amps = [predictions[o]['theory'] for o in sorted(predictions.keys())]
        abs_errors = [abs(p-t) for p,t in zip(pred_amps, theory_amps)]
        rel_errors = [abs(p-t)/t*100 if t!=0 else 0 for p,t in zip(pred_amps, theory_amps)]

        summary = f"""预测统计摘要:
{'='*50}
输入: 频率={freq}Hz, 幅度={amplitude}, 占空比={duty_cycle}
谐波阶数设置: {n_harmonics}阶 → 实际输出 {len(predictions)} 阶
(1~{n_harmonics}次奇次谐波, 11~31次自动放弃)
{'='*50}
平均绝对误差: {np.mean(abs_errors):.6f}
最大绝对误差: {np.max(abs_errors):.6f}
平均相对误差: {np.mean(rel_errors):.4f}%
最大相对误差: {np.max(rel_errors):.4f}%
误差<1%的阶数: {sum(1 for e in rel_errors if e < 1)}/{len(rel_errors)}
误差<3%的阶数: {sum(1 for e in rel_errors if e < 3)}/{len(rel_errors)}
{'='*50}"""

        # 特征信息
        feature_info = "特征信息:\n" + "-" * 40 + "\n"
        for name, value in feature_dict.items():
            feature_info += f"  {name:25s}: {value:.6f}\n"

        # 重建误差
        reconstructed = predictor.reconstruct(predictions, t, freq)
        error = sig[:len(reconstructed)] - reconstructed
        mae = np.mean(np.abs(error))
        rmse = np.sqrt(np.mean(error**2))
        recon_info = f"信号重建误差: MAE={mae:.6f}, RMSE={rmse:.6f}"

        return (
            df, summary, feature_info, recon_info,
            images.get('波形对比'),
            images.get('谐波频谱'),
            images.get('预测vs理论'),
            images.get('误差分析'),
            images.get('3D谐波分量'),
            images.get('重建过程'),
            images.get('特征信息'),
            images.get('综合仪表板')
        )

    except Exception as e:
        import traceback
        error_msg = f"错误: {str(e)}\n{traceback.format_exc()}"
        return None, error_msg, "", "", None, None, None, None, None, None, None, None


# ===================== Gradio UI =====================

with gr.Blocks(title="31阶谐波预测系统") as demo:
    gr.Markdown("""
    # 31阶谐波预测系统
    ### 基于机器学习的理想方波谐波分析 - 输入参数获取谐波预测
    ### 支持1~31阶，输入9阶则只显示到9阶，后面自动放弃
    """)

    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("### 输入参数")

            freq_input = gr.Number(
                label="频率 (Hz)", value=50, minimum=1, maximum=1000, step=1
            )
            amp_input = gr.Slider(
                label="幅度", minimum=0.1, maximum=10.0, value=1.0, step=0.1
            )
            duty_input = gr.Slider(
                label="占空比", minimum=0.1, maximum=0.9, value=0.5, step=0.05
            )
            # 新增：谐波阶数选择
            n_harmonics_input = gr.Slider(
                label="谐波阶数 (1~31, 奇数)",
                minimum=1, maximum=31, value=31, step=2
            )
            duration_input = gr.Slider(
                label="持续时间(周期)", minimum=0.5, maximum=5.0, value=2.0, step=0.5
            )
            sampling_input = gr.Slider(
                label="每周期采样点", minimum=100, maximum=2000, value=1000, step=100
            )

            predict_btn = gr.Button("开始预测", variant="primary", size="lg")

        with gr.Column(scale=2):
            gr.Markdown("### 预测结果表格")
            result_table = gr.Dataframe(
                headers=['谐波阶数', '频率(Hz)', '预测幅度', '理论幅度', '绝对误差', '相对误差(%)', '状态'],
                interactive=False
            )

    with gr.Tab("综合仪表板"):
        dashboard_img = gr.Image(label="综合仪表板")
    with gr.Tab("波形对比"):
        waveform_img = gr.Image(label="波形对比")
    with gr.Tab("谐波频谱"):
        spectrum_img = gr.Image(label="谐波频谱")
    with gr.Tab("预测vs理论"):
        scatter_img = gr.Image(label="预测vs理论")
    with gr.Tab("误差分析"):
        error_img = gr.Image(label="误差分析")
    with gr.Tab("3D谐波"):
        img_3d = gr.Image(label="3D谐波分量")
    with gr.Tab("重建过程"):
        recon_img = gr.Image(label="重建过程")
    with gr.Tab("特征信息"):
        feature_img = gr.Image(label="特征信息")

    with gr.Row():
        summary_text = gr.Textbox(label="统计摘要", lines=14)
        feature_text = gr.Textbox(label="特征信息", lines=14)

    recon_text = gr.Textbox(label="重建误差", lines=2)

    # 事件绑定
    predict_btn.click(
        fn=predict_and_visualize,
        inputs=[freq_input, amp_input, duty_input, n_harmonics_input,
                duration_input, sampling_input],
        outputs=[
            result_table, summary_text, feature_text, recon_text,
            waveform_img, spectrum_img, scatter_img, error_img,
            img_3d, recon_img, feature_img, dashboard_img
        ]
    )


if __name__ == "__main__":
    print("=" * 70)
    print("启动 31阶谐波预测 UI 系统")
    print("访问地址: http://localhost:7860")
    print("=" * 70)
    demo.launch(server_name="127.0.0.1", server_port=7860, share=False, show_error=True)