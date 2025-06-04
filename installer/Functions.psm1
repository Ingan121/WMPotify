#Requires -Version 5.0

#region Console helpers
function Write-HelloMessage {
    [CmdletBinding()]
    param ()
    process {
        Write-Host -Object 'WMPotify for Spicetify Installer'
        Write-Host -Object 'Made by Ingan121'
        Write-Host
        Write-Host -Object 'https://github.com/Ignan121/WMPotify'
        Write-Host -Object '(Mostly) licensed under the MIT License'
        Write-Host
    }
}

function Write-Error {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$Message
    )
    process {
        Write-Host -Object $Message -ForegroundColor Red
        Write-Verbose -Message $Message
    }
    end {
        Wait-Input
        exit 1
    }
}

function Write-ByeMessage {
    [CmdletBinding()]
    param ()
    process {
        Write-Host
        Write-Host -Object 'Done!'
        Write-Host
        Write-Host -Object 'Thanks for using WMPotify!'
        Write-Host
    }
}

function Wait-Input {
    [CmdletBinding()]
    param ()
    process {
        Write-Host -Object 'Press any key to continue...'
        $Host.UI.RawUI.Flushinputbuffer()
        $Host.UI.RawUI.ReadKey('NoEcho, IncludeKeyDown') | Out-Null
    }
}

function Write-Win78Warning {
    [CmdletBinding()]
    param ()
    process {
        Write-Host -Object 'ATTENTION!' -ForegroundColor Yellow
        Write-Host -Object 'You are using Windows 7 or 8.1.'
        Write-Host -Object 'Please note that the WMPotify theme may not work properly on these versions.'
        Write-Host -Object 'Before continuing, please make sure you have installed Spotify and Spicetify that are compatible with WMPotify and applied appropriate workarounds (e.g. VxKex) to make them work on your system.'
        Write-Host -Object 'Do note that launching Spotify with the --no-sandbox flag is required to get the Windhawk mod working properly with Aero Glass, etc.'
        Wait-Input
    }
}
#endregion Console helpers

#region Spotify
function Test-Spotify {
    [CmdletBinding()]
    [OutputType([bool])]
    param ()
    begin {
        Write-Verbose -Message 'Checking if Spotify is installed...'
    }
    process {
        $desktopApp = Test-Path -Path "$env:APPDATA\Spotify" -PathType Container
        if ([System.Environment]::OSVersion.Version -ge [Version]'10.0') {
            $storeApp = Get-AppxPackage -Name '*SpotifyAB*'
        }
    }
    end {
        $desktopApp -or $storeApp
    }
}

function Test-SpotifyBackup {
    [CmdletBinding()]
    [OutputType([bool])]
    param (
        [Parameter(Mandatory)]
        [string]$Path
    )
    begin {
        Write-Verbose -Message 'Checking if there is up-to-date Spotify backup...'
    }
    process {
        $configFile = Get-Content -Path $Path
        $configFile | ForEach-Object -Process {
            if ($PSItem -match '^version = (.+)$') {
                $backupVersion = $Matches[1]
            }
            elseif ($PSItem -match '^prefs_path.+= (.+)$') {
                $spotifyPrefsPath = $Matches[1]
            }
        }
        
        $spotifyPrefs = Get-Content -Path $spotifyPrefsPath
        $spotifyPrefs | ForEach-Object -Process {
            if ($PSItem -match '^app.last-launched-version="(.+)"$') {
                $spotifyVersion = $Matches[1]
            }
        }
    }
    end {
        $backupVersion -eq $spotifyVersion
    }
}

function Install-Spotify {
    [CmdletBinding()]
    param ()
    begin {
        $Temp = [System.IO.Path]::GetTempPath()
        $installerPath = "$Temp\SpotifySetup.exe"
    }
    process {
        Write-Verbose -Message 'Downloading the Spotify installer...'
        $Parameters = @{
            UseBasicParsing = $true
            Uri             = 'https://download.scdn.co/SpotifySetup.exe'
            OutFile         = $installerPath
        }
        try {
            Invoke-WebRequest @Parameters -ErrorAction Stop
        } catch {
            Write-Error -Message "Failed to download: $($_.Exception.Message). Please check your internet connection and try again."
        } 
        
        Write-Host
        Write-Host -Object 'ATTENTION!' -ForegroundColor Yellow
        Write-Host -Object 'Do not close the Spotify installer!'
        Write-Host -Object 'Once Spotify is installed, please login. Then close the window.'
        Wait-Input
        
        Write-Host
        Write-Verbose -Message 'Starting the Spotify installer...'
        Start-Process -FilePath $installerPath
        
        while (-not (Get-Process -Name Spotify -ErrorAction SilentlyContinue)) {
            Start-Sleep -Seconds 1
        }
        Wait-Process -Name Spotify
    }
}
#endregion Spotify

#region Spicetify
function Test-Spicetify {
    [CmdletBinding()]
    [OutputType([bool])]
    Param ()
    Begin {
        Write-Verbose -Message 'Checking if Spicetify is installed...'
    }
    Process {
        [bool](Get-Command -Name spicetify -ErrorAction SilentlyContinue) 
    }
}

function Install-Spicetify {
    [CmdletBinding()]
    param ()
    begin {
        Write-Verbose -Message 'Starting the Spicetify installation script...'
    }
    process {
        $Parameters = @{
            UseBasicParsing = $true
            Uri             = 'https://raw.githubusercontent.com/spicetify/spicetify-cli/master/install.ps1'
        }
        try {
            Invoke-WebRequest @Parameters -ErrorAction Stop | Invoke-Expression
        } catch {
            Write-Error -Message "Failed to download: $($_.Exception.Message). Please check your internet connection and try again."
        } 
    }
}

function Install-Marketplace {
    [CmdletBinding()]
    param ()
    begin {
        Write-Verbose -Message 'Starting the Spicetify Marketplace installation script...'
    }
    process {
        $Parameters = @{
            UseBasicParsing = $true
            Uri             = (
                'https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/resources/install.ps1'
            )
        }
        try {
            Invoke-WebRequest @Parameters -ErrorAction Stop | Invoke-Expression
        } catch {
            Write-Error -Message "Failed to download: $($_.Exception.Message). Please check your internet connection and try again."
        } 
    }
}

function Get-SpicetifyFoldersPaths {
    [CmdletBinding()]
    [OutputType([hashtable])]
    param ()
    begin {
        Write-Verbose -Message 'Getting the Spicetify folders paths...'
    }
    process {
        @{
            configPath = (spicetify path -c --bypass-admin)
            visAppPath = "$(spicetify path userdata --bypass-admin)\CustomApps\wmpvis"
            themePath  = "$(spicetify path userdata --bypass-admin)\Themes\WMPotify"
        }
    }
}

function Submit-SpicetifyConfig {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$Path
    )
    begin {
        Write-Verbose -Message 'Applying changes...'
    }
    process {
        if (Test-SpotifyBackup -Path $Path) {
            spicetify apply --bypass-admin
        }
        else {
            spicetify backup apply --bypass-admin
        }
    }
}
#endregion Spicetify

#region Windhawk
function Test-Windhawk {
    [CmdletBinding()]
    [OutputType([bool])]
    param ()
    begin {
        Write-Verbose -Message 'Checking if Windhawk is installed...'
    }
    process {
        $service = Get-Service -Name 'windhawk' -ErrorAction SilentlyContinue
        $portable = Get-Process -Name 'windhawk' -ErrorAction SilentlyContinue
    }
    end {
        $service -or $portable
    }
}

function Install-Windhawk {
    [CmdletBinding()]
    param ()
    begin {
        $Temp = [System.IO.Path]::GetTempPath()
        $installerPath = "$Temp\windhawk_setup.exe"
    }
    process {
        Write-Verbose -Message 'Downloading the Windhawk installer...'
        $Parameters = @{
            UseBasicParsing = $true
            Uri             = 'https://ramensoftware.com/downloads/windhawk_setup.exe'
            OutFile         = $installerPath
        }
        try {
            Invoke-WebRequest @Parameters -ErrorAction Stop
        } catch {
            Write-Error -Message "Failed to download: $($_.Exception.Message). Please check your internet connection and try again."
        }

        Write-Host
        Write-Host -Object "Installing Windhawk... This may take a while."
        Start-Process -FilePath $installerPath -ArgumentList '/S'

        while (-not (Get-Service -Name 'windhawk' -ErrorAction SilentlyContinue)) {
            Start-Sleep -Seconds 1
        }
    }
}

function Get-WindhawkPaths {
    [CmdletBinding()]
    [OutputType([hashtable])]
    param ()
    begin {
        Write-Verbose -Message 'Getting the Windhawk paths...'

        $service = Get-Service -Name 'windhawk' -ErrorAction SilentlyContinue
        $portable = Get-Process -Name 'windhawk' -ErrorAction SilentlyContinue
    }
    process {
        $windhawkPath = if ($service) {
            (Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\windhawk" -Name "ImagePath").ImagePath -replace '\"', ''
        } elseif ($portable) {
            $portable.Path
        } else {
            Write-Error -Message 'Windhawk is not installed or running.'
            return
        }

        $windhawkDir = Split-Path -Path $windhawkPath -Parent
        $iniPath = Join-Path -Path $windhawkDir -ChildPath 'windhawk.ini'

        if (-not (Test-Path -Path $iniPath)) {
            Write-Error -Message "windhawk.ini not found in $windhawkDir"
            return
        }

        $iniContent = Get-Content -Path $iniPath
        $appDataPath = foreach ($line in $iniContent | Select-String -Pattern 'AppDataPath\s*=\s*(.+)') { $line.Matches[0].Groups[1].Value }
        $registryKey = foreach ($line in $iniContent | Select-String -Pattern 'RegistryKey\s*=\s*(.+)') { $line.Matches[0].Groups[1].Value }

        $appDataPath = [Environment]::ExpandEnvironmentVariables($appDataPath)

        $enginePath = foreach ($line in $iniContent | Select-String -Pattern 'EnginePath\s*=\s*(.+)') { $line.Matches[0].Groups[1].Value }
        $engineIniPath = Join-Path -Path $windhawkDir -ChildPath (Join-Path -Path $enginePath -ChildPath 'engine.ini')

        if (-not (Test-Path -Path $engineIniPath)) {
            Write-Error -Message "engine.ini not found in $engineIniPath"
            return
        }

        $engineIniContent = Get-Content -Path $engineIniPath
        $engineAppDataPath = foreach ($line in $engineIniContent | Select-String -Pattern 'AppDataPath\s*=\s*(.+)') { $line.Matches[0].Groups[1].Value }
        $engineRegistryKey = foreach ($line in $engineIniContent | Select-String -Pattern 'RegistryKey\s*=\s*(.+)') { $line.Matches[0].Groups[1].Value }

        $engineAppDataPath = [Environment]::ExpandEnvironmentVariables($engineAppDataPath)

        @{
            WindhawkPath = $windhawkDir
            EnginePath = $enginePath
            AppDataPath = $appDataPath
            RegistryKey = $registryKey
            EngineAppDataPath = $engineAppDataPath
            EngineRegistryKey = $engineRegistryKey
        }
    }
}

function Initialize-WindhawkBasePaths {
    [CmdletBinding()]
    param ()
    begin {
        Write-Verbose -Message 'Ensuring the Windhawk base paths...'
    }
    process {
        $windhawkPaths = Get-WindhawkPaths
        $x86Path = Join-Path -Path $windhawkPaths.EngineAppDataPath -ChildPath 'Mods\32'
        $x64Path = Join-Path -Path $windhawkPaths.EngineAppDataPath -ChildPath 'Mods\64'

        if (-not (Test-Path -Path $x86Path)) {
            Write-Verbose -Message "Creating '$x86Path'..."
            New-Item -Path $x86Path -ItemType Directory -Force | Out-Null

            Write-Verbose -Message 'Copying base libraries to the x86 directory...'
            Copy-Item -Path "$($windhawkPaths.WindhawkPath)\Compiler\i686-w64-mingw32\bin\*.dll" -Destination $x86Path -Force

            Copy-Item -Path "$x86Path\libc++.dll" -Destination "$x86Path\libc++.whl"
            Copy-Item -Path "$x86Path\libunwind.dll" -Destination "$x86Path\libunwind.whl"
        }

        if (-not (Test-Path -Path $x64Path)) {
            Write-Verbose -Message "Creating '$x64Path'..."
            New-Item -Path $x64Path -ItemType Directory -Force | Out-Null

            Write-Verbose -Message 'Copying base libraries to the x64 directory...'
            Copy-Item -Path "$($windhawkPaths.WindhawkPath)\Compiler\x86_64-w64-mingw32\bin\*.dll" -Destination $x64Path -Force

            Copy-Item -Path "$x64Path\libc++.dll" -Destination "$x64Path\libc++.whl"
            Copy-Item -Path "$x64Path\libunwind.dll" -Destination "$x64Path\libunwind.whl"
        }
    }
}

function Get-WindhawkModPaths {
    [CmdletBinding()]
    [OutputType([hashtable])]
    param ()
    begin {
        Write-Verbose -Message 'Getting the Windhawk mod paths...'
    }
    process {
        $windhawkPaths = Get-WindhawkPaths
        $modNames = @('local@cef-titlebar-enabler-universal', 'cef-titlebar-enabler-universal')

        $modPaths = @{
            x86 = $modNames | ForEach-Object { Join-Path -Path $windhawkPaths.EngineAppDataPath -ChildPath "Mods\32\$_*.dll" }
            x64 = $modNames | ForEach-Object { Join-Path -Path $windhawkPaths.EngineAppDataPath -ChildPath "Mods\64\$_*.dll" }
            source = $modNames | ForEach-Object { Join-Path -Path $windhawkPaths.AppDataPath -ChildPath "ModsSource\$_.wh.cpp" }
            registry = $modNames | ForEach-Object { Join-Path -Path $windhawkPaths.EngineRegistryKey -ChildPath "Mods\$_" }
        }

        $modPaths
    }
}

function Test-WindhawkMod {
    [CmdletBinding()]
    [OutputType([bool])]
    param (
        [switch]$IncludeOutdated
    )
    begin {
        Write-Verbose -Message 'Checking if the Windhawk mod is installed...'
    }
    process {
        $requiredVersion = [Version]'0.6'

        $modPaths = Get-WindhawkModPaths
        $x86Test = $modPaths.x86 | ForEach-Object { Test-Path -Path $_ }
        $x64Test = $modPaths.x64 | ForEach-Object { Test-Path -Path $_ }
        $srcTest = $modPaths.source | ForEach-Object { Test-Path -Path $_ }
        $regTest = $modPaths.registry | ForEach-Object { Test-Path -Path "Registry::$($_)" }

        if (-not ($x86Test -contains $true) -or -not ($x64Test -contains $true) -or -not ($srcTest -contains $true) -or -not ($regTest -contains $true)) {
            Write-Verbose -Message 'Mod files or registry keys are missing.'
            $false
        } else {
            if ($IncludeOutdated) {
                $true
            } else {
                foreach ($key in $modPaths.registry) {
                    $result = Get-ItemProperty -Path "Registry::$key" -Name 'Version' -ErrorAction SilentlyContinue
                    if ($result) {
                        $modVersion = $result
                    }
                }
                if ($modVersion) {
                    [Version]$modVersion.Version -ge $requiredVersion
                } else {
                    Write-Verbose -Message 'Version registry key is missing.'
                    $false
                }
            }
        }
    }
}

function Uninstall-WindhawkMod {
    [CmdletBinding()]
    param ()
    begin {
        $modPaths = Get-WindhawkModPaths
        $service = Get-Service -Name 'windhawk' -ErrorAction SilentlyContinue
        $process = Get-Process -Name 'windhawk' -ErrorAction SilentlyContinue
    }
    process {
        if ($service) {
            Write-Verbose -Message 'Stopping Windhawk service...'
            Stop-Service -Name 'windhawk' -Force
        } elseif ($process) {
            Write-Verbose -Message 'Stopping Windhawk process...'
            Stop-Process -Name 'windhawk' -Force
        } else {
            Write-Verbose -Message 'Windhawk is not installed or running.'
        }
        Write-Verbose -Message 'Stopping Spotify process...'
        Stop-Process -Name 'Spotify' -Force -ErrorAction SilentlyContinue

        Write-Verbose -Message 'Removing the Windhawk mod files...'
        $modFiles = Get-ChildItem -Path $modPaths.source -Recurse -File
        foreach ($file in $modFiles) {
            Write-Verbose -Message "Removing '$($file.FullName)'..."
            Remove-Item -Path $file.FullName -Force
        }

        Write-Verbose -Message 'Removing the registry keys...'
        foreach ($key in $modPaths.registry) {
            if (Test-Path -Path "Registry::$key") {
                Write-Verbose -Message "Removing 'Registry::$key'..."
                Remove-Item -Path "Registry::$key" -Recurse -Force
            }
        }
    }
}

function Install-WindhawkMod {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [hashtable]$LatestVersions
    )
    begin {
        $latestCTE = [Version]$LatestVersions.CTE
        $Temp = [System.IO.Path]::GetTempPath()
        $installerPath = "$Temp\cte_$latestCTE.zip"
        $unzipPath = "$Temp\cte_$latestCTE"

        $service = Get-Service -Name 'windhawk' -ErrorAction SilentlyContinue
        $process = Get-Process -Name 'windhawk' -ErrorAction SilentlyContinue
    }
    process {
        if (Test-WindhawkMod -IncludeOutdated) {
            Write-Verbose -Message 'Cleaning up the existing Windhawk mod...'
            Uninstall-WindhawkMod
        }

        Write-Verbose -Message 'Downloading the Windhawk mod files...'
        $Parameters = @{
            UseBasicParsing = $true
            Uri             = "https://www.ingan121.com/wmpotify/installer/cte_$latestCTE.zip"
            OutFile         = $installerPath
        }
        try {
            Invoke-WebRequest @Parameters -ErrorAction Stop
        } catch {
            Write-Error -Message "Failed to download: $($_.Exception.Message). Please check your internet connection and try again."
        }

        if (Test-Path -Path $unzipPath) {
            Write-Verbose -Message "Removing the existing '$unzipPath'..."
            Remove-Item -Path $unzipPath -Recurse -Force
        }

        Write-Verbose -Message 'Extracting the Windhawk mod files...'
        Expand-Archive -Path $installerPath -Destination $unzipPath

        Initialize-WindhawkBasePaths

        $modPaths = Get-WindhawkModPaths
        
        Write-Verbose -Message 'Copying the Windhawk mod files to the correct directories...'
        $modFiles = Get-ChildItem -Path $unzipPath -Recurse -File

        foreach ($file in $modFiles) {
            $destinations = switch -Regex ($file.FullName) {
                '32\\.*\.dll$' { $modPaths.x86 | ForEach-Object { Join-Path -Path (Split-Path -Path $_ -Parent) -ChildPath $file.Name } }
                '64\\.*\.dll$' { $modPaths.x64 | ForEach-Object { Join-Path -Path (Split-Path -Path $_ -Parent) -ChildPath $file.Name } }
                '.*\.wh\.cpp$' { $modPaths.source | ForEach-Object { Join-Path -Path (Split-Path -Path $_ -Parent) -ChildPath $file.Name } }
                default { @() }
            }

            foreach ($destination in $destinations) {
                if (-not (Test-Path -Path (Split-Path -Path $destination -Parent))) {
                    Write-Verbose -Message "Creating parent directory for '$destination'..."
                    New-Item -Path (Split-Path -Path $destination -Parent) -ItemType Directory -Force | Out-Null
                }
                Write-Verbose -Message "Copying '$($file.FullName)' to '$destination'"
                Copy-Item -Path $file.FullName -Destination $destination -Force
            }
        }

        $isDownloadedModLocal = $modFiles | Where-Object { $_.Name -like 'local@*.wh.cpp' }
        if ($isDownloadedModLocal) {
            $modName = 'local@cef-titlebar-enabler-universal'
        } else {
            $modName = 'cef-titlebar-enabler-universal'
        }
        $regKey = Join-Path -Path (Split-Path -Path $modPaths.registry[0] -Parent) -ChildPath $modName
        $regKey = $regKey -replace 'HKLM', 'HKEY_LOCAL_MACHINE'

        $regFilePath = Join-Path -Path $unzipPath -ChildPath 'cte.reg'
        Write-Verbose -Message 'Importing the registry file...'
        $regFileContent = Get-Content -Path $regFilePath
        $regFileContent = $regFileContent -replace 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Windhawk\\Engine\\Mods\\local@cef-titlebar-enabler-universal', $regKey
        Set-Content -Path $regFilePath -Value $regFileContent -Encoding Unicode
        $regFilePath = Join-Path -Path $unzipPath -ChildPath 'cte.reg'
        if (Test-Path -Path $regFilePath) {
            try {
                Start-Process -FilePath 'regedit.exe' -ArgumentList "/s `"$regFilePath`"" -Wait -NoNewWindow
            } catch {
                Write-Error -Message "Failed to import registry file: $($_.Exception.Message)"
            }
        } else {
            Write-Error -Message "Registry file not found: $regFilePath"
        }

        if ($service) {
            Write-Verbose -Message 'Restarting Windhawk service...'
            Restart-Service -Name 'windhawk'
        } elseif ($process) {
            Write-Verbose -Message 'Restarting Windhawk process...'
            Stop-Process -Name 'windhawk' -Force
            Start-Process -FilePath $process.Path
        } else {
            # should not be reachable i think
            Write-Error -Message 'Windhawk is not installed or running.'
        }

        $whVer = (Get-Item "$((Get-WindhawkPaths).WindhawkPath)\windhawk.exe").VersionInfo.ProductVersion
        if ($whVer -lt [Version]$LatestVersions.WH) {
            Write-Host -Object 'Your copy of Windhawk is currently outdated. Please update Windhawk if the mod is not functioning properly.' -ForegroundColor Yellow
            Wait-Input
        }
    }
}
#endregion Windhawk

#region Misc
function Get-LatestVersions {
    [CmdletBinding()]
    [OutputType([hashtable])]
    param ()
    begin {
        Write-Verbose -Message 'Getting the latest versions of WMPotify, WMPotify NowPlaying, and CEF/Spotify Tweaks...'
    }
    process {
        try {
            $verContent = Invoke-WebRequest -Uri "https://www.ingan121.com/wmpotify/latest.txt" -UseBasicParsing -ErrorAction Stop
        } catch {
            Write-Error -Message "Failed to download: $($_.Exception.Message). Please check your internet connection and try again."
        }
        $themeVer = foreach ($line in $verContent | Select-String -Pattern 'wmpotify\s*=\s*(.+)') { $line.Matches[0].Groups[1].Value }
        $visVer = foreach ($line in $verContent | Select-String -Pattern 'wmpvis\s*=\s*(.+)') { $line.Matches[0].Groups[1].Value }
        $cteVer = foreach ($line in $verContent | Select-String -Pattern 'cte\s*=\s*(.+)') { $line.Matches[0].Groups[1].Value }
        $whVer = foreach ($line in $verContent | Select-String -Pattern 'wh\s*=\s*(.+)') { $line.Matches[0].Groups[1].Value }
    }
    end {
        @{
            Theme = $themeVer
            Vis = $visVer
            CTE = $cteVer
            WH = $whVer
        }
    }
}

function Invoke-AdminJob {
    [CmdletBinding()]
    param ()
    begin {
        $Temp = [System.IO.Path]::GetTempPath()
        $command = @'
Import-Module -Name $env:TEMP\Functions.psm1
if (-not (Test-Windhawk)) {
    Install-Windhawk
}
if (-not (Test-WindhawkMod)) {
    Install-WindhawkMod -LatestVersions (Get-LatestVersions)
}
'@
        Set-Content -Path "$Temp\AdminJob.ps1" -Value $command
        Write-Verbose -Message 'Running the installation script as an administrator...'
    }
    process {
        $adminJob = Start-Process -FilePath 'powershell.exe' -ArgumentList "-NoProfile -NoLogo -ExecutionPolicy Bypass -File $Temp\AdminJob.ps1" -Verb RunAs -PassThru
        Wait-Process -InputObject $adminJob
        Remove-Item -Path "$Temp\AdminJob.ps1" -Force
    }
}

function Get-WindowsAppsTheme {
    [CmdletBinding()]
    param ()
    begin {

        Write-Verbose -Message 'Getting current Windows apps theme...'
        $Parameters = @{
            Path = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize'
            Name = 'AppsUseLightTheme'
        }
    }
    process {
        if ([System.Environment]::OSVersion.Version -lt [Version]'10.0') {
            'light'
        } else {
            switch (Get-ItemPropertyValue @Parameters) {
                0 { 'dark' }
                1 { 'light' }
            }
        }
    }
}
#endregion Misc

#region WMPotify
function Get-WMPotify {
    [CmdletBinding()]
    [OutputType([System.Collections.Hashtable])]
    param (
        [string]$Tag,
        [string]$Branch,
        [bool]$GetWMPVis = $true,
        [bool]$SkipTheme = $false
    )
    begin {
        if ($Branch) {
            $filesToDownload = @(
                "https://github.com/Ingan121/WMPotify/archive/refs/heads/$Branch.zip"
            )
        } else {
            $filesToDownload = @();
            if (-not $SkipTheme) {
                $filesToDownload += "https://github.com/Ingan121/WMPotify/releases/download/$Tag/WMPotify-$Tag.zip"
            }
            if ($GetWMPVis) {
                $filesToDownload += "https://github.com/Ingan121/WMPotify/releases/download/$Tag/WMPotify-NowPlaying-$Tag.zip"
            }
        }

        $downloadedFiles = @()
        $fileCount = $filesToDownload.Count
        $fileIndex = 0

        $Temp = [System.IO.Path]::GetTempPath()
    }
    process {
        foreach ($fileUrl in $filesToDownload) {
            $fileIndex++
            Write-Verbose -Message "Downloading '$fileUrl' ($fileIndex/$fileCount)..."
            try {
                $fileContent = (Invoke-WebRequest -Uri $fileUrl -UseBasicParsing -ErrorAction Stop).Content
                $fileName = Split-Path -Path $fileUrl -Leaf
                $filePath = Join-Path -Path $Temp -ChildPath $fileName
                if ($PSVersionTable.PSVersion.Major -ge 6) {
                    Set-Content -Path $filePath -Value $fileContent -AsByteStream
                } else {
                    Set-Content -Path $filePath -Value $fileContent -Encoding Byte
                }
                $downloadedFiles += $filePath
            } catch {
                Write-Error -Message "Failed to download '$fileUrl': $($_.Exception.Message)"
            }
        }
    }
    end {
        return $downloadedFiles
    }
}

function Install-WMPotify {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$ThemePath,

        [Parameter(Mandatory)]
        [string]$VisAppPath,
        
        [Parameter(Mandatory)]
        [string]$Config,
        
        [string]$ColorScheme,
        
        [string]$Tag = 'latest',
        [string]$Branch,

        [bool]$GetWMPVis = $true,
        [bool]$SkipTheme = $false
    )
    begin {
        if ($SkipTheme -and -not $GetWMPVis) {
            Write-Error -Message 'Nothing to install. Both theme and visapp are skipped. Installation aborted.'
            return
        }

        $Temp = [System.IO.Path]::GetTempPath()

        Write-Verbose -Message "Installing WMPotify theme (Type: $Type, Branch: $Branch)..."
        $downloadedFiles = Get-WMPotify -Tag $Tag -Branch $Branch -GetWMPVis $GetWMPVis -SkipTheme $SkipTheme

        if (($SkipTheme -and -not $Branch -and $downloadedFiles.Count -ne 1) -or
            ($Branch -and $downloadedFiles.Count -ne 1) -or
            ($GetWMPVis -eq $false -and -not $SkipTheme -and -not $Branch -and $downloadedFiles.Count -ne 1) -or
            ($GetWMPVis -eq $true -and -not $SkipTheme -and -not $Branch -and $downloadedFiles.Count -ne 2) -or
            ($GetWMPVis -eq $true -and $Branch -and $downloadedFiles.Count -ne 1)
        ) {
            Write-Error -Message 'Failed to download all WMPotify theme files. Installation aborted.' 
        }
    }
    process {
        if ($Branch) {
            if (-not $SkipTheme -and -not (Test-Path -Path $ThemePath)) {
                Write-Verbose -Message "Creating theme directory '$ThemePath'..."
                New-Item -Path $ThemePath -ItemType Directory -Force | Out-Null
            }

            if ($GetWMPVis -and -not (Test-Path -Path $VisAppPath)) {
                Write-Verbose -Message "Creating visapp directory '$VisAppPath'..."
                New-Item -Path $VisAppPath -ItemType Directory -Force | Out-Null
            }

            $unzipPath = "$Temp\WMPotify-$Branch"
            if (Test-Path -Path $unzipPath) {
                Write-Verbose -Message "Removing the existing '$unzipPath'..."
                Remove-Item -Path $unzipPath -Recurse -Force
            }

            Write-Verbose -Message "Extracting '$Branch.zip' to '$unzipPath'..."
            Expand-Archive -Path "$Temp\$Branch.zip" -Destination $unzipPath

            $themeFilesDir = "$unzipPath\theme\dist\"
            $visAppFilesDir = "$unzipPath\CustomeApps\wmpvis\dist\"

            if (-not $SkipTheme) {
                Write-Verbose -Message "Copying files from '$themeFilesDir' to '$ThemePath'..."
                Copy-Item -Path $themeFilesDir -Destination $ThemePath -Recurse -Force
            }

            if ($GetWMPVis) {
                Write-Verbose -Message "Copying files from '$visAppFilesDir' to '$VisAppPath'..."
                Copy-Item -Path $visAppFilesDir -Destination $VisAppPath -Recurse -Force
            }
        } else {
            if (-not $SkipTheme) {
                if (Test-Path -Path $ThemePath) {
                    Write-Verbose -Message "Removing the existing '$ThemePath'..."
                    Remove-Item -Path $ThemePath -Recurse -Force
                }

                Write-Verbose -Message "Extracting files to '$ThemePath'..."
                Expand-Archive -Path "$Temp\WMPotify-$Tag.zip" -Destination $ThemePath
            }

            if ($GetWMPVis) {
                if (Test-Path -Path $VisAppPath) {
                    Write-Verbose -Message "Removing the existing '$VisAppPath'..."
                    Remove-Item -Path $VisAppPath -Recurse -Force
                }

                Write-Verbose -Message "Extracting files to '$VisAppPath'..."
                Expand-Archive -Path "$Temp\WMPotify-NowPlaying-$Tag.zip" -Destination $VisAppPath
            }
        }

        Write-Verbose -Message 'Configuring Spicetify...'
        if (-not $SkipTheme) {
            spicetify config inject_css 1 replace_colors 1 overwrite_assets 1 inject_theme_js 1 --bypass-admin
            spicetify config current_theme 'WMPotify' --bypass-admin
            
            if ($ColorScheme) {
                spicetify config color_scheme $ColorScheme --bypass-admin
            }
        }

        if ($GetWMPVis) {
            spicetify config custom_apps wmpvis --bypass-admin
        }

        Submit-SpicetifyConfig -Path $Config
    }
}


function Uninstall-WMPotify {
    <#
    .SYNOPSIS
        Uninstalls the WMPotify theme.

    .DESCRIPTION
        This function uninstalls the WMPotify theme by resetting the relevant Spicetify configurations 
        and removing the theme directory.

    .PARAMETER Path
        Specifies the path to the WMPotify theme directory.

    .PARAMETER Config
        Specifies the path to your Spicetify configuration file.

    .PARAMETER Value 
        Sets current theme and color_scheme to this value, default is empty string
    #>
    [CmdletBinding()]
    param (
        [Parameter(Mandatory)]
        [string]$ThemePath,

        [Parameter(Mandatory)]
        [string]$VisAppPath,

        [Parameter(Mandatory)]
        [string]$Config,

        [string]$Value = ' '
    )
    begin {
        Write-Verbose -Message 'Uninstalling WMPotify theme...'
    }
    process {
        Write-Verbose -Message 'Resetting Spicetify configurations...'
        spicetify config current_theme $Value color_scheme $Value --bypass-admin
        spicetify config custom_apps wmpvis- --bypass-admin
        Submit-SpicetifyConfig -Path $Config
    }
    end {
        if (Test-Path -Path $ThemePath) {
            Write-Verbose -Message "Removing theme directory '$ThemePath'..."
            Remove-Item -Path $ThemePath -Recurse -Force
        }

        if (Test-Path -Path $VisAppPath) {
            Write-Verbose -Message "Removing visapp directory '$VisAppPath'..."
            Remove-Item -Path $VisAppPath -Recurse -Force
        }
    }
}
#endregion WMPotify
