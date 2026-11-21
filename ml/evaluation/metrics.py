"""Evaluation helpers: accuracy, precision, recall, F1, confusion matrix, classification report."""
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_recall_fscore_support


def evaluate(y_true, y_pred, class_names):
    labels = list(range(len(class_names)))
    p_w, r_w, f_w, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)
    p_m, r_m, f_m, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision_weighted": round(float(p_w), 4), "recall_weighted": round(float(r_w), 4), "f1_weighted": round(float(f_w), 4),
        "precision_macro": round(float(p_m), 4), "recall_macro": round(float(r_m), 4), "f1_macro": round(float(f_m), 4),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
        "classification_report": classification_report(y_true, y_pred, labels=labels, target_names=class_names, output_dict=True, zero_division=0),
    }
