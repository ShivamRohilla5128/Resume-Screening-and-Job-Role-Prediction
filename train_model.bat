@echo off
REM Usage: train_model.bat "C:\path\to\real_dataset.csv" [--map-to-supported]
cd /d %~dp0
call venv\Scripts\activate.bat
if "%~1"=="" (
  python -m ml.training.train
) else (
  python -m ml.training.train --data %*
)
python -m ml.evaluation.make_report
