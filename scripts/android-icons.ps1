param(
    [string]$SourcePath = (Join-Path $PSScriptRoot '../assets/android/app-icon.png')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$resourceRoot = Join-Path $projectRoot 'android/app/src/main/res'
if (-not (Test-Path -LiteralPath $resourceRoot -PathType Container)) {
    throw 'Le projet Android est absent. Executez npm run android:prepare avant de generer les icones.'
}
if (-not (Test-Path -LiteralPath $SourcePath -PathType Leaf)) {
    throw "L'image source est absente : $SourcePath"
}

Add-Type -AssemblyName System.Drawing
$sourceImage = [System.Drawing.Image]::FromFile([System.IO.Path]::GetFullPath($SourcePath))

function Write-LauncherBitmap {
    param(
        [System.Drawing.Image]$Image,
        [int]$CanvasSize,
        [int]$ArtworkSize,
        [string[]]$OutputPaths
    )

    $bitmap = [System.Drawing.Bitmap]::new(
        $CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    $graphics = $null
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        $offset = [int](($CanvasSize - $ArtworkSize) / 2)
        $bounds = [System.Drawing.Rectangle]::new($offset, $offset, $ArtworkSize, $ArtworkSize)
        $imageAttributes = [System.Drawing.Imaging.ImageAttributes]::new()
        try {
            $imageAttributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
            $graphics.DrawImage(
                $Image, $bounds, 0, 0, $Image.Width, $Image.Height,
                [System.Drawing.GraphicsUnit]::Pixel, $imageAttributes
            )
        }
        finally {
            $imageAttributes.Dispose()
        }

        foreach ($outputPath in $OutputPaths) {
            $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        }
    }
    finally {
        if ($null -ne $graphics) { $graphics.Dispose() }
        $bitmap.Dispose()
    }
}

try {
    if ($sourceImage.Width -ne $sourceImage.Height) {
        throw "L'image source doit etre carree ; ce script ne recadre pas le visuel."
    }

    $densities = @(
        @{ Name = 'mdpi'; Scale = 1 },
        @{ Name = 'hdpi'; Scale = 1.5 },
        @{ Name = 'xhdpi'; Scale = 2 },
        @{ Name = 'xxhdpi'; Scale = 3 },
        @{ Name = 'xxxhdpi'; Scale = 4 }
    )
    foreach ($density in $densities) {
        $directory = Join-Path $resourceRoot ('mipmap-' + $density.Name)
        [System.IO.Directory]::CreateDirectory($directory) | Out-Null
        $legacySize = [int](48 * $density.Scale)
        Write-LauncherBitmap -Image $sourceImage -CanvasSize $legacySize -ArtworkSize $legacySize -OutputPaths @(
            (Join-Path $directory 'ic_launcher.png'),
            (Join-Path $directory 'ic_launcher_round.png')
        )
        Write-LauncherBitmap -Image $sourceImage -CanvasSize ([int](108 * $density.Scale)) -ArtworkSize ([int](60 * $density.Scale)) -OutputPaths @(
            (Join-Path $directory 'ic_launcher_foreground.png')
        )
    }

    $adaptiveDirectory = Join-Path $resourceRoot 'mipmap-anydpi-v26'
    $valuesDirectory = Join-Path $resourceRoot 'values'
    [System.IO.Directory]::CreateDirectory($adaptiveDirectory) | Out-Null
    [System.IO.Directory]::CreateDirectory($valuesDirectory) | Out-Null
    $utf8 = [System.Text.UTF8Encoding]::new($false)
    $adaptiveXml = @'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
'@
    foreach ($fileName in @('ic_launcher.xml', 'ic_launcher_round.xml')) {
        [System.IO.File]::WriteAllText((Join-Path $adaptiveDirectory $fileName), $adaptiveXml + "`n", $utf8)
    }
    $backgroundXml = @'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FF9F1C</color>
</resources>
'@
    [System.IO.File]::WriteAllText((Join-Path $valuesDirectory 'ic_launcher_background.xml'), $backgroundXml + "`n", $utf8)
}
finally {
    $sourceImage.Dispose()
}

Write-Output "Icones Android generees depuis assets/android/app-icon.png ; aucune autre ressource du jeu ou du splash n'a ete modifiee."
