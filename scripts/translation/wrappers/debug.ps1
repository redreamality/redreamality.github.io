#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Debug Translation API - Comprehensive Testing Script

.DESCRIPTION
    This script runs comprehensive tests for the translation API to help debug issues
    before running GitHub Actions workflows.

.PARAMETER RunBasicTest
    Run basic API connectivity tests

.PARAMETER RunTranslationTest
    Run full translation functionality tests

.PARAMETER RunAll
    Run all available tests (default)

.EXAMPLE
    .\scripts\translation\wrappers\debug.ps1
    .\scripts\translation\wrappers\debug.ps1 -RunAll
    .\scripts\translation\wrappers\debug.ps1 -RunBasicTest
    .\scripts\translation\wrappers\debug.ps1 -RunTranslationTest
#>

param(
    [switch]$RunBasicTest,
    [switch]$RunTranslationTest,
    [switch]$RunAll = $true
)

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Magenta = "`e[35m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = $Reset
    )
    Write-Host "$Color$Message$Reset"
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "=" * 50 $Cyan
    Write-ColorOutput $Title $Cyan
    Write-ColorOutput "=" * 50 $Cyan
    Write-Host ""
}

function Test-NodeInstallation {
    Write-Header "Checking Node.js Installation"
    
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-ColorOutput "✅ Node.js installed: $nodeVersion" $Green
            return $true
        } else {
            Write-ColorOutput "❌ Node.js not found" $Red
            Write-ColorOutput "Please install Node.js from https://nodejs.org/" $Yellow
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Node.js not found" $Red
        Write-ColorOutput "Please install Node.js from https://nodejs.org/" $Yellow
        return $false
    }
}

function Test-EnvironmentVariables {
    Write-Header "Checking Environment Variables"
    
    $apiBase = $env:OPENAI_API_BASE
    $apiKey = $env:OPENAI_API_KEY
    $model = $env:MODEL
    
    Write-ColorOutput "Environment Variables:" $Blue
    Write-ColorOutput "- OPENAI_API_BASE: $(if ($apiBase) { $apiBase } else { '[NOT SET - will use default]' })" $Blue
    Write-ColorOutput "- OPENAI_API_KEY: $(if ($apiKey) { $apiKey.Substring(0, [Math]::Min(8, $apiKey.Length)) + '...' } else { '[NOT SET - will use default]' })" $Blue
    Write-ColorOutput "- MODEL: $(if ($model) { $model } else { '[NOT SET - will use default]' })" $Blue
    
    Write-Host ""
    Write-ColorOutput "Default values that will be used:" $Yellow
    Write-ColorOutput "- API Base: https://gateway.chat.sensedeal.vip/v1" $Yellow
    Write-ColorOutput "- API Key: b9df99ea41435fa7be5ce346b486c33e" $Yellow
    Write-ColorOutput "- Model: qwen2.5-32b-instruct-int4" $Yellow
}

function Run-BasicAPITest {
    Write-Header "Running Basic API Tests"
    
    if (-not (Test-Path "scripts/translation/debug/api-test.mjs")) {
        Write-ColorOutput "❌ scripts/translation/debug/api-test.mjs not found" $Red
        Write-ColorOutput "Please make sure you're running from the repository root" $Yellow
        return $false
    }
    
    try {
        Write-ColorOutput "🚀 Running comprehensive API tests..." $Blue
        $result = node scripts/translation/debug/api-test.mjs
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Basic API tests completed successfully" $Green
            return $true
        } else {
            Write-ColorOutput "❌ Basic API tests failed" $Red
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to run basic API tests: $($_.Exception.Message)" $Red
        return $false
    }
}

function Run-TranslationTest {
    Write-Header "Running Translation Tests"
    
    if (-not (Test-Path "scripts/translation/debug/translation-test.mjs")) {
        Write-ColorOutput "❌ scripts/translation/debug/translation-test.mjs not found" $Red
        Write-ColorOutput "Please make sure you're running from the repository root" $Yellow
        return $false
    }
    
    try {
        Write-ColorOutput "🌍 Running translation functionality tests..." $Blue
        $result = node scripts/translation/debug/translation-test.mjs
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Translation tests completed successfully" $Green
            return $true
        } else {
            Write-ColorOutput "❌ Translation tests failed" $Red
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Failed to run translation tests: $($_.Exception.Message)" $Red
        return $false
    }
}

function Show-NextSteps {
    param(
        [bool]$BasicTestPassed,
        [bool]$TranslationTestPassed
    )
    
    Write-Header "Next Steps"
    
    if ($BasicTestPassed -and $TranslationTestPassed) {
        Write-ColorOutput "🎉 All tests passed! Your translation setup is working correctly." $Green
        Write-Host ""
        Write-ColorOutput "You can now:" $Blue
        Write-ColorOutput "1. Run GitHub Actions workflows with confidence" $Blue
        Write-ColorOutput "2. Use the batch translation workflow" $Blue
        Write-ColorOutput "3. Translate individual files" $Blue
        Write-Host ""
        Write-ColorOutput "To run batch translation via GitHub Actions:" $Yellow
        Write-ColorOutput "1. Go to your repository on GitHub" $Yellow
        Write-ColorOutput "2. Click 'Actions' tab" $Yellow
        Write-ColorOutput "3. Select 'Batch Translate Content' workflow" $Yellow
        Write-ColorOutput "4. Click 'Run workflow' and configure options" $Yellow
        Write-Host ""
        Write-ColorOutput "Or use the automation script:" $Yellow
        Write-ColorOutput "node scripts/translation/automation/trigger-batch.mjs --target-lang en" $Yellow
    } else {
        Write-ColorOutput "⚠️  Some tests failed. Please address the issues above before using GitHub Actions." $Red
        Write-Host ""
        Write-ColorOutput "Common troubleshooting steps:" $Yellow
        Write-ColorOutput "1. Check your internet connection" $Yellow
        Write-ColorOutput "2. Verify API endpoint is accessible" $Yellow
        Write-ColorOutput "3. Confirm API key is valid and has permissions" $Yellow
        Write-ColorOutput "4. Try a different model if the current one is not available" $Yellow
        Write-Host ""
        Write-ColorOutput "If issues persist:" $Yellow
        Write-ColorOutput "1. Check the API provider's status page" $Yellow
        Write-ColorOutput "2. Contact API provider support" $Yellow
        Write-ColorOutput "3. Review API documentation for any changes" $Yellow
    }
}

function Main {
    Write-ColorOutput @"
🔧 Translation API Debug Tool
============================
This script will help you debug translation API issues
before running GitHub Actions workflows.
"@ $Cyan

    # Check prerequisites
    if (-not (Test-NodeInstallation)) {
        exit 1
    }
    
    Test-EnvironmentVariables
    
    $basicTestPassed = $false
    $translationTestPassed = $false
    
    # Run tests based on parameters
    if ($RunAll -or $RunBasicTest) {
        $basicTestPassed = Run-BasicAPITest
    }
    
    if ($RunAll -or $RunTranslationTest) {
        $translationTestPassed = Run-TranslationTest
    }
    
    # Show summary and next steps
    Show-NextSteps -BasicTestPassed $basicTestPassed -TranslationTestPassed $translationTestPassed
    
    Write-Header "Debug Session Complete"
    
    if ($basicTestPassed -and $translationTestPassed) {
        Write-ColorOutput "🎉 All systems go! Translation API is ready to use." $Green
        exit 0
    } else {
        Write-ColorOutput "⚠️  Please resolve the issues above before proceeding." $Yellow
        exit 1
    }
}

# Run the main function
Main
