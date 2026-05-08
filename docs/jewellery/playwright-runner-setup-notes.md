# Playwright Runner Setup Notes (Senior Runner / Reporter)

Date: 2026-05-07
Repo: `/Users/akashkushwaha/Projects/money-mgmt`

## 1) Current Playwright and Docker Setup Findings

### Playwright
- Configs found:
  - `frontend/playwright.config.ts` (local webServer mode, baseURL `http://localhost:3100`)
  - `frontend/playwright.docker.config.ts` (Docker frontend mode, baseURL `http://localhost:3000`)
- E2E tests found in `frontend/tests/e2e`:
  - `api.spec.ts`
  - `portal.sanity.spec.ts`
  - `screens.spec.ts`
- Current suite size detected with `--list`: **11 tests in 3 files**.

### Docker
- Compose files found:
  - `backend/docker-compose.yml` (services: `db`, `backend`)
  - `frontend/docker-compose.yml` (service: `frontend`)
- Backend expected URL from tests/env: `http://localhost:8001/api`
- Frontend proxy/env is already wired to backend localhost.

### Local environment check executed
- Docker CLI present.
- Docker daemon was **not running** during inspection (`Cannot connect to the Docker daemon ...`).
- Playwright CLI present (`Version 1.59.1`).

## 2) Minimal Config Fixes Applied for Live Headed Runs + Artifacts

Implemented minimal runner-level improvements (no test logic changes):

- `frontend/playwright.config.ts`
  - Added reporters: `list` + `html` (`playwright-report`, `open: never`)
  - Added `outputDir: "test-results"`
  - Set artifact capture:
    - `trace: "retain-on-failure"`
    - `screenshot: "only-on-failure"`
    - `video: "retain-on-failure"`

- `frontend/playwright.docker.config.ts`
  - Same reporter/output/artifact settings as above.

- `frontend/package.json`
  - Added scripts:
    - `test:e2e:headed`
    - `test:e2e:docker`
    - `test:e2e:docker:headed`
    - `test:e2e:report`

Validation done after changes:
- `npm run test:e2e -- --list` ✅
- `npm run test:e2e:docker -- --list` ✅
- Both configs enumerate 11 tests successfully.

## 3) Runnable Plan for Live E2E Execution

### Recommended execution mode (stable for headed local browser)
Use Docker for backend/database only, and let Playwright start frontend itself on port 3100 via `webServer` in `playwright.config.ts`.

1. Start Docker daemon (Docker Desktop) and verify:
```bash
docker ps
```

2. Start backend + db:
```bash
cd /Users/akashkushwaha/Projects/money-mgmt/backend
docker compose up --build -d db backend
docker compose ps
docker compose logs -f backend
```

3. In a new terminal, install frontend deps and browsers (first run only):
```bash
cd /Users/akashkushwaha/Projects/money-mgmt/frontend
npm install
npx playwright install chromium
```

4. Run live headed suite:
```bash
cd /Users/akashkushwaha/Projects/money-mgmt/frontend
npm run test:e2e:headed
```

5. Open HTML report:
```bash
cd /Users/akashkushwaha/Projects/money-mgmt/frontend
npm run test:e2e:report
```

### Alternative mode (frontend already running in Docker on 3000)
1. Start backend:
```bash
cd /Users/akashkushwaha/Projects/money-mgmt/backend
docker compose up --build -d db backend
```

2. Start frontend container:
```bash
cd /Users/akashkushwaha/Projects/money-mgmt/frontend
docker compose up --build -d frontend
```

3. Run headed tests against Docker frontend:
```bash
cd /Users/akashkushwaha/Projects/money-mgmt/frontend
npm run test:e2e:docker:headed
```

## 4) Artifact/Debug Locations

From `frontend/`:
- HTML report: `playwright-report/index.html`
- Raw test artifacts: `test-results/`
  - Screenshots: saved for failures
  - Videos: retained for failures
  - Traces: retained for failures (`trace.zip`)

Useful commands:
```bash
# Show specific trace
npx playwright show-trace test-results/<test-name>/trace.zip

# Run one spec live/headed
npx playwright test tests/e2e/portal.sanity.spec.ts --headed --workers=1
```

## 5) Known Blocker Observed During This Setup Pass

- Docker daemon was not running at inspection time, so live end-to-end execution against backend services could not be started in this pass.
- Once Docker daemon is started, the above command flow is runnable.
