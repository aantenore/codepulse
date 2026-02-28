# Trace fixtures

## trace-dump-otlp-real.json

**Trace reale** in formato OTLP (NDJSON) prodotto dal demo: due righe estratte da `temp/traces/trace-dump.json` dopo aver eseguito `./run_demo.ps1`. Contiene span da auth-service e product-service (es. `GET /health`) con attributi reali (http.route, service.name, ecc.).

Usalo per testare la generazione del report senza lanciare il demo:

```bash
# dalla root del repo (dopo pnpm build)
node packages/cli/dist/index.js generate --source ./playground --traces packages/cli/fixtures/trace-dump-otlp-real.json --output report.html --ai mock
```

Per aggiornare la fixture con un trace fresco dopo un demo:

```powershell
Get-Content temp/traces/trace-dump.json -TotalCount 2 | Set-Content packages/cli/fixtures/trace-dump-otlp-real.json
```
