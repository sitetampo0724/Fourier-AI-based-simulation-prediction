import numpy as np
import matplotlib.pyplot as plt
from scipy import interpolate


def spline_func(x, y):
   spline = interpolate.make_interp_spline(x, y, k=3)

   x_smooth = np.linspace(x.min(), x.max(), 1000)
   y_smooth = spline(x_smooth)

   plt.figure(figsize=(10, 6))
   plt.scatter(x, y, color='red', s=50, zorder=5)
   plt.plot(x_smooth, y_smooth, 'b-', linewidth=2)
   plt.xlabel("X")
   plt.ylabel("Y")
   plt.grid(True, alpha=0.3)
   plt.show()

   def get_all_x(target_y):
      # 找出接近 target_y 的所有点
      tolerance = 10  # 允许的误差
      mask = np.abs(y_smooth - target_y) < tolerance
      return x_smooth[mask]

   return get_all_x
