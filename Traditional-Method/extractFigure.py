import cv2
import numpy as np


def extract_curve(image_path, target_color=(0, 0, 255), color_range=30, x_tolerance=10.0):
    img = cv2.imread(image_path)
    h, w = img.shape[:2]

    lower = np.array([max(0, c - color_range) for c in target_color])
    upper = np.array([min(255, c + color_range) for c in target_color])
    mask = cv2.inRange(img, lower, upper)

    points = np.column_stack(np.where(mask > 0))

    x = points[:, 1]
    y = h - 1 - points[:, 0]
    sort_idx = np.argsort(x)
    x = x[sort_idx]
    y = y[sort_idx]

    # 在容差范围内只保留第一个点
    unique_x = []
    unique_y = []
    last_x = -float('inf')

    for i in range(len(x)):
        if x[i] - last_x >= x_tolerance:  # 距离超过容差才保留
            unique_x.append(x[i])
            unique_y.append(y[i])
            last_x = x[i]



    return np.column_stack((unique_x, unique_y))

