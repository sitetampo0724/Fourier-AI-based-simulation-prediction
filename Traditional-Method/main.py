import numpy as np
from matplotlib import pyplot as plt

from extractFigure import extract_curve
from functionPlot import spline_func
from createFigure import square_wave



points = extract_curve('test1.png', (255, 0, 255), 30,6.01)
get_all_x = spline_func(points[:, 0], points[:, 1])
results_up = get_all_x(166)
results_down = get_all_x(108)


results_up = sorted(results_up)
groups_up = []
current_group = [results_up[0]]
for i in range(1, len(results_up)):
    if results_up[i] - results_up[i-1] <= 10:
        current_group.append(results_up[i])
    else:
        groups_up.append(current_group)
        current_group = [results_up[i]]
groups_up.append(current_group)

filtered_up = [round(group[len(group)//2], 2) for group in groups_up]


results_down = sorted(results_down)
groups_down = []
current_group = [results_down[0]]
for i in range(1, len(results_down)):
    if results_down[i] - results_down[i-1] <= 10:
        current_group.append(results_down[i])
    else:
        groups_down.append(current_group)
        current_group = [results_down[i]]
groups_down.append(current_group)

filtered_down = [round(group[len(group)//2], 2) for group in groups_down]

print("上侧:", filtered_up)
print("下侧:", filtered_down)

filtered_up = np.array(filtered_up)
filtered_down = np.array(filtered_down)
filtered_up_op = filtered_up[0:]
index = [1, 2, 3, 4, 5, 7]
filtered_down_op = filtered_down[index]
print("上侧:", filtered_up_op)
print("下侧:", filtered_down_op)


square_wave(filtered_up_op, y_low=58, y_high=230)

