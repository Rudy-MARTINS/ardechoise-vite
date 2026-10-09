param([switch]$AcceptAndroidLicense)

$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskTools = Join-Path $taskRoot '.android-tools'
New-Item -ItemType Directory -Path $taskTools -Force | Out-Null

function Get-VerifiedArchive($Url, $FileName, $Sha256) {
    $taskArchive = Join-Path $taskTools $FileName
    if ((Test-Path -LiteralPath $taskArchive) -and (Get-FileHash -LiteralPath $taskArchive -Algorithm SHA256).Hash.ToLowerInvariant() -eq $Sha256) {
        return $taskArchive
    }
    $taskPartial = "$taskArchive.partial"
    & curl.exe --fail --location --retry 3 --silent --show-error --output $taskPartial $Url
    if ($LASTEXITCODE -ne 0) { throw "Téléchargement impossible : $FileName" }
    $taskHash = (Get-FileHash -LiteralPath $taskPartial -Algorithm SHA256).Hash
    if ($taskHash.ToLowerInvariant() -ne $Sha256) { throw "SHA-256 incorrect : $FileName" }
    $taskWorkspacePrefix = [IO.Path]::GetFullPath($taskRoot).TrimEnd('\') + '\'
    if (-not [IO.Path]::GetFullPath($taskPartial).StartsWith($taskWorkspacePrefix, [StringComparison]::OrdinalIgnoreCase) -or -not [IO.Path]::GetFullPath($taskArchive).StartsWith($taskWorkspacePrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Téléchargement hors du projet refusé.'
    }
    Move-Item -LiteralPath $taskPartial -Destination $taskArchive -Force
    return $taskArchive
}

$taskJdkArchive = Get-VerifiedArchive `
    'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12.1%2B1/OpenJDK21U-jdk_x64_windows_hotspot_21.0.12.1_1.zip' `
    'temurin-21.zip' `
    'f9d6e191ab098c0d416e7d588a24420a8621cd2f4720dab2459b8b7b2d2d8b4e'
$taskJdkContainer = Join-Path $taskTools 'jdk'
if (-not (Test-Path -LiteralPath $taskJdkContainer)) {
    Expand-Archive -LiteralPath $taskJdkArchive -DestinationPath $taskJdkContainer
}
$taskJdk = Get-ChildItem -LiteralPath $taskJdkContainer -Directory | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'bin/java.exe') } | Select-Object -First 1
if (-not $taskJdk) { throw 'JDK 21 introuvable après extraction.' }
$env:JAVA_HOME = $taskJdk.FullName

$taskSdkArchive = Get-VerifiedArchive `
    'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip' `
    'android-command-line-tools.zip' `
    '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a'
$taskSdk = Join-Path $taskTools 'sdk'
$taskSdkManager = Join-Path $taskSdk 'cmdline-tools/latest/bin/sdkmanager.bat'
if (-not (Test-Path -LiteralPath $taskSdkManager)) {
    $taskExtract = Join-Path $taskTools 'sdk-cli-extracted'
    if (-not (Test-Path -LiteralPath $taskExtract)) {
        Expand-Archive -LiteralPath $taskSdkArchive -DestinationPath $taskExtract
    }
    $taskSource = [IO.Path]::GetFullPath((Join-Path $taskExtract 'cmdline-tools'))
    $taskDestination = [IO.Path]::GetFullPath((Join-Path $taskSdk 'cmdline-tools/latest'))
    $taskWorkspacePrefix = [IO.Path]::GetFullPath($taskRoot).TrimEnd('\') + '\'
    if (-not $taskSource.StartsWith($taskWorkspacePrefix, [StringComparison]::OrdinalIgnoreCase) -or -not $taskDestination.StartsWith($taskWorkspacePrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Extraction hors du projet refusée.'
    }
    New-Item -ItemType Directory -Path (Split-Path -Parent $taskDestination) -Force | Out-Null
    Move-Item -LiteralPath $taskSource -Destination $taskDestination
}
$env:ANDROID_HOME = $taskSdk
$env:ANDROID_SDK_ROOT = $taskSdk

if (-not $AcceptAndroidLicense) {
    throw 'Outils extraits. Relancer avec -AcceptAndroidLicense après accord pour la licence Android SDK des composants de compilation.'
}
# Only the SDK components used by this project are installed and licensed.
1..20 | ForEach-Object { 'y' } | & $taskSdkManager "--sdk_root=$taskSdk" '--install' 'platform-tools' 'platforms;android-35' 'build-tools;34.0.0' 'build-tools;35.0.0'
if ($LASTEXITCODE -ne 0) { throw 'Installation Android SDK incomplète.' }
foreach ($taskComponent in @('platform-tools/adb.exe', 'platforms/android-35/android.jar', 'build-tools/34.0.0/aapt2.exe', 'build-tools/35.0.0/lib/apksigner.jar')) {
    if (-not (Test-Path -LiteralPath (Join-Path $taskSdk $taskComponent))) { throw "Composant SDK absent : $taskComponent" }
}
& (Join-Path $env:JAVA_HOME 'bin/java.exe') -version
Write-Output 'JDK 21 et SDK Android installés dans .android-tools/ (ignoré par Git).'
