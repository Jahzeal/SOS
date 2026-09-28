Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\user\Desktop\SOS\apps\frontend\public\images\noxguardalogo.jpg"
$outDir = "c:\Users\user\Desktop\SOS\apps\frontend\public"

$srcBmp = New-Object System.Drawing.Bitmap($srcPath)

# Logo bounds in noxguardalogo.jpg:
# minX=122, maxX=469, minY=457, maxY=824, width=347, height=367
# Center is X=295.5, Y=640.5
# Max dimension is 367.
$centerX = 295.5
$centerY = 640.5
$cropSize = 420.0 # Includes a slight margin around the 367px logo

$cropRect = New-Object System.Drawing.RectangleF(
    ($centerX - ($cropSize / 2.0)),
    ($centerY - ($cropSize / 2.0)),
    $cropSize,
    $cropSize
)

function Create-Icon {
    param (
        [int]$size,
        [string]$outputPath,
        [string]$bgType = "white" # "white", "dark", or "dark_card"
    )

    $destBmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($bgType -eq "dark_card") {
        # #0F172A dark background with rounded white card inside
        $darkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
        $g.FillRectangle($darkBrush, 0, 0, $size, $size)
        $darkBrush.Dispose()

        # Rounded white container
        $cardMargin = [int]($size * 0.08)
        $cardSize = $size - (2 * $cardMargin)
        $cardRadius = [int]($size * 0.22)
        
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $cardRadius * 2
        $r = New-Object System.Drawing.Rectangle($cardMargin, $cardMargin, $cardSize, $cardSize)
        $path.AddArc($r.X, $r.Y, $d, $d, 180, 90)
        $path.AddArc($r.Right - $d, $r.Y, $d, $d, 270, 90)
        $path.AddArc($r.Right - $d, $r.Bottom - $d, $d, $d, 0, 90)
        $path.AddArc($r.X, $r.Bottom - $d, $d, $d, 90, 90)
        $path.CloseFigure()

        $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $g.FillPath($whiteBrush, $path)
        $whiteBrush.Dispose()
        $path.Dispose()

        # Draw logo inside white card
        $logoMargin = [int]($size * 0.18)
        $logoSize = $size - (2 * $logoMargin)
        $destRect = New-Object System.Drawing.Rectangle($logoMargin, $logoMargin, $logoSize, $logoSize)
        $g.DrawImage($srcBmp, $destRect, $cropRect.X, $cropRect.Y, $cropRect.Width, $cropRect.Height, [System.Drawing.GraphicsUnit]::Pixel)
    }
    elseif ($bgType -eq "white") {
        $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $g.FillRectangle($whiteBrush, 0, 0, $size, $size)
        $whiteBrush.Dispose()

        # Draw logo with 12% margin for maskable safe zone
        $margin = [int]($size * 0.12)
        $drawSize = $size - (2 * $margin)
        $destRect = New-Object System.Drawing.Rectangle($margin, $margin, $drawSize, $drawSize)
        $g.DrawImage($srcBmp, $destRect, $cropRect.X, $cropRect.Y, $cropRect.Width, $cropRect.Height, [System.Drawing.GraphicsUnit]::Pixel)
    }
    elseif ($bgType -eq "transparent") {
        # Transparent background (for favicon / tab icon)
        $g.Clear([System.Drawing.Color]::Transparent)
        $destRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
        $g.DrawImage($srcBmp, $destRect, $cropRect.X, $cropRect.Y, $cropRect.Width, $cropRect.Height, [System.Drawing.GraphicsUnit]::Pixel)
    }

    $g.Dispose()
    $destBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Generated: $outputPath ($size x $size, $bgType)"
}

# Generate PWA and Apple icons
Create-Icon -size 512 -outputPath "$outDir\icon-512.png" -bgType "white"
Create-Icon -size 192 -outputPath "$outDir\icon-192.png" -bgType "white"
Create-Icon -size 180 -outputPath "$outDir\apple-touch-icon.png" -bgType "white"
Create-Icon -size 64 -outputPath "$outDir\favicon-64.png" -bgType "white"
Create-Icon -size 32 -outputPath "$outDir\favicon-32.png" -bgType "white"
Create-Icon -size 192 -outputPath "$outDir\icon-maskable-192.png" -bgType "white"
Create-Icon -size 512 -outputPath "$outDir\icon-maskable-512.png" -bgType "white"

# Also generate dark card versions for preview
Create-Icon -size 512 -outputPath "$outDir\icon-512-dark.png" -bgType "dark_card"
Create-Icon -size 192 -outputPath "$outDir\icon-192-dark.png" -bgType "dark_card"

$srcBmp.Dispose()
Write-Host "All icons generated successfully!"
