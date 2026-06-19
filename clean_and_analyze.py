import pandas as pd
import numpy as np
import os

# 定义数据集路径
data_dir = r"D:\Work\Heart\heart+disease"
raw_data_path = os.path.join(data_dir, "processed.cleveland.data")

# 1. 注入原始医学特征维度名称
columns = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 
    'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'num'
]

print("正在读取 UCI 原始数据集...")
# 原始数据没有表头，且缺失值用 '?' 表示
df = pd.read_csv(raw_data_path, names=columns, na_values='?')

print("\n--- 原始数据质量审查 ---")
print(df.isnull().sum())

# 2. 执行核心数据清洗
# 原因说明：'ca' (血管染色数) 和 'thal' (地中海贫血类型) 存在少量缺失值 (?)
# 我们采用医学统计学常用的“中位数/众数填补法”，防止直接删除样本导致的信息流失
df['ca'] = df['ca'].fillna(df['ca'].median())
df['thal'] = df['thal'].fillna(df['thal'].mode()[0])

# 3. 目标标签二分类转化 (Binarization)
# 原因说明：原始字段 'num' 的取值为 0(健康), 1, 2, 3, 4(不同严重程度的心脏病)。
# 我们的核心预测目标是评估“是否患有心脏病风险”，因此需将其转化为标准的二分类问题（0 代表健康，1 代表有风险）。
df['target'] = df['num'].apply(lambda x: 1 if x > 0 else 0)
df = df.drop(columns=['num']) # 移除旧标签

print("\n--- 洗炼后数据集概览 ---")
print(f"总样本量: {df.shape[0]} 行, 特征数: {df.shape[1]} 列")
print(df.head())

# 保存清洗后的黄金数据集
cleaned_path = os.path.join(data_dir, "cleaned_heart.csv")
df.to_csv(cleaned_path, index=False)
print(f"\n[成功] 清洗完成！黄金数据集已保存至: {cleaned_path}")