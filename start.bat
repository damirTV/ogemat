@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Вычисления без ошибок: запускаю игру
echo  ------------------------------------
echo  На этом компьютере откроется: http://localhost:8080
echo.
echo  Чтобы открыть игру на телефоне (телефон и компьютер в одной Wi-Fi сети),
echo  введите в браузере телефона один из адресов:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do echo     http://%%a:8080
echo.
echo  Чтобы остановить игру, закройте это окно.
echo.
where python >nul 2>nul
if not errorlevel 1 (
  set "PYTHON=python"
) else (
  where py >nul 2>nul
  if errorlevel 1 (
    echo.
    echo  Не удалось запустить сервер: на компьютере не найден Python.
    echo  Ничего страшного: просто откройте файл index.html двойным щелчком.
    pause
    exit /b 1
  )
  set "PYTHON=py"
)

rem Browser starts only after the HTTP server has had time to bind the port.
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 1; Start-Process 'http://localhost:8080'"
%PYTHON% -m http.server 8080
if errorlevel 1 (
  echo.
  echo  Сервер не запустился. Возможно, порт 8080 уже занят.
  pause
)
