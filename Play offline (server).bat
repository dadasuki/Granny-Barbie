@echo off
setlocal EnableExtensions
title Site Saver - local server
cd /d "%~dp0"
set "SELFSRV=%~f0"
set "PSS=%TEMP%\ss_server_%RANDOM%.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -LiteralPath $env:SELFSRV | Where-Object { $_.StartsWith('::SRV|') } | ForEach-Object { $_.Substring(6) } | Set-Content -LiteralPath $env:PSS -Encoding UTF8"
if not exist "%PSS%" (
  echo Could not start PowerShell.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%PSS%" -Root "%CD%"
if exist "%PSS%" del "%PSS%" >nul 2>&1
echo.
pause
exit /b 0
::SRV|param([string]$Root)
::SRV|$ErrorActionPreference='Continue'
::SRV|try{ $root=(Resolve-Path -LiteralPath $Root).Path.TrimEnd('\') }catch{ $root=$Root.TrimEnd('\') }
::SRV|$mime=@{
::SRV| '.html'='text/html; charset=utf-8';'.htm'='text/html; charset=utf-8';
::SRV| '.js'='application/javascript';'.mjs'='application/javascript';'.css'='text/css';
::SRV| '.json'='application/json';'.wasm'='application/wasm';'.xml'='text/xml';
::SRV| '.txt'='text/plain; charset=utf-8';'.csv'='text/csv';'.webmanifest'='application/manifest+json';
::SRV| '.png'='image/png';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.gif'='image/gif';
::SRV| '.webp'='image/webp';'.avif'='image/avif';'.svg'='image/svg+xml';'.ico'='image/x-icon';'.bmp'='image/bmp';
::SRV| '.mp3'='audio/mpeg';'.ogg'='audio/ogg';'.oga'='audio/ogg';'.wav'='audio/wav';'.m4a'='audio/mp4';'.aac'='audio/aac';'.flac'='audio/flac';
::SRV| '.mp4'='video/mp4';'.webm'='video/webm';'.ogv'='video/ogg';'.mov'='video/quicktime';
::SRV| '.woff'='font/woff';'.woff2'='font/woff2';'.ttf'='font/ttf';'.otf'='font/otf';'.eot'='application/vnd.ms-fontobject';
::SRV| '.pdf'='application/pdf';'.zip'='application/zip';'.glb'='model/gltf-binary';'.gltf'='model/gltf+json';
::SRV| '.data'='application/octet-stream';'.unityweb'='application/octet-stream';'.pck'='application/octet-stream';'.bin'='application/octet-stream'
::SRV|}
::SRV|function Get-Mime([string]$p){
::SRV|  $n=$p.ToLower() -replace '\.(br|gz|gzip)$',''
::SRV|  $e=[IO.Path]::GetExtension($n)
::SRV|  if($mime.ContainsKey($e)){ return $mime[$e] }
::SRV|  return 'application/octet-stream'
::SRV|}
::SRV|$port=8777
::SRV|$listener=$null
::SRV|while($port -lt 8800 -and -not $listener){
::SRV|  try{
::SRV|    $l=New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback,$port)
::SRV|    $l.Start()
::SRV|    $listener=$l
::SRV|  }catch{ $port++ }
::SRV|}
::SRV|if(-not $listener){ Write-Host '  Could not open a local port (8777-8799).'; exit 1 }
::SRV|$url='http://localhost:'+$port+'/'
::SRV|Write-Host ''
::SRV|Write-Host ('  Serving : '+$root)
::SRV|Write-Host ('  Open    : '+$url)
::SRV|Write-Host ''
::SRV|Write-Host '  Keep this window open while you play. Press Ctrl+C to stop.'
::SRV|Write-Host ''
::SRV|try{ Start-Process $url }catch{ Write-Host ('  Open this in your browser: '+$url) }
::SRV|$enc=[Text.Encoding]::ASCII
::SRV|while($true){
::SRV|  $client=$null
::SRV|  try{
::SRV|    $client=$listener.AcceptTcpClient()
::SRV|    $client.NoDelay=$true
::SRV|    $client.ReceiveTimeout=1500
::SRV|    $client.SendTimeout=60000
::SRV|    $ns=$client.GetStream()
::SRV|    $buf=New-Object byte[] 8192
::SRV|    $head=''
::SRV|    while($head.IndexOf("`r`n`r`n") -lt 0){
::SRV|      $n=$ns.Read($buf,0,8192)
::SRV|      if($n -le 0){ break }
::SRV|      $head+=$enc.GetString($buf,0,$n)
::SRV|      if($head.Length -gt 65536){ break }
::SRV|    }
::SRV|    if($head.Length -lt 4){ $client.Close(); continue }
::SRV|    $lines=$head -split "`r`n"
::SRV|    $p0=$lines[0] -split ' '
::SRV|    $method=$p0[0]
::SRV|    $path=''
::SRV|    if($p0.Count -gt 1){ $path=$p0[1] }
::SRV|    $ae=''
::SRV|    foreach($h in $lines){ if($h -match '^(?i)accept-encoding:\s*(.*)$'){ $ae=$Matches[1] } }
::SRV|    $path=($path -split '\?')[0]
::SRV|    try{ $path=[Uri]::UnescapeDataString($path) }catch{}
::SRV|    if($path -eq '' -or $path -eq '/'){ $path='/index.html' }
::SRV|    $rel=$path.TrimStart('/').Replace('/','\')
::SRV|    $full=$null
::SRV|    try{ $full=[IO.Path]::GetFullPath((Join-Path $root $rel)) }catch{ $full=$null }
::SRV|    if($full -and -not $full.StartsWith($root,[StringComparison]::OrdinalIgnoreCase)){ $full=$null }
::SRV|    if($full -and (Test-Path -LiteralPath $full -PathType Container)){ $full=Join-Path $full 'index.html' }
::SRV|    if($full -and (Test-Path -LiteralPath $full -PathType Leaf)){
::SRV|      $low=$full.ToLower()
::SRV|      $extra=''
::SRV|      $src=$null
::SRV|      if($low.EndsWith('.br')){
::SRV|        $extra="Content-Encoding: br`r`n"
::SRV|        $src=[IO.File]::OpenRead($full)
::SRV|      }
::SRV|      elseif($low.EndsWith('.gz') -or $low.EndsWith('.gzip')){
::SRV|        if($ae -match 'gzip'){
::SRV|          $extra="Content-Encoding: gzip`r`n"
::SRV|          $src=[IO.File]::OpenRead($full)
::SRV|        } else {
::SRV|          $ms=New-Object IO.MemoryStream
::SRV|          $fs=[IO.File]::OpenRead($full)
::SRV|          $gz=New-Object IO.Compression.GZipStream -ArgumentList $fs,([IO.Compression.CompressionMode]::Decompress)
::SRV|          $gz.CopyTo($ms)
::SRV|          $gz.Close(); $fs.Close()
::SRV|          $ms.Position=0
::SRV|          $src=$ms
::SRV|        }
::SRV|      }
::SRV|      else{ $src=[IO.File]::OpenRead($full) }
::SRV|      $hdr="HTTP/1.1 200 OK`r`nContent-Type: "+(Get-Mime $full)+"`r`nContent-Length: "+$src.Length+"`r`n"+$extra+"Cache-Control: no-store`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
::SRV|      $hb=$enc.GetBytes($hdr)
::SRV|      $ns.Write($hb,0,$hb.Length)
::SRV|      if($method -ne 'HEAD'){ $src.CopyTo($ns) }
::SRV|      $src.Close()
::SRV|    }
::SRV|    else{
::SRV|      $msg=$enc.GetBytes('404 Not Found')
::SRV|      $hdr="HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: "+$msg.Length+"`r`nConnection: close`r`n`r`n"
::SRV|      $hb=$enc.GetBytes($hdr)
::SRV|      $ns.Write($hb,0,$hb.Length)
::SRV|      if($method -ne 'HEAD'){ $ns.Write($msg,0,$msg.Length) }
::SRV|      Write-Host ('  404  '+$path)
::SRV|    }
::SRV|    $ns.Flush()
::SRV|  }catch{}
::SRV|  finally{ if($client){ try{ $client.Close() }catch{} } }
::SRV|}
