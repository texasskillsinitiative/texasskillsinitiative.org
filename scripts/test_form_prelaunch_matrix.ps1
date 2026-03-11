param(
  [string]$Endpoint = "https://script.google.com/macros/s/AKfycbyXeBfOxrud6Auh-UrHMGKbE_ud9dE8ppsjjK792q2CF_UlRnnpkaC2_g22Dju6oUWH/exec",
  [string]$Email = "themrsteiner@gmail.com",
  [int]$DelaySeconds = 31,
  [switch]$RunPositive = $true,
  [switch]$RunNegative = $true
)

$ErrorActionPreference = 'Stop'

function New-SubmissionId([string]$label) {
  return ("prelaunch-" + $label + "-" + (Get-Date -Format "yyyyMMddHHmmss") + "-" + (Get-Random -Minimum 1000 -Maximum 9999))
}

function New-BasePayload([string]$route) {
  return [ordered]@{
    submission_id = New-SubmissionId $route
    submission_type = $route
    name = "TSI Prelaunch Test"
    email = $Email
    loc_city = "Austin"
    loc_country = "United States"
    loc_state = "Texas"
    message = "Prelaunch matrix submission for $route."
    timestamp_local = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss zzz")
    page_path = "/prelaunch-test"
    referrer = "scripts/test_form_prelaunch_matrix.ps1"
  }
}

function Add-RouteFields([hashtable]$payload, [string]$route, [string]$track, [string]$tier) {
  if ($route -eq "stakeholder") {
    $payload.handler_tier = $tier
    $payload.concierge_track = $track
    if ($tier -eq "1") {
      $payload.org = "TSI Regional Council"
      $payload.role = "Regional Program Director"
    } else {
      $payload.focus = "Pathways, workforce design, and deployment outcomes."
    }
    return
  }
  if ($route -eq "investment") {
    $payload.role = "Managing Partner"
    $payload.investment_stage = "Growth"
    $payload.investment_check_range = '$250k-$1M'
    $payload.investment_geography = "Texas Triangle"
    $payload.investment_focus = "Workforce infrastructure"
    $payload.investment_timeline = "90 days"
    return
  }
  if ($route -eq "press") {
    $payload.press_deadline_mode = "no_deadline"
    $payload.press_outlet = "TSI Test Wire"
    $payload.press_role = "Reporter"
    $payload.press_topic = "Regional workforce model"
    $payload.press_format = "Email interview"
    return
  }
  if ($route -eq "employment") {
    $payload.org = "TSI Employer Partner Network"
    $payload.employment_role_interest = "Operations Analyst"
    $payload.employment_timeline = "Within 30 days"
    $payload.employment_location_pref = "Austin Metro"
    return
  }
  if ($route -eq "internship") {
    $payload.intern_school = "University of Texas at Austin"
    $payload.intern_program = "Public Policy"
    $payload.intern_grad_date = "2027-05"
    $payload.intern_track = "Research"
    $payload.intern_mode = "Hybrid"
    $payload.intern_hours_per_week = "20"
    $payload.intern_start_date = "2026-06-01"
    $payload.intern_portfolio_url = "https://example.com/portfolio"
    return
  }
}

function Invoke-Submit([hashtable]$payload, [string]$caseName) {
  $json = $payload | ConvertTo-Json -Depth 12 -Compress
  $result = [ordered]@{
    case = $caseName
    submission_id = [string]$payload.submission_id
    http_ok = $false
    app_ok = $false
    response = ""
    utc = (Get-Date).ToUniversalTime().ToString("o")
  }
  try {
    $resp = Invoke-WebRequest -Uri $Endpoint -Method Post -ContentType "application/json" -Body $json -UseBasicParsing
    $result.http_ok = $true
    $result.response = [string]$resp.Content
    try {
      $obj = $result.response | ConvertFrom-Json
      if ($null -ne $obj.ok) { $result.app_ok = [bool]$obj.ok }
    } catch {}
  } catch {
    $result.response = $_.Exception.Message
  }
  return [pscustomobject]$result
}

$cases = @()

if ($RunPositive) {
  $cases += [pscustomobject]@{ name = "pos-stakeholder-government"; route = "stakeholder"; track = "government"; tier = "1"; mutate = $null }
  $cases += [pscustomobject]@{ name = "pos-stakeholder-professional"; route = "stakeholder"; track = "professional"; tier = "2"; mutate = $null }
  $cases += [pscustomobject]@{ name = "pos-investment"; route = "investment"; track = "investment_portal"; tier = ""; mutate = $null }
  $cases += [pscustomobject]@{ name = "pos-press"; route = "press"; track = "press_portal"; tier = ""; mutate = $null }
  $cases += [pscustomobject]@{ name = "pos-employment"; route = "employment"; track = "employment_portal"; tier = ""; mutate = $null }
  $cases += [pscustomobject]@{ name = "pos-internship"; route = "internship"; track = "internship_portal"; tier = ""; mutate = $null }
}

if ($RunNegative) {
  $cases += [pscustomobject]@{ name = "neg-invalid-email"; route = "stakeholder"; track = "government"; tier = "1"; mutate = { param($p) $p.email = "invalid" } }
  $cases += [pscustomobject]@{ name = "neg-missing-required-message"; route = "stakeholder"; track = "education"; tier = "1"; mutate = { param($p) $p.message = "" } }
  $cases += [pscustomobject]@{ name = "neg-press-missing-deadline"; route = "press"; track = "press_portal"; tier = ""; mutate = { param($p) $p.Remove("press_deadline_mode"); $p.Remove("press_deadline") } }
  $cases += [pscustomobject]@{ name = "neg-invalid-attachment-type"; route = "employment"; track = "employment_portal"; tier = ""; mutate = { param($p) $p.attachment_data = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("bad-file")); $p.attachment_name = "malware.exe"; $p.attachment_type = "application/octet-stream"; $p.attachment_size = "8" } }
  $dup = New-SubmissionId "dup-shared"
  $cases += [pscustomobject]@{ name = "neg-duplicate-submission-id-1"; route = "investment"; track = "investment_portal"; tier = ""; mutate = { param($p) $p.submission_id = $dup } }
  $cases += [pscustomobject]@{ name = "neg-duplicate-submission-id-2"; route = "investment"; track = "investment_portal"; tier = ""; mutate = { param($p) $p.submission_id = $dup } }
}

$results = @()
for ($i = 0; $i -lt $cases.Count; $i++) {
  $c = $cases[$i]
  $payload = New-BasePayload $c.route
  Add-RouteFields -payload $payload -route $c.route -track $c.track -tier $c.tier
  if ($c.mutate) { & $c.mutate $payload }

  $r = Invoke-Submit -payload $payload -caseName $c.name
  $results += $r
  Write-Output ("[{0}] {1} | id={2} | http_ok={3} | app_ok={4}" -f (Get-Date -Format "HH:mm:ss"), $r.case, $r.submission_id, $r.http_ok, $r.app_ok)
  if ($i -lt ($cases.Count - 1)) { Start-Sleep -Seconds $DelaySeconds }
}

$summary = [ordered]@{
  endpoint = $Endpoint
  email = $Email
  delay_seconds = $DelaySeconds
  total = $results.Count
  http_ok_count = ($results | Where-Object { $_.http_ok }).Count
  app_ok_count = ($results | Where-Object { $_.app_ok }).Count
  utc_finished = (Get-Date).ToUniversalTime().ToString("o")
  results = $results
}

$summary | ConvertTo-Json -Depth 8
