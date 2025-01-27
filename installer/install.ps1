[CmdletBinding()]
param (
    [ValidateSet('Install', 'Uninstall', 'Update','Beta')]
    [string]$Action = 'Install'
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
        'https://gist.githubusercontent.com/sanoojes/a6fc3176428f61fe80d580ac92c51de4/raw/05016fb7c74721dfe0434a9b130ea491edbd19b8/Functions.psm1'
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
    
    $isSpicetifyInstalled = Test-Spicetify
    
    switch ($Action) {
        'Uninstall' {
        if (-not $isSpicetifyInstalled) {
            Write-Error -Message 'Failed to detect Spicetify installation!'
        }
        
        $spicetifyFolders = Get-SpicetifyFoldersPaths
        $Parameters = @{
            Path   = $spicetifyFolders.themePath
            Config = $spicetifyFolders.configPath
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
        'Update' {
        if (-not $isSpicetifyInstalled) {
            Write-Error -Message 'Failed to detect Spicetify installation!'
        }
        
        $spicetifyFolders = Get-SpicetifyFoldersPaths
        $Parameters = @{
            Destination = $spicetifyFolders.themePath
            Config      = $spicetifyFolders.configPath
            Type        = (Get-ThemeType -Path $spicetifyFolders.themePath)
        }
        Install-WMPotify @Parameters
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
    
        $spicetifyFolders = Get-SpicetifyFoldersPaths
        $Parameters = @{
            Destination = $spicetifyFolders.themePath
            Config      = $spicetifyFolders.configPath
            ColorScheme = (Get-WindowsAppsTheme)
        }
        
        Install-WMPotify @Parameters
        }
        'Beta' {  
            if (-not $isSpicetifyInstalled) {
                Write-Error -Message 'Failed to detect Spicetify installation!'
            }
            
            $spicetifyFolders = Get-SpicetifyFoldersPaths
            $Parameters = @{
                Destination = $spicetifyFolders.themePath
                Config      = $spicetifyFolders.configPath
                Type        = 'Local'
                Branch      = 'beta'  
            }
            Install-WMPotify @Parameters
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