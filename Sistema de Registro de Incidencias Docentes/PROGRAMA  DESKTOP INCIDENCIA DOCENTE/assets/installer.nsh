!macro customInstall
  DetailPrint "Configurando inicio automático para todos los usuarios..."
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "Soporte TI" "$INSTDIR\Soporte TI.exe"
!macroend

!macro customUnInstall
  DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Run" "Soporte TI"
!macroend
