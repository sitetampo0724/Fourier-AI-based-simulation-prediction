import { useState } from "react";
import { Quote, Check, Copy, BookOpen } from "lucide-react";

const bibtex = `@article{harmonicscope2024,
  title={HarmonicScope: Machine Learning-Based 31-Order Harmonic Prediction for Ideal Square Waves},
  author={Harmonic Analysis Team},
  journal={Signal Processing Letters},
  year={2024},
  volume={31},
  pages={1--8},
  doi={10.1109/LSP.2024.XXXXXXX}
}`;

export default function CitationSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="citation"
      className="relative w-full py-24 md:py-32"
      style={{ background: "#050507" }}
    >
      <div className="max-w-4xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00B8FF]/10 border border-[#00B8FF]/20 mb-4">
            <BookOpen size={14} className="text-[#00B8FF]" />
            <span className="text-[#00B8FF] text-sm font-medium mono">
              Citation
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Cite This <span className="text-[#00B8FF]">Work</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            If you use HarmonicScope in your research, please cite the following
            paper.
          </p>
        </div>

        {/* BibTeX card */}
        <div className="liquid-glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Quote size={16} className="text-[#00B8FF]" />
              <span className="text-sm font-medium text-white/70 mono">
                BibTeX
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs mono"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-[#00FFA3]" />
                  <span className="text-[#00FFA3]">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="mono text-sm text-white/60 leading-relaxed">
              {bibtex}
            </pre>
          </div>
        </div>

        {/* Paper abstract */}
        <div className="mt-8 liquid-glass rounded-2xl p-6 md:p-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Abstract
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            This paper presents HarmonicScope, a machine learning system for
            predicting the amplitudes of up to 31 odd-order harmonics in ideal
            square wave signals. Traditional Fourier analysis provides exact
            theoretical values via the formula A<sub>n</sub> = 4A/(n&pi;), but
            practical measurement systems introduce noise and non-idealities that
            make direct calculation challenging.
          </p>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            Our approach uses a Gradient Boosting Decision Tree regressor with
            800 estimators, trained on 5000 synthetic square wave samples with
            varying frequency (1-1000Hz), amplitude (0.1-10.0), and duty cycle
            (0.1-0.9). The model extracts 10-dimensional feature vectors
            including signal statistics and spectral features, then predicts all
            16 harmonic amplitudes (1st through 31st) simultaneously via
            MultiOutputRegressor.
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            Experimental results demonstrate exceptional accuracy with R&sup2; =
            0.9999, RMSE = 0.0044, and MAE = 0.0012. Over 95% of predictions
            achieve less than 1% relative error, validating the approach for
            real-time harmonic analysis applications in power electronics,
            audio signal processing, and communication systems.
          </p>
        </div>
      </div>
    </section>
  );
}
