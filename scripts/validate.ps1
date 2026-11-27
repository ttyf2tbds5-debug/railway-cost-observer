$ErrorActionPreference = 'Stop'
function Invoke-CheckedNpm {
    param([string[]]$NpmArguments)
    & npm @NpmArguments
    if ($LASTEXITCODE -ne 0) { throw "npm check failed: $($NpmArguments -join ' ')" }
}
Invoke-CheckedNpm @('run', 'db:deploy')
Invoke-CheckedNpm @('run', 'typecheck')
Invoke-CheckedNpm @('run', 'lint')
Invoke-CheckedNpm @('test', '--', '--reporter=default', '--reporter=json', '--outputFile=test-results/unit.json')
Invoke-CheckedNpm @('run', 'build')
Invoke-CheckedNpm @('run', 'test:e2e')
& node scripts/check-examples.mjs
if ($LASTEXITCODE -ne 0) { throw 'Example verification failed' }
& node scripts/benchmark.mjs
if ($LASTEXITCODE -ne 0) { throw 'Benchmark failed' }
& npm audit --json | Set-Content -Encoding utf8 -LiteralPath test-results/npm-audit.json
if ($LASTEXITCODE -ne 0) { throw 'Dependency audit failed' }
Write-Output 'Local validation passed. Docker and live bearer-token integration remain separate release gates.'
