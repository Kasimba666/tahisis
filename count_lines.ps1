Get-ChildItem -Path src -Filter *.vue -Recurse | ForEach-Object {
    $name = $_.Name
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    Write-Host "$name - $lines"
}
