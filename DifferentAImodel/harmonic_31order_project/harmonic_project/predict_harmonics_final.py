import numpy as np
import joblib
import warnings
from scipy import signal
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import os

plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['font.size'] = 10
warnings.filterwarnings('ignore')

from feature_extractor import HARMONIC_ORDERS, extract_features_for_prediction


class HarmonicPredictor:
    """31-order Harmonic Predictor - Full Visualization Version"""

    def __init__(self, model_path='square_wave_model.pkl',
                 features_path='square_wave_model_features.pkl',
                 labels_path='square_wave_model_labels.pkl'):
        print("=" * 70)
        print("=== Ideal Square Wave 31-order Harmonic Prediction System ===")
        print("=" * 70)

        self.pipeline = joblib.load(model_path)
        self.feature_names = joblib.load(features_path)
        self.label_names = joblib.load(labels_path)
        self.n_harmonics = len(self.label_names)
        print(f"[OK] Model loaded successfully: {len(self.feature_names)} features, {self.n_harmonics} harmonic labels")
        print(f"[INFO] Supported harmonic orders: {HARMONIC_ORDERS}")

    def predict(self, freq, amplitude, duty_cycle=0.5, sampling_points=1000, duration=1.0):
        """Predict harmonic amplitudes"""
        print(f"\nInput parameters: Frequency={freq}Hz, Amplitude={amplitude}, Duty Cycle={duty_cycle}")

        T = 1 / freq
        t = np.linspace(0, T * duration, int(freq * sampling_points * duration), endpoint=False)
        square_wave = amplitude * signal.square(2 * np.pi * freq * t, duty=duty_cycle)

        fv, feature_dict = extract_features_for_prediction(square_wave, freq, amplitude, duty_cycle, sampling_points)
        y_pred = self.pipeline.predict(fv.reshape(1, -1))[0]

        predictions = {}
        for i, label in enumerate(self.label_names):
            order = int(label.split('_')[1])
            predictions[order] = {
                'amp': y_pred[i],
                'theory': 4.0 * amplitude / (order * np.pi),
                'freq': order * freq
            }

        return predictions, square_wave, t, feature_dict

    def display_predictions(self, predictions, freq, amplitude):
        """Print prediction results table"""
        print(f"\n{'='*75}")
        print(f"Prediction Results (Fundamental freq {freq:.1f} Hz, Amplitude {amplitude:.2f})")
        print(f"{'Order':>8} {'Frequency(Hz)':>10} {'Predicted':>12} {'Theoretical':>12} {'Abs Error':>10} {'Rel Error%':>8} {'Status':>4}")
        print("-" * 75)

        for order in sorted(predictions.keys()):
            pred = predictions[order]['amp']
            theory = predictions[order]['theory']
            abs_err = abs(pred - theory)
            rel_err = (abs_err / theory * 100) if theory != 0 else 0
            status = "OK" if rel_err < 1 else "~" if rel_err < 3 else "!"
            print(f"{order:6d}th {order*freq:9.1f} {pred:11.6f} {theory:11.6f} {abs_err:9.6f} {rel_err:7.3f}% {status:>3}")
        print(f"{'='*75}")

    def reconstruct(self, predictions, t, freq):
        """Reconstruct signal using sin functions"""
        rec = np.zeros_like(t)
        for order in sorted(predictions.keys()):
            rec += predictions[order]['amp'] * np.sin(2 * np.pi * order * freq * t)
        return rec

    def generate_all_visualizations(self, predictions, t, original, freq, amplitude, feature_dict, output_dir='visualizations'):
        """Generate all visualization charts"""
        os.makedirs(output_dir, exist_ok=True)
        figures = {}

        # 1. Waveform comparison
        fig_path = os.path.join(output_dir, '01_waveform_comparison.png')
        self._plot_waveform_comparison(predictions, t, original, freq, amplitude, fig_path)
        figures['Waveform Comparison'] = fig_path

        # 2. Harmonic spectrum
        fig_path = os.path.join(output_dir, '02_harmonic_spectrum.png')
        self._plot_harmonic_spectrum(predictions, freq, amplitude, fig_path)
        figures['Harmonic Spectrum'] = fig_path

        # 3. Prediction vs theory
        fig_path = os.path.join(output_dir, '03_prediction_vs_theory.png')
        self._plot_prediction_vs_theory(predictions, fig_path)
        figures['Prediction vs Theory'] = fig_path

        # 4. Error analysis
        fig_path = os.path.join(output_dir, '04_error_analysis.png')
        self._plot_error_analysis(predictions, fig_path)
        figures['Error Analysis'] = fig_path

        # 5. 3D harmonic components
        fig_path = os.path.join(output_dir, '05_3d_harmonics.png')
        self._plot_3d_harmonics(predictions, t, freq, fig_path)
        figures['3D Harmonic Components'] = fig_path

        # 6. Signal reconstruction process
        fig_path = os.path.join(output_dir, '06_reconstruction_process.png')
        self._plot_reconstruction_process(predictions, t, freq, amplitude, fig_path)
        figures['Reconstruction Process'] = fig_path

        # 7. Feature information
        fig_path = os.path.join(output_dir, '07_feature_info.png')
        self._plot_feature_info(feature_dict, fig_path)
        figures['Feature Information'] = fig_path

        # 8. Comprehensive dashboard
        fig_path = os.path.join(output_dir, '08_dashboard.png')
        self._plot_dashboard(predictions, t, original, freq, amplitude, feature_dict, fig_path)
        figures['Comprehensive Dashboard'] = fig_path

        return figures

    def _plot_waveform_comparison(self, predictions, t, original, freq, amplitude, save_path):
        """Original square wave vs reconstructed signal comparison"""
        reconstructed = self.reconstruct(predictions, t, freq)

        fig, axes = plt.subplots(2, 1, figsize=(14, 10))

        # Limit to 2 cycles
        T = 1 / freq
        mask = t <= 2 * T

        # Top: waveform comparison
        ax = axes[0]
        ax.plot(t[mask], original[mask], 'b-', lw=2.5, label='Original Square Wave', alpha=0.8)
        ax.plot(t[mask], reconstructed[mask], 'r--', lw=1.8, label=f'Reconstructed Signal ({len(predictions)} harmonics)')
        ax.fill_between(t[mask], original[mask], reconstructed[mask], alpha=0.15, color='green', label='Error Region')
        ax.set_title(f'Original vs Reconstructed Signal (Freq: {freq}Hz, Amplitude: {amplitude})', fontsize=14, fontweight='bold')
        ax.set_xlabel('Time (s)')
        ax.set_ylabel('Amplitude')
        ax.legend(fontsize=11, loc='upper right')
        ax.grid(True, alpha=0.3)
        ax.axhline(y=0, color='k', linewidth=0.5)

        # Bottom: error
        ax = axes[1]
        error = original[mask] - reconstructed[mask]
        ax.plot(t[mask], error, 'g-', lw=1.2, label=f'Reconstruction Error (MAE={np.mean(np.abs(error)):.6f})')
        ax.fill_between(t[mask], error, 0, alpha=0.2, color='green')
        ax.set_title('Reconstruction Error', fontsize=14, fontweight='bold')
        ax.set_xlabel('Time (s)')
        ax.set_ylabel('Error')
        ax.legend(fontsize=11)
        ax.grid(True, alpha=0.3)
        ax.axhline(y=0, color='k', linewidth=0.5)

        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()

    def _plot_harmonic_spectrum(self, predictions, freq, amplitude, save_path):
        """Harmonic spectrum - predicted vs theoretical values"""
        fig, axes = plt.subplots(2, 1, figsize=(14, 10))

        orders = sorted(predictions.keys())
        pred_amps = [predictions[o]['amp'] for o in orders]
        theory_amps = [predictions[o]['theory'] for o in orders]
        freqs = [predictions[o]['freq'] for o in orders]

        # Top: amplitude spectrum
        ax = axes[0]
        x = np.arange(len(orders))
        width = 0.35
        bars1 = ax.bar(x - width/2, pred_amps, width, label='Predicted', color='#2E86AB', alpha=0.85, edgecolor='black', linewidth=0.5)
        bars2 = ax.bar(x + width/2, theory_amps, width, label='Theoretical', color='#E94F37', alpha=0.85, edgecolor='black', linewidth=0.5)

        ax.set_title(f'Harmonic Amplitude Spectrum - Predicted vs Theoretical (Fundamental: {freq}Hz)', fontsize=14, fontweight='bold')
        ax.set_xlabel('Harmonic Order')
        ax.set_ylabel('Amplitude')
        ax.set_xticks(x)
        ax.set_xticklabels([f'{o}f\n({o*freq:.1f}Hz)' for o in orders], fontsize=8)
        ax.legend(fontsize=11)
        ax.grid(True, alpha=0.3, axis='y')

        # Add value labels on bars
        for bar, val in zip(bars1, pred_amps):
            if val > 0.01:
                ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.005, f'{val:.3f}',
                       ha='center', va='bottom', fontsize=7, rotation=90)

        # Bottom: semi-log plot
        ax = axes[1]
        ax.semilogy(x, pred_amps, 'o-', color='#2E86AB', linewidth=2, markersize=8, label='Predicted')
        ax.semilogy(x, theory_amps, 's--', color='#E94F37', linewidth=2, markersize=8, label='Theoretical 4A/(nπ)')

        # Add theoretical decay reference line
        n_ref = np.array(orders)
        theory_ref = 4.0 * amplitude / (n_ref * np.pi)
        ax.semilogy(x, theory_ref, 'k:', linewidth=1.5, alpha=0.5, label='Theoretical decay 1/n')

        ax.set_title('Harmonic Amplitude Decay Curve (Semi-log)', fontsize=14, fontweight='bold')
        ax.set_xlabel('Harmonic Order')
        ax.set_ylabel('Amplitude (log)')
        ax.set_xticks(x)
        ax.set_xticklabels([f'{o}' for o in orders], fontsize=9)
        ax.legend(fontsize=11)
        ax.grid(True, alpha=0.3, which='both')

        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()

    def _plot_prediction_vs_theory(self, predictions, save_path):
        """Predicted vs theoretical values scatter plot"""
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))

        orders = sorted(predictions.keys())
        pred_amps = [predictions[o]['amp'] for o in orders]
        theory_amps = [predictions[o]['theory'] for o in orders]

        # Left: scatter comparison
        ax = axes[0]
        colors = plt.cm.viridis(np.linspace(0, 1, len(orders)))
        for i, (p, t, o) in enumerate(zip(pred_amps, theory_amps, orders)):
            ax.scatter(t, p, s=150, c=[colors[i]], edgecolors='black', linewidth=0.5, zorder=5)
            ax.annotate(f'{o}th', (t, p), textcoords="offset points", xytext=(8, 5), fontsize=9)

        max_val = max(max(pred_amps), max(theory_amps)) * 1.1
        ax.plot([0, max_val], [0, max_val], 'k--', linewidth=1.5, alpha=0.5, label='y=x (Ideal)')
        ax.set_xlim(0, max_val)
        ax.set_ylim(0, max_val)
        ax.set_xlabel('Theoretical Amplitude', fontsize=12)
        ax.set_ylabel('Predicted Amplitude', fontsize=12)
        ax.set_title('Predicted vs Theoretical', fontsize=14, fontweight='bold')
        ax.legend(fontsize=11)
        ax.grid(True, alpha=0.3)
        ax.set_aspect('equal')

        # Right: residuals
        ax = axes[1]
        residuals = [p - t for p, t in zip(pred_amps, theory_amps)]
        colors_bar = ['#2E86AB' if r >= 0 else '#E94F37' for r in residuals]
        bars = ax.bar(range(len(orders)), residuals, color=colors_bar, alpha=0.8, edgecolor='black', linewidth=0.5)
        ax.axhline(y=0, color='k', linewidth=1)
        ax.set_xticks(range(len(orders)))
        ax.set_xticklabels([f'{o}th' for o in orders], fontsize=9, rotation=45)
        ax.set_xlabel('Harmonic Order', fontsize=12)
        ax.set_ylabel('Residual (Predicted - Theoretical)', fontsize=12)
        ax.set_title('Prediction Residual Analysis', fontsize=14, fontweight='bold')
        ax.grid(True, alpha=0.3, axis='y')

        # Add value labels
        for bar, val in zip(bars, residuals):
            offset = 0.001 if val >= 0 else -0.003
            ax.text(bar.get_x() + bar.get_width()/2, val + offset, f'{val:.4f}',
                   ha='center', va='bottom' if val >= 0 else 'top', fontsize=7)

        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()

    def _plot_error_analysis(self, predictions, save_path):
        """Error analysis plot"""
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))

        orders = sorted(predictions.keys())
        pred_amps = [predictions[o]['amp'] for o in orders]
        theory_amps = [predictions[o]['theory'] for o in orders]

        abs_errors = [abs(p - t) for p, t in zip(pred_amps, theory_amps)]
        rel_errors = [abs(p - t) / t * 100 if t != 0 else 0 for p, t in zip(pred_amps, theory_amps)]

        # 1. Absolute error bar chart
        ax = axes[0, 0]
        colors = plt.cm.Reds(np.linspace(0.3, 1, len(orders)))
        ax.bar(range(len(orders)), abs_errors, color=colors, alpha=0.85, edgecolor='black', linewidth=0.5)
        ax.set_xticks(range(len(orders)))
        ax.set_xticklabels([f'{o}th' for o in orders], fontsize=9, rotation=45)
        ax.set_xlabel('Harmonic Order')
        ax.set_ylabel('Absolute Error')
        ax.set_title('Absolute Error by Harmonic Order', fontsize=12, fontweight='bold')
        ax.grid(True, alpha=0.3, axis='y')
        for i, v in enumerate(abs_errors):
            ax.text(i, v + max(abs_errors)*0.01, f'{v:.4f}', ha='center', fontsize=8)

        # 2. Relative error percentage
        ax = axes[0, 1]
        colors = plt.cm.RdYlGn_r(np.linspace(0.2, 0.8, len(orders)))
        bars = ax.bar(range(len(orders)), rel_errors, color=colors, alpha=0.85, edgecolor='black', linewidth=0.5)
        ax.axhline(y=1, color='green', linestyle='--', linewidth=1.5, alpha=0.7, label='1% threshold')
        ax.axhline(y=3, color='orange', linestyle='--', linewidth=1.5, alpha=0.7, label='3% threshold')
        ax.set_xticks(range(len(orders)))
        ax.set_xticklabels([f'{o}th' for o in orders], fontsize=9, rotation=45)
        ax.set_xlabel('Harmonic Order')
        ax.set_ylabel('Relative Error (%)')
        ax.set_title('Relative Error Percentage by Harmonic Order', fontsize=12, fontweight='bold')
        ax.legend(fontsize=9)
        ax.grid(True, alpha=0.3, axis='y')

        # 3. Cumulative error distribution
        ax = axes[1, 0]
        sorted_rel_errors = np.sort(rel_errors)
        cumulative = np.arange(1, len(sorted_rel_errors) + 1) / len(sorted_rel_errors) * 100
        ax.plot(sorted_rel_errors, cumulative, 'o-', color='#2E86AB', linewidth=2, markersize=8)
        ax.axvline(x=1, color='green', linestyle='--', linewidth=1.5, alpha=0.7)
        ax.axvline(x=3, color='orange', linestyle='--', linewidth=1.5, alpha=0.7)
        ax.fill_between(sorted_rel_errors, cumulative, alpha=0.15, color='#2E86AB')
        ax.set_xlabel('Relative Error (%)')
        ax.set_ylabel('Cumulative Percentage (%)')
        ax.set_title('Error Cumulative Distribution', fontsize=12, fontweight='bold')
        ax.grid(True, alpha=0.3)

        # 4. Error statistics summary
        ax = axes[1, 1]
        ax.axis('off')

        stats_text = f"""
╔══════════════════════════════════════════╗
║         Error Statistics Summary         ║
╠══════════════════════════════════════════╣
  ║  Total Harmonics:        {len(orders):>15}      ║
║  Mean Absolute Error:    {np.mean(abs_errors):>15.6f}  ║
║  Max Absolute Error:     {np.max(abs_errors):>15.6f}  ║
║  Min Absolute Error:     {np.min(abs_errors):>15.6f}  ║
║  Mean Relative Error:    {np.mean(rel_errors):>14.2f}% ║
║  Max Relative Error:     {np.max(rel_errors):>14.2f}% ║
║  Orders with Error<1%:   {sum(1 for e in rel_errors if e < 1):>15}        ║
║  Orders with Error<3%:   {sum(1 for e in rel_errors if e < 3):>15}        ║
╚══════════════════════════════════════════╝
        """
        ax.text(0.5, 0.5, stats_text, transform=ax.transAxes, fontsize=12,
                verticalalignment='center', horizontalalignment='center',
                fontfamily='monospace',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()

    def _plot_3d_harmonics(self, predictions, t, freq, save_path):
        """3D harmonic components visualization"""
        from mpl_toolkits.mplot3d import Axes3D

        fig = plt.figure(figsize=(16, 10))
        ax = fig.add_subplot(111, projection='3d')

        orders = sorted(predictions.keys())
        T = 1 / freq
        mask = t <= 2 * T
        t_vis = t[mask]

        colors = plt.cm.tab20(np.linspace(0, 1, len(orders)))

        for i, order in enumerate(orders):
            amp = predictions[order]['amp']
            wave = amp * np.sin(2 * np.pi * order * freq * t_vis)
            z_offset = order
            ax.plot(t_vis, wave, z_offset, color=colors[i], alpha=0.8, linewidth=1.2,
                   label=f'{order}th harmonic ({order*freq:.1f}Hz)')

        max_order = max(orders)

        # Reconstructed signal
        reconstructed = self.reconstruct(predictions, t, freq)
        ax.plot(t_vis, reconstructed[mask], max_order + 2, 'k-', linewidth=2.5, label='Reconstructed Signal')

        ax.set_xlabel('Time (s)', fontsize=11, labelpad=10)
        ax.set_ylabel('Amplitude', fontsize=11, labelpad=10)
        ax.set_zlabel('Harmonic Order', fontsize=11, labelpad=10)
        ax.set_title(f'3D Harmonic Components Decomposition (Fundamental: {freq}Hz)', fontsize=14, fontweight='bold', pad=20)
        ax.view_init(elev=25, azim=-50)
        ax.legend(loc='upper left', fontsize=8, bbox_to_anchor=(1.05, 1))

        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()

    def _plot_reconstruction_process(self, predictions, t, freq, amplitude, save_path):
        """Show signal progressive reconstruction process"""
        fig, axes = plt.subplots(4, 4, figsize=(18, 14))
        axes = axes.flatten()

        orders = sorted(predictions.keys())
        T = 1 / freq
        mask = t <= 2 * T
        t_vis = t[mask]

        cumulative = np.zeros_like(t_vis)

        for idx, (ax, order) in enumerate(zip(axes, orders)):
            amp = predictions[order]['amp']
            wave = amp * np.sin(2 * np.pi * order * freq * t_vis)
            cumulative = cumulative + wave

            ax.plot(t_vis, wave, color='#2E86AB', linewidth=1.2, alpha=0.7, label=f'{order}th harmonic')
            ax.plot(t_vis, cumulative, 'r--', linewidth=1.5, alpha=0.8, label=f'Cumulative up to {order}th')
            ax.set_title(f'{order}th Harmonic (A={amp:.4f}, f={order*freq:.1f}Hz)', fontsize=10, fontweight='bold')
            ax.grid(True, alpha=0.3)
            ax.set_xlabel('Time (s)', fontsize=8)
            ax.set_ylabel('Amplitude', fontsize=8)
            if idx == 0:
                ax.legend(fontsize=7, loc='upper right')

        plt.suptitle(f'Signal Progressive Reconstruction Process (Fundamental: {freq}Hz, Amplitude: {amplitude})', fontsize=16, fontweight='bold', y=1.02)
        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()

    def _plot_feature_info(self, feature_dict, save_path):
        """Feature information visualization"""
        fig, axes = plt.subplots(1, 2, figsize=(14, 6))

        # Left: feature value bar chart
        ax = axes[0]
        names = list(feature_dict.keys())
        values = list(feature_dict.values())

        colors = plt.cm.Set3(np.linspace(0, 1, len(names)))
        bars = ax.barh(range(len(names)), values, color=colors, alpha=0.85, edgecolor='black', linewidth=0.5)
        ax.set_yticks(range(len(names)))
        ax.set_yticklabels(names, fontsize=10)
        ax.set_xlabel('Feature Value')
        ax.set_title('Input Feature Values', fontsize=14, fontweight='bold')
        ax.grid(True, alpha=0.3, axis='x')

        for bar, val in zip(bars, values):
            ax.text(val + max(values)*0.01 if max(values) > 0 else val + 0.01, bar.get_y() + bar.get_height()/2,
                   f'{val:.4f}', va='center', fontsize=9)

        # Right: feature value table
        ax = axes[1]
        ax.axis('off')

        table_data = [[name, f'{val:.6f}'] for name, val in zip(names, values)]
        table = ax.table(cellText=table_data, colLabels=['Feature Name', 'Feature Value'],
                        cellLoc='left', loc='center', bbox=[0, 0, 1, 1])
        table.auto_set_font_size(False)
        table.set_fontsize(10)
        table.scale(1, 1.8)

        for (row, col), cell in table.get_celld().items():
            if row == 0:
                cell.set_facecolor('#4A90E2')
                cell.set_text_props(weight='bold', color='white')
            else:
                cell.set_facecolor('#F0F0F0' if row % 2 == 0 else 'white')

        ax.set_title('Feature Details', fontsize=14, fontweight='bold', pad=20)

        plt.tight_layout()
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()

    def _plot_dashboard(self, predictions, t, original, freq, amplitude, feature_dict, save_path):
        """Comprehensive dashboard"""
        fig = plt.figure(figsize=(20, 14))
        gs = fig.add_gridspec(3, 3, hspace=0.35, wspace=0.3)

        orders = sorted(predictions.keys())
        pred_amps = [predictions[o]['amp'] for o in orders]
        theory_amps = [predictions[o]['theory'] for o in orders]
        reconstructed = self.reconstruct(predictions, t, freq)

        T = 1 / freq
        mask = t <= 2 * T

        # 1. Waveform comparison (top left)
        ax1 = fig.add_subplot(gs[0, :2])
        ax1.plot(t[mask], original[mask], 'b-', lw=2, label='Original Square Wave', alpha=0.8)
        ax1.plot(t[mask], reconstructed[mask], 'r--', lw=1.5, label='Reconstructed Signal')
        ax1.set_title(f'Waveform Comparison (freq={freq}Hz, amp={amplitude})', fontsize=12, fontweight='bold')
        ax1.set_xlabel('Time (s)')
        ax1.set_ylabel('Amplitude')
        ax1.legend(fontsize=9)
        ax1.grid(True, alpha=0.3)

        # 2. Spectrum (top right)
        ax2 = fig.add_subplot(gs[0, 2])
        x = np.arange(len(orders))
        ax2.bar(x, pred_amps, color='#2E86AB', alpha=0.8, label='Predicted')
        ax2.bar(x, theory_amps, color='#E94F37', alpha=0.5, label='Theoretical')
        ax2.set_title('Spectrum Comparison', fontsize=12, fontweight='bold')
        ax2.set_xlabel('Harmonic Order')
        ax2.set_ylabel('Amplitude')
        ax2.set_xticks(x[::2])
        ax2.set_xticklabels([f'{orders[i]}' for i in range(0, len(orders), 2)], fontsize=8)
        ax2.legend(fontsize=8)
        ax2.grid(True, alpha=0.3, axis='y')

        # 3. Error analysis (middle left)
        ax3 = fig.add_subplot(gs[1, 0])
        rel_errors = [abs(p - t) / t * 100 if t != 0 else 0 for p, t in zip(pred_amps, theory_amps)]
        colors = ['#2ecc71' if e < 1 else '#f39c12' if e < 3 else '#e74c3c' for e in rel_errors]
        ax3.bar(range(len(orders)), rel_errors, color=colors, alpha=0.85)
        ax3.axhline(y=1, color='green', linestyle='--', alpha=0.7)
        ax3.axhline(y=3, color='orange', linestyle='--', alpha=0.7)
        ax3.set_title('Relative Error (%)', fontsize=12, fontweight='bold')
        ax3.set_xlabel('Harmonic Order')
        ax3.set_ylabel('Relative Error %')
        ax3.set_xticks(range(len(orders)))
        ax3.set_xticklabels([f'{o}' for o in orders], fontsize=7, rotation=45)
        ax3.grid(True, alpha=0.3, axis='y')

        # 4. Decay curve (middle middle)
        ax4 = fig.add_subplot(gs[1, 1])
        ax4.semilogy(orders, pred_amps, 'o-', color='#2E86AB', linewidth=2, markersize=6, label='Predicted')
        ax4.semilogy(orders, theory_amps, 's--', color='#E94F37', linewidth=2, markersize=6, label='Theoretical')
        ax4.set_title('Decay Curve (log)', fontsize=12, fontweight='bold')
        ax4.set_xlabel('Harmonic Order')
        ax4.set_ylabel('Amplitude (log)')
        ax4.legend(fontsize=9)
        ax4.grid(True, alpha=0.3, which='both')

        # 5. Scatter comparison (middle right)
        ax5 = fig.add_subplot(gs[1, 2])
        ax5.scatter(theory_amps, pred_amps, s=100, c=range(len(orders)), cmap='viridis', edgecolors='black')
        max_val = max(max(pred_amps), max(theory_amps)) * 1.1
        ax5.plot([0, max_val], [0, max_val], 'k--', alpha=0.5)
        ax5.set_xlabel('Theoretical Amplitude')
        ax5.set_ylabel('Predicted Amplitude')
        ax5.set_title('Predicted vs Theoretical', fontsize=12, fontweight='bold')
        ax5.grid(True, alpha=0.3)
        ax5.set_aspect('equal')

        # 6. Reconstruction error (bottom)
        ax6 = fig.add_subplot(gs[2, :])
        error = original[mask] - reconstructed[mask]
        ax6.plot(t[mask], error, color='#27ae60', linewidth=1)
        ax6.fill_between(t[mask], error, 0, alpha=0.2, color='green')
        mae = np.mean(np.abs(error))
        rmse = np.sqrt(np.mean(error**2))
        ax6.set_title(f'Reconstruction Error  MAE={mae:.6f}  RMSE={rmse:.6f}', fontsize=12, fontweight='bold')
        ax6.set_xlabel('Time (s)')
        ax6.set_ylabel('Error')
        ax6.grid(True, alpha=0.3)
        ax6.axhline(y=0, color='k', linewidth=0.5)

        plt.suptitle(f'31-order Harmonic Prediction Comprehensive Dashboard (Frequency: {freq}Hz, Amplitude: {amplitude})',
                    fontsize=16, fontweight='bold', y=0.98)
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        plt.close()


def run_prediction_demo(freq=111, amplitude=1.0, duty_cycle=0.5, output_dir='visualizations'):
    """Run prediction demo"""
    predictor = HarmonicPredictor()

    predictions, sig, t, feature_dict = predictor.predict(
        freq=freq, amplitude=amplitude, duty_cycle=duty_cycle, duration=2.0
    )

    predictor.display_predictions(predictions, freq, amplitude)
    figures = predictor.generate_all_visualizations(
        predictions, t, sig, freq, amplitude, feature_dict, output_dir
    )

    print(f"\n{'='*70}")
    print("Visualization charts generated:")
    for name, path in figures.items():
        print(f"  - {name}: {path}")
    print(f"{'='*70}")

    return predictor, predictions, sig, t


if __name__ == "__main__":
    # Test multiple cases
    test_cases = [
        {'freq': 111, 'amplitude': 1.0},
        {'freq': 50, 'amplitude': 2.0},
        {'freq': 100, 'amplitude': 1.5},
    ]

    for i, case in enumerate(test_cases):
        output_dir = f"visualizations_case_{i+1}"
        print(f"\n{'='*70}")
        print(f"Test Case {i+1}: freq={case['freq']}Hz, amplitude={case['amplitude']}")
        print(f"{'='*70}")
        run_prediction_demo(**case, output_dir=output_dir)