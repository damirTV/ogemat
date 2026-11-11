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
start "" http://localhost:8080
python -m http.server 8080 2>nul
if errorlevel 1 py -m http.server 8080
if errorlevel 1 (
  echo.
  echo  Не удалось запустить сервер: на компьютере не найден Python.
  echo  Ничего страшного: просто откройте файл index.html двойным щелчком.
  pause
)
