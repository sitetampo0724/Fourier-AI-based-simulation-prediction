import numpy as np
import matplotlib.pyplot as plt

def square_wave(x_points, y_low, y_high):
    x = []
    y = []
    for xp in x_points:
        x.extend([xp, xp])
        y.extend([y_low, y_high])
        y_low, y_high = y_high, y_low  # 交换高低电平

    plt.plot(x, y, 'b-', linewidth=2)
    plt.grid(True)
    plt.show()

