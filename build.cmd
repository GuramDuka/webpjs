@echo off

set EMSDK=c:\emsdk
set EMSDKV=1.38.3
set EM_CONFIG=c:\Users\duka\.emscripten
set BINARYEN_ROOT=%EMSDK%\clang\e%EMSDKV%_64bit\binaryen
set JAVA_HOME=%EMSDK%\java\8.152_64bit
set EMSCRIPTEN=%EMSDK%\emscripten\%EMSDKV%
set CMAKE_TOOLCHAIN_FILE=%EMSCRIPTEN%\cmake\Modules\Platform\Emscripten.cmake

set PATH=%PATH%;%EMSDK%
set PATH=%PATH%;%EMSDK%\clang\e%EMSDKV%_64bit
set PATH=%PATH%;%EMSDK%\node\8.9.1_64bit\bin
set PATH=%PATH%;%EMSDK%\python\2.7.13.1_64bit\python-2.7.13.amd64
set PATH=%PATH%;%EMSDK%\java\8.152_64bit\bin
set PATH=%PATH%;%EMSDK%\emscripten\%EMSDKV%

set vswhere=vswhere.exe
set vswhereurl=https://github.com/Microsoft/vswhere/releases/download/2.4.2+g626dfa3e71/vswhere.exe

if not exist "%vswhere%" ( 
	echo download %vswhere%
	PowerShell "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('%vswhereurl%', '%vswhere%')"
)

if not defined VISUALSTUDIOVERSION (
	for /f "usebackq tokens=1* delims=: " %%i in (`%vswhere% -latest -requires Microsoft.VisualStudio.Workload.NativeDesktop`) do (
		if /i "%%i"=="installationPath" (
	        call "%%j\VC\Auxiliary\Build\vcvarsall.bat" x86
		)
	)
)

if not defined VISUALSTUDIOVERSION (
	call "%VSAPPIDDIR%..\..\VC\Auxiliary\Build\vcvarsall.bat" x86
)

if not defined VISUALSTUDIOVERSION (
	call "%VS140COMNTOOLS%..\..\VC\vcvarsall.bat" x86
)

if not defined VISUALSTUDIOVERSION (
	echo visual studio not detected
	exit 1
)

::if exist build rd /s/q build
if not exist build md build

set wd=%~dp0
set wd=%wd:~0,-1%
set wd=%wd%

cd build ^
	&& cmake ^
		-DEMSCRIPTEN=%EMSCRIPTEN% ^
		-DCMAKE_TOOLCHAIN_FILE=%CMAKE_TOOLCHAIN_FILE% ^
		-DCMAKE_BUILD_TYPE=Release ^
		-G "NMake Makefiles" ^
		"%wd%" ^
	&& cmake --build "%wd%\build" ^
	&& js-beautify -t -j -w 80 webpjs.js > webpjs_.js ^
	&& uglifyjs -b -- webpjs_.js > webpjs__.js ^
	&& del /f /q webpjs_.js ^
	&& move /y webpjs__.js webpjs.js >nul ^
	&& js-beautify -t -j -w 80 webpjs.js > webpjs_.js ^
	&& move /y webpjs_.js webpjs.js >nul ^
	&& cd /d "%wd%"
::	&& uglifyjs -c -m -- webpjs.js > webpjs_.js && uglifyjs -b -- webpjs_.js > webpjs__.js
