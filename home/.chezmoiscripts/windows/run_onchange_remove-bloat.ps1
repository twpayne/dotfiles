# To run this script:
# 1. Run Windows PowerShell as Administrator
# 2. Run `Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope Process`
# 3. Run `chezmoi apply ~/.chezmoiscripts/windows/remove-bloat.ps1`
#
# FIXME automate running this script as Administrator

# FIXME remove CoPilot
# FIXME remove Spotify
# FIXME remove LinkedIn
# FIXME remove Windows 11 bottom left widget

Get-AppxPackage -AllUsers Clipchamp.Clipchamp | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.549981C3F5F10 | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.BingNews | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.BingWeather | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.GamingApp | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.GetHelp | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.Getstarted | Remove-AppPackage
Get-AppxPackage -AllUsers Microsoft.Microsoft3DViewer | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.MicrosoftOfficeHub | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.MicrosoftSolitaireCollection | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.MicrosoftStickyNotes | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.MixedReality.Portal | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.MSPaint | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.OutlookForWindows | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.Paint | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.People | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.ScreenSketch | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.SkypeApp | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.StorePurchaseApp | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.Windows.Photos | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.WindowsAlarms | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.WindowsCalculator | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.WindowsCamera | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.WindowsCommunicationsApps | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.WindowsFeedbackHub | Remove-AppPackage
Get-AppxPackage -AllUsers Microsoft.WindowsMaps | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.WindowsSoundRecorder | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.WindowsStore | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.Xbox.TCUI | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.XboxApp | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.XboxGameOverlay | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.XboxGamingOverlay | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.XboxIdentityProvider | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.XboxSpeechToTextOverlay | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.YourPhone | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.ZuneMusic | Remove-AppxPackage
Get-AppxPackage -AllUsers Microsoft.ZuneVideo | Remove-AppxPackage

# https://learn.microsoft.com/en-us/answers/questions/1421927/uninstall-unpin-spotify-whatsapp-etc-using-script

$Junk = "xbox|phone|disney|skype|spotify|groove|solitaire|zune|mixedreality|tiktok|adobe|prime|soundrecorder|bingweather!3dviewer"
"Removing apps for this user only."
$packages = Get-AppxPackage | Where-Object {  $_.Name -match $Junk  } | Where-Object -Property NonRemovable -eq $false 
foreach ($appx in $packages) {
    "Removing {0}" -f $appx.name
    Remove-AppxPackage $appx   
}
""
"Removing apps for all users."
$packages = Get-AppxPackage -AllUsers | Where-Object {  $_.Name -match $Junk  } | Where-Object -Property NonRemovable -eq $false 
foreach ($appx in $packages) {
    "Removing {0}" -f $appx.name
    Remove-AppxPackage $appx -AllUsers 
}
""
"Removing provisioned apps."
$packages = Get-AppxProvisionedPackage -Online | Where-Object {  $_.DisplayName -match $Junk  }
foreach ($appx in $packages) {
    "Removing {0}" -f $appx.displayname
    Remove-AppxProvisionedPackage -online -allusers -PackageName $appx.PackageName 
}