# Local performance — 0.2.0-rc.1

Production Next.js on local Windows/Node 24.20.0. Three synthetic projects, 96 snapshots each, authenticated dashboard requests. Not a Railway benchmark or long-duration soak test.

| Concurrency | Requests | Errors | p50 ms | p95 ms |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 30 | 0 | 17.85 | 32.05 |
| 8 | 80 | 0 | 26.27 | 201.59 |
| 32 | 160 | 0 | 90.19 | 317.5 |

Web-server working set after run: 260.5 MiB; observed peak: 268.2 MiB. Worker, container overhead and Railway costs are not included. Raw results: verification/benchmark.json.
