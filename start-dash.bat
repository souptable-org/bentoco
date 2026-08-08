@echo off
cd /d C:\Users\harsh\bentoco\packages\admin\dashboard
echo starting dash > C:\Users\harsh\bentoco\server-7001.log
call yarn dev --host 0.0.0.0 --port 7001 >> C:\Users\harsh\bentoco\server-7001.log 2>&1
