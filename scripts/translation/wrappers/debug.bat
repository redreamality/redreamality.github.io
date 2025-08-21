@echo off
setlocal enabledelayedexpansion

:: Translation API Debug Tool - Windows Batch Version
:: This script helps debug translation API issues before running GitHub Actions

echo.
echo ================================
echo Translation API Debug Tool
echo ================================
echo This script will help you debug translation API issues
echo before running GitHub Actions workflows.
echo.

:: Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js installed: !NODE_VERSION!
)

echo.
echo Checking environment variables...
echo - OPENAI_API_BASE: %OPENAI_API_BASE%
if defined OPENAI_API_KEY (
    set "API_KEY_DISPLAY=%OPENAI_API_KEY:~0,8%..."
) else (
    set "API_KEY_DISPLAY=[NOT SET - will use default]"
)
echo - OPENAI_API_KEY: !API_KEY_DISPLAY!
echo - MODEL: %MODEL%

echo.
echo Default values that will be used:
echo - API Base: https://gateway.chat.sensedeal.vip/v1
echo - API Key: b9df99ea41435fa7be5ce346b486c33e
echo - Model: qwen2.5-32b-instruct-int4

echo.
echo ================================
echo Running Basic API Tests
echo ================================

:: Check if debug script exists
if not exist "scripts\translation\debug\api-test.mjs" (
    echo [ERROR] scripts\translation\debug\api-test.mjs not found!
    echo Please make sure you're running from the repository root directory.
    echo.
    pause
    exit /b 1
)

echo Running comprehensive API tests...
node scripts\translation\debug\api-test.mjs
set BASIC_TEST_RESULT=%errorlevel%

echo.
echo ================================
echo Running Translation Tests
echo ================================

:: Check if translation test script exists
if not exist "scripts\translation\debug\translation-test.mjs" (
    echo [ERROR] scripts\translation\debug\translation-test.mjs not found!
    echo Please make sure you're running from the repository root directory.
    echo.
    pause
    exit /b 1
)

echo Running translation functionality tests...
node scripts\translation\debug\translation-test.mjs
set TRANSLATION_TEST_RESULT=%errorlevel%

echo.
echo ================================
echo Test Results Summary
echo ================================

if %BASIC_TEST_RESULT% equ 0 (
    echo [OK] Basic API tests: PASSED
    set BASIC_PASSED=1
) else (
    echo [FAIL] Basic API tests: FAILED
    set BASIC_PASSED=0
)

if %TRANSLATION_TEST_RESULT% equ 0 (
    echo [OK] Translation tests: PASSED
    set TRANSLATION_PASSED=1
) else (
    echo [FAIL] Translation tests: FAILED
    set TRANSLATION_PASSED=0
)

echo.
echo ================================
echo Next Steps
echo ================================

if %BASIC_PASSED% equ 1 if %TRANSLATION_PASSED% equ 1 (
    echo [SUCCESS] All tests passed! Your translation setup is working correctly.
    echo.
    echo You can now:
    echo 1. Run GitHub Actions workflows with confidence
    echo 2. Use the batch translation workflow
    echo 3. Translate individual files
    echo.
    echo To run batch translation via GitHub Actions:
    echo 1. Go to your repository on GitHub
    echo 2. Click 'Actions' tab
    echo 3. Select 'Batch Translate Content' workflow
    echo 4. Click 'Run workflow' and configure options
    echo.
    echo Or use the automation script:
    echo node scripts\translation\automation\trigger-batch.mjs --target-lang en
    echo.
    echo [SUCCESS] All systems go! Translation API is ready to use.
) else (
    echo [WARNING] Some tests failed. Please address the issues above before using GitHub Actions.
    echo.
    echo Common troubleshooting steps:
    echo 1. Check your internet connection
    echo 2. Verify API endpoint is accessible
    echo 3. Confirm API key is valid and has permissions
    echo 4. Try a different model if the current one is not available
    echo.
    echo If issues persist:
    echo 1. Check the API provider's status page
    echo 2. Contact API provider support
    echo 3. Review API documentation for any changes
    echo.
    echo [WARNING] Please resolve the issues above before proceeding.
)

echo.
echo ================================
echo Debug Session Complete
echo ================================
echo.
pause
