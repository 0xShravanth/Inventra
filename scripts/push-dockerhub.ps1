param(
    [Parameter(Mandatory = $true)]
    [string]$DockerUser,

    [string]$ImageName = "inventra-backend",
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $RepoRoot "backend"
$FullImage = "${DockerUser}/${ImageName}:${Tag}"

Write-Host "Building $FullImage from $BackendDir ..."
Push-Location $BackendDir
try {
    docker build -t $FullImage .
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "Pushing $FullImage ..."
    docker push $FullImage
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host ""
    Write-Host "Done. Image: docker.io/$FullImage"
    Write-Host "Deploy on Render: Existing Image -> docker.io/$FullImage"
    Write-Host "Set DATABASE_URL (Neon) in the host environment."
}
finally {
    Pop-Location
}
