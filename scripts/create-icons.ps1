# Creates minimal placeholder icons for first-time Tauri build
$iconsDir = Join-Path $PSScriptRoot "..\src-tauri\icons"
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

Add-Type -AssemblyName System.Drawing
$sizes = @(32, 128, 256)
foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(255, 124, 92, 191))
    $font = New-Object System.Drawing.Font "Segoe UI", ([int]($size / 4)), [System.Drawing.FontStyle]::Bold
    $g.DrawString("P", $font, [System.Drawing.Brushes]::White, ($size / 3), ($size / 3))
    $g.Dispose()
    $name = if ($size -eq 256) { "128x128@2x.png" } else { "${size}x${size}.png" }
    $bmp.Save((Join-Path $iconsDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# ICO for Windows
$bmp128 = New-Object System.Drawing.Bitmap 128, 128
$g = [System.Drawing.Graphics]::FromImage($bmp128)
$g.Clear([System.Drawing.Color]::FromArgb(255, 124, 92, 191))
$bmp128.Save((Join-Path $iconsDir "icon.ico"), [System.Drawing.Imaging.ImageFormat]::Icon)
$g.Dispose(); $bmp128.Dispose()

# ICNS placeholder: copy 128 png (mac build may want real icns later)
Copy-Item (Join-Path $iconsDir "128x128.png") (Join-Path $iconsDir "icon.icns") -Force
Write-Host "Icons created in $iconsDir"
