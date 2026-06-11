@echo off
cd /d C:\Users\thoma\Projects\website
set "CS_DB_PATH=C:\Users\thoma\AppData\Local\CornerSystems\pipeline.db"
echo ===== Corner Systems Daily Run - %DATE% %TIME% ===== >> C:\Users\thoma\Projects\website\agent\daily-run.log 2>&1
"C:\Program Files\nodejs\node.exe" agent/daily-run.js >> C:\Users\thoma\Projects\website\agent\daily-run.log 2>&1
echo ===== Done - %DATE% %TIME% ===== >> C:\Users\thoma\Projects\website\agent\daily-run.log 2>&1
