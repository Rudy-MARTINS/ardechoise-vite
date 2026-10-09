param(
    [switch]$CreateSigningKey,
    [string]$VersionName = '1.0.0',
    [int]$VersionCode = 1
)

$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskTools = Join-Path $taskRoot '.android-tools'
$taskJdk = Get-ChildItem -LiteralPath (Join-Path $taskTools 'jdk') -Directory | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'bin/java.exe') } | Select-Object -First 1
if (-not $taskJdk) { throw 'Installer les outils avec scripts/install-android-tools.ps1.' }
$env:JAVA_HOME = $taskJdk.FullName
$env:ANDROID_HOME = Join-Path $taskTools 'sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
# Keep Gradle's rapidly renamed caches outside OneDrive-synchronized folders.
$env:GRADLE_USER_HOME = Join-Path $env:LOCALAPPDATA 'Ardechoise/gradle'

Push-Location $taskRoot
try {
    & npm.cmd run android:prepare
    if ($LASTEXITCODE -ne 0) { throw 'Préparation du jeu Android échouée.' }
} finally { Pop-Location }

# The reusable signing key and DPAPI-encrypted password stay outside the checkout.
$taskSigning = Join-Path $env:LOCALAPPDATA 'Ardechoise/signing'
$taskKey = Join-Path $taskSigning 'ardechoise-release.jks'
$taskCredentialFile = Join-Path $taskSigning 'signing.credential.xml'
if (-not (Test-Path -LiteralPath $taskSigning)) {
    if (-not $CreateSigningKey) { throw 'Clé absente. Utiliser -CreateSigningKey pour la première compilation.' }
    New-Item -ItemType Directory -Path $taskSigning -Force | Out-Null
    $taskAcl = New-Object System.Security.AccessControl.DirectorySecurity
    $taskAcl.SetAccessRuleProtection($true, $false)
    $taskUser = [Security.Principal.WindowsIdentity]::GetCurrent().User
    $taskSystem = New-Object Security.Principal.SecurityIdentifier 'S-1-5-18'
    foreach ($taskIdentity in @($taskUser, $taskSystem)) {
        $taskRule = New-Object System.Security.AccessControl.FileSystemAccessRule($taskIdentity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
        $taskAcl.AddAccessRule($taskRule)
    }
    Set-Acl -LiteralPath $taskSigning -AclObject $taskAcl
}
if (-not (Test-Path -LiteralPath $taskCredentialFile)) {
    if ((Test-Path -LiteralPath $taskKey) -or -not $CreateSigningKey) { throw 'Ne pas remplacer une clé ou ses identifiants existants.' }
    $taskRandom = New-Object byte[] 32
    $taskRng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $taskRng.GetBytes($taskRandom) } finally { $taskRng.Dispose() }
    $taskSecure = ConvertTo-SecureString ([Convert]::ToBase64String($taskRandom)) -AsPlainText -Force
    $taskCredential = New-Object System.Management.Automation.PSCredential('ardechoise', $taskSecure)
    $taskCredential | Export-Clixml -LiteralPath $taskCredentialFile
}
$taskCredential = Import-Clixml -LiteralPath $taskCredentialFile
if ($taskCredential -isnot [Management.Automation.PSCredential]) { throw 'Identifiants de signature invalides.' }
$taskSecretNames = @('ARDECHOISE_KEYSTORE_PASSWORD', 'ARDECHOISE_KEY_PASSWORD', 'ARDECHOISE_KEYSTORE_PATH', 'ARDECHOISE_KEY_ALIAS')
$taskPrevious = @{}
foreach ($taskName in $taskSecretNames) { $taskPrevious[$taskName] = [Environment]::GetEnvironmentVariable($taskName, 'Process') }
try {
    $env:ARDECHOISE_KEYSTORE_PATH = $taskKey
    $env:ARDECHOISE_KEY_ALIAS = $taskCredential.UserName
    $env:ARDECHOISE_KEYSTORE_PASSWORD = $taskCredential.GetNetworkCredential().Password
    $env:ARDECHOISE_KEY_PASSWORD = $env:ARDECHOISE_KEYSTORE_PASSWORD
    if (-not (Test-Path -LiteralPath $taskKey)) {
        if (-not $CreateSigningKey) { throw 'Clé absente ; première compilation avec -CreateSigningKey requise.' }
        & (Join-Path $env:JAVA_HOME 'bin/keytool.exe') -genkeypair -keystore $taskKey -storetype JKS -alias $env:ARDECHOISE_KEY_ALIAS -keyalg RSA -keysize 3072 -sigalg SHA256withRSA -validity 10000 -dname "CN=L'Ardechoise" -storepass:env ARDECHOISE_KEYSTORE_PASSWORD -keypass:env ARDECHOISE_KEY_PASSWORD -noprompt
        if ($LASTEXITCODE -ne 0) { throw 'Création de la clé de signature impossible.' }
    }
    $env:ARDECHOISE_VERSION_NAME = $VersionName
    $env:ARDECHOISE_VERSION_CODE = [string]$VersionCode
    & (Join-Path $PSScriptRoot 'android-icons.ps1')
    Push-Location $taskRoot
    try {
        & node (Join-Path $PSScriptRoot 'android-release.mjs')
        if ($LASTEXITCODE -ne 0) { throw 'Compilation Android échouée.' }
    } finally { Pop-Location }
} finally {
    foreach ($taskName in $taskSecretNames) { [Environment]::SetEnvironmentVariable($taskName, $taskPrevious[$taskName], 'Process') }
}
