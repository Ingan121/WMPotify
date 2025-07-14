[CmdletBinding()]
param (
    [ValidateSet('Install', 'Uninstall')]
    [string]$Action = 'Install',

    [string[]]$Install = @('wmpotify', 'wmpvis', 'ctewh'),

    [string]$Version = 'latest',

    [switch]$GetFromGit,
    [switch]$NoAskCTEWH,
    [switch]$BypassAdmin
)
begin {
    $ErrorActionPreference = 'Stop'
    Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $previousConsoleTitle = $Host.UI.RawUI.WindowTitle
    $Host.UI.RawUI.WindowTitle = 'WMPotify Installer'
}
process {
    Clear-Host

    Write-Verbose -Message 'Downloading Functions module...'
    $moduleName = 'Functions'
    $Temp = [System.IO.Path]::GetTempPath()
    $modulePath = "$Temp\$moduleName.psm1"
    $Parameters = @{
        Uri             = (
        'https://raw.githubusercontent.com/Ingan121/WMPotify/master/installer/Functions.psm1'
        )
        UseBasicParsing = $true
        OutFile         = $modulePath
    }
    try {
        Invoke-WebRequest @Parameters -ErrorAction Stop
    } catch {
        Write-Error -Message "Failed to download: $($_.Exception.Message). Please check your internet connection and try again."
    }
    Import-Module -Name $modulePath

    Clear-Host
    Write-HelloMessage

    $minimumPowerShellVersion = 5
    $currentPowerShellVersion = $PSVersionTable.PSVersion.Major

    if ($currentPowerShellVersion -lt $minimumPowerShellVersion) {
        Write-Error -Message (
        "Your PowerShell version is $currentPowerShellVersion.`n" +
        "The minimum version required to run this script is $minimumPowerShellVersion."
        )
    }

    if ([System.Environment]::OSVersion.Version -lt [Version]'10.0') {
        Write-Win78Warning
    }

    $isSpicetifyInstalled = Test-Spicetify
    
    $currentPrincipal = New-Object -TypeName System.Security.Principal.WindowsPrincipal -ArgumentList ([System.Security.Principal.WindowsIdentity]::GetCurrent())
    $isAdmin = $currentPrincipal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
    $isUacDisabled = (Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System).EnableLUA -eq 0
    $isBuiltinAdmin = ([System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value -match '-500$')

    if ($isAdmin -and -not $isUacDisabled -and -not $BypassAdmin -and -not $isBuiltinAdmin) {
        Write-Host 'This script should not be started as administrator, as this can cause problems with Spicetify. Continue only if you know what you are doing.'
        do {
            $choice = $Host.UI.PromptForChoice(
                '',
                'Do you want to abort the installation process?',
                ('&Yes', '&No'),
                0
            )
            if ($choice -notin 0, 1) {
                Write-Host "Invalid choice. Please select Yes or No." -ForegroundColor Yellow
            }
        } until ($choice -in 0, 1)

        if ($choice -eq 0) {
            Write-Error -Message 'Installation aborted.'
        }
    }

    switch ($Action) {
        'Uninstall' {
        if (-not $isSpicetifyInstalled) {
            Write-Error -Message 'Failed to detect Spicetify installation!'
        }

        $spicetifyFolders = Get-SpicetifyFoldersPaths
        $Parameters = @{
            ThemePath  = $spicetifyFolders.themePath
            VisAppPath = $spicetifyFolders.visAppPath
            Config     = $spicetifyFolders.configPath
        }

        $Host.UI.RawUI.Flushinputbuffer()
        do {
            $choice = $Host.UI.PromptForChoice(
                '',
                'Do you plan to use the marketplace to install the next theme?',
                ('&Yes', '&No'),
                0
            )
            if ($choice -notin 0, 1) {
                Write-Host "Invalid choice. Please select Yes or No." -ForegroundColor Yellow
            }
        } until ($choice -in 0, 1)

        if ($choice -eq 0) {
            $Parameters.Value = 'marketplace'
        }

        Uninstall-WMPotify @Parameters
        }
        'Install' {
        if (-not (Test-Spotify)) {
            Write-Host -Object 'Spotify not found.' -ForegroundColor Yellow

            $Host.UI.RawUI.Flushinputbuffer()
            do {
                $choice = $Host.UI.PromptForChoice('', 'Install Spotify?', ('&Yes', '&No'), 0)
                if ($choice -notin 0, 1) {
                    Write-Host "Invalid choice. Please select Yes or No." -ForegroundColor Yellow
                }
            } until ($choice -in 0, 1)

            if ($choice -eq 1) {
                exit
            }

            Install-Spotify
        }

        if (-not $isSpicetifyInstalled) {
            Write-Host -Object 'Spicetify not found.' -ForegroundColor Yellow

            $Host.UI.RawUI.Flushinputbuffer()
            do {
                $choice = $Host.UI.PromptForChoice('', 'Install Spicetify?', ('&Yes', '&No'), 0)
                if ($choice -notin 0, 1) {
                    Write-Host "Invalid choice. Please select Yes or No." -ForegroundColor Yellow
                }
            } until ($choice -in 0, 1)
            if ($choice -eq 1) {
            exit
            }
            
            Install-Spicetify
            Install-Marketplace
        }

        $latestVersions = Get-LatestVersions

        if ($Install.Count -eq 0) {
            Write-Error -Message 'No components selected for installation.'
            exit
        }

        if ('ctewh' -in $Install) {
            if (-not (Test-Windhawk)) {
                Write-Host -Object 'Windhawk not found.' -ForegroundColor Yellow

                if (-not $NoAskCTEWH) {
                    $Host.UI.RawUI.Flushinputbuffer()
                    Write-Host -Object 'Windhawk is a customization marketplace for Windows programs.' -ForegroundColor Yellow
                    Write-Host -Object 'WMPotify can take advantage of a Windhawk mod called "CEF/Spotify Tweaks" to enhance the experience with WMPotify.' -ForegroundColor Yellow
                    Write-Host -Object 'The enhancements include enabling the native system title bar, using the system window appearance like Aero Glass or Mica, custom mini mode, playback speed control, and more.' -ForegroundColor Yellow
                    do {
                        $choice = $Host.UI.PromptForChoice('', 'Would you like to install Windhawk and the CEF/Spotify Tweaks mod?', ('&Yes', '&No'), 0)
                        if ($choice -notin 0, 1) {
                            Write-Host "Invalid choice. Please select Yes or No." -ForegroundColor Yellow
                        }
                    } until ($choice -in 0, 1)

                    if ($choice -eq 0) {
                        if ($isAdmin) {
                            Install-Windhawk
                            Install-WindhawkMod -LatestVersions $latestVersions
                        } else {
                            Invoke-AdminJob
                        }
                    }
                } else {
                    if ($isAdmin) {
                        Install-Windhawk
                        Install-WindhawkMod -LatestVersions $latestVersions
                    } else {
                        Invoke-AdminJob
                    }
                }
            } elseif (-not (Test-WindhawkMod)) {
                Write-Host -Object 'Windhawk is installed, but CEF/Spotify Tweaks mod is not installed or outdated.' -ForegroundColor Yellow

                if (-not $NoAskCTEWH) {
                    $Host.UI.RawUI.Flushinputbuffer()
                    Write-Host -Object 'CEF/Spotify Tweaks is a mod for Windhawk that enhances the experience with WMPotify.' -ForegroundColor Yellow
                    Write-Host -Object 'The enhancements include enabling the native system title bar, using the system window appearance like Aero Glass or Mica, custom mini mode, playback speed control, and more.' -ForegroundColor Yellow
                    do {
                        $choice = $Host.UI.PromptForChoice('', 'Would you like to install the CEF/Spotify Tweaks mod?', ('&Yes', '&No'), 0)
                        if ($choice -notin 0, 1) {
                            Write-Host "Invalid choice. Please select Yes or No." -ForegroundColor Yellow
                        }
                    } until ($choice -in 0, 1)

                    if ($choice -eq 0) {
                        if ($isAdmin) {
                            Install-WindhawkMod -LatestVersions $latestVersions
                        } else {
                            Invoke-AdminJob
                        }
                    }
                } else {
                    if ($isAdmin) {
                        Install-WindhawkMod -LatestVersions $latestVersions
                    } else {
                        Invoke-AdminJob
                    }
                }
            }
        }

        if ('wmpotify' -in $Install -or 'wmpvis' -in $Install) {
            $spicetifyFolders = Get-SpicetifyFoldersPaths
            $Parameters = @{
                ThemePath   = $spicetifyFolders.themePath
                VisAppPath  = $spicetifyFolders.visAppPath
                Config      = $spicetifyFolders.configPath
                ColorScheme = (Get-WindowsAppsTheme)
                GetWMPVis   = 'wmpvis' -in $Install
                SkipTheme   = 'wmpotify' -notin $Install
            }
            if ($GetFromGit) {
                $Parameters.Branch = $Version
            } else {
                if ($Version -eq 'latest') {
                    $Parameters.Tag = $latestVersions.Theme
                } else {
                    $Parameters.Tag = $Version
                }
            }

            Install-WMPotify @Parameters
        }
        }
    }
}
end {
    Write-ByeMessage
    Remove-Module -Name $moduleName -Force
    Remove-Item -Path $modulePath -Force
    [Console]::Title = $previousConsoleTitle
    Start-Sleep -Seconds 5
}