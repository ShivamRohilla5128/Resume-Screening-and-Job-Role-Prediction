@echo off
REM One-time setup for Windows (Python 3.10-3.12 and Node.js 18+ must be installed)
cd /d %~dp0
if not exist .env copy .env.example .env >nul
echo [1/4] Creating virtual environment...
python -m venv venv || goto :err
call venv\Scripts\activate.bat
echo [2/4] Installing Python packages...
pip install -r requirements.txt || goto :err
echo [3/4] Generating SYNTHETIC demo dataset and training models (use train_model.bat for real data)...
python -m ml.datasets.generate_synthetic_dataset || goto :err
python -m ml.training.train || goto :err
python -m ml.evaluation.make_report
echo [4/4] Installing frontend packages...
cd frontend
call npm install || goto :err
echo.
echo Setup complete. IMPORTANT: edit .env (set SECRET_KEY; MONGO_URI=mongomock for a no-install demo DB).
echo Then run run_backend.bat and run_frontend.bat in two terminals.
exit /b 0
:err
echo Setup failed - see the message above.
exit /b 1
