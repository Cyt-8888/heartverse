import pandas as pd
import numpy as np
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score

data_dir = r"D:\Work\Heart\heart+disease"
cleaned_path = os.path.join(data_dir, "cleaned_heart.csv")

# 读取洗炼后的数据
df = pd.read_csv(cleaned_path)

# 分离特征与标签
X = df.drop(columns=['target'])
y = df['target']

# 划分训练集与测试集 (80% 训练, 20% 验证)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 1. 核心特征工程：标准缩放器 (StandardScaler)
# 原因说明：由于年龄(age)在40-80之间，而ST段下移(oldpeak)在0-6之间，量纲差异巨大。
# 必须进行标准化变换，消除量纲影响，否则大数值特征会恶意吞噬小数值特征的权重。
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 2. 机器学习模型构建 (Logistic Regression)
model = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
model.fit(X_train_scaled, y_train)

# 模型效能评估
y_pred = model.predict(X_test_scaled)
y_prob = model.predict_proba(X_test_scaled)[:, 1]
print("\n=== 医疗模型效能报告 ===")
print(f"临床初筛准确率 (Accuracy): {accuracy_score(y_test, y_pred) * 100:.2f}%")
print(f"ROC 曲线下面积 (AUC Score): {roc_auc_score(y_test, y_prob):.4f}")

# 3. 淬炼算法核心资产，转化为前端轻量 JSON 架构
model_assets = {
    "feature_names": list(X.columns),
    "intercept": float(model.intercept_[0]),
    "coefficients": list(model.coef_[0]),
    # 导出 Scaler 参数，供前端对用户的实时动态输入进行一模一样的标准化变换
    "scaler_mean": list(scaler.mean_),
    "scaler_var": list(scaler.var_),
    "scaler_scale": list(scaler.scale_)
}

# 将大脑芯片写入到项目的 JS 资源目录中 (请根据您的实际项目路径调整，此处直接写入网页所需资产)
assets_json_path = r"D:\Work\Heart\js\model_assets.json"
os.makedirs(os.path.dirname(assets_json_path), exist_ok=True)

with open(assets_json_path, 'w', encoding='utf-8') as f:
    json.dump(model_assets, f, indent=4, ensure_ascii=False)

print(f"\n[大成功] 前端算法推理芯片已成功生成: {assets_json_path}")