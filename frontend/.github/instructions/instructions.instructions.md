---
applyTo: '**'
---
# API Summary & Frontend Integration Guide

Purpose
- Provide a concrete, repeatable integration guide to implement a frontend for the beverage-distribution API and to generate an Angular 21 project from existing templates.
- Follow the repository rules: always check `TASKS_COMPLETED.md` before automated runs, never modify original Template files in-place, and maintain tracking files.

IMPORTANT: Always read `TASKS_COMPLETED.md` at the repository root before making changes or generating a frontend. Re-check it on each run to avoid regressions.

---

## Quick Overview (entities & behavior)
- User roles: Admin, Agent_industrielle, Agent_commercial, Vendeur (email is username).
- StockBrute: raw stock containers (3 types) and basic endpoints to augment/diminish/inspect.
- Bouteille: created by consuming StockBrute of the requested type.
- Boite: cartons built from bottles; carton sizes have fixed bottle counts:
  - Carton 1L: 15 bottles
  - Carton 1/2L: 30 bottles
  - Carton 2L: 8 bottles
  - Carton 5L: 6 bottles
- Emballage (chariots): collections of boxes; all emballage changes must emit a STOCK_CHANGED webhook with `category=EMBALLAGE`.
- Vente: unified sales with `type` in { AU_VENDEUR, DU_VENDEUR }.
- WebhookSubscription: endpoint subscriptions to events (STOCK_CHANGED, VENTE_AU_VENDEUR_CREATED, VENTE_DU_VENDEUR_CREATED).

---

## High-level API endpoints
- POST /api/auth/signup, POST /api/auth/login, POST /api/auth/logout
- /api/stock-brute (increase, decrease, quantity)
- /api/industrial/bouteilles (create bottles)
- /api/commercial (types, litrages, bouteilles, boites)
- /api/emballage (chariots listing, summary, add/remove chariot, add/remove boite)
- /api/ventes (create and list unified sales)
- /api/webhooks/subscriptions (create/list/delete)

OpenAPI/Swagger:
- Local Definition: `backend-info/openapi.yaml` (Use this as the source of truth)
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI YAML: http://localhost:8080/openapi.yaml
- Static OpenAPI: http://localhost:8080/static/openapi.yaml

---

## Integration Principles / Constraints
1. Never change original template files under `Template/`. Copy fragments into Angular component templates instead.
2. Always use Angular CLI to generate components, services and modules. Do not create Angular artifacts manually.
3. Do not use standalone components; use NgModules (`--standalone=false`).
4. Use this project structure inside the Angular app: `src/app/components/`, `src/app/services/`, `src/app/modules/`.
5. Remove or do not port inputs asking for sensitive data (passwords, private keys, SSNs, tokens). Document removals in the tracking file.
6. Maintain tracking files: one at the repository root and one inside the generated `frontend/` project. Update for every CLI command and significant step.
7. Separate frontend logic from component logic: keep components lightweight (view logic only) and move business/API logic to Services.
8. Component styling must be done using CSS exclusively (no SCSS/SASS). Styling must be an exact copy of the templates.
9. Note: The `template/dark-mode` directory contains examples only. Use `template/light-mode` (or others) as the structural source.
10. Webhooks/Caching: In the backend definition, webhooks are defined. These must be used to reduce backend requests by caching display data in the frontend. Only call the backend to refresh data when a webhook change is detected.

---

## Files you must have or create (tracking and audit)
- `TASKS_COMPLETED.md` (root) — always read before making changes. If missing, create it and add a first-line note.
- `frontend/TASKS_COMPLETED.md` — identical tracking inside the Angular project after generation.

Tracking entry format suggestion (append a line per step):
- YYYY-MM-DDThh:mm:ssZ | actor: <your-name-or-agent> | command: <exact-cmd-run> | result: <short summary>

---

## Concrete Angular Quickstart (Windows cmd.exe compatible)
Prereqs
- Node.js LTS (v20+ recommended)
- npm
- Angular CLI 21.x (use npx to avoid global installs)

1) Create a new Angular project (CLI-only, cmd.exe syntax):

```cmd
npx -p @angular/cli@21 ng new frontend --routing --style=css --standalone=false
cd frontend
npm install
```

Notes:
- The `--standalone=false` flag keeps the project NgModule-based.
- If the CLI prompts, choose defaults or explicit flags to make the project strict if desired.
- Before running the CLI command, add a tracking entry in `TASKS_COMPLETED.md` recording the exact command.

2) Project layout policy (inside `frontend/src/app`):
- Components: `src/app/components/` (generate components here with CLI)
- Services: `src/app/services/` (generate services here with CLI)
- Modules: `src/app/modules/` (for grouped features and lazy-loaded route modules)

CLI examples (use inside `frontend`):

```cmd
ng generate component components/auth --module app
ng generate component components/dashboard --module app
ng generate component components/stock-brut --module app
ng generate component components/industrial --module app
ng generate component components/commercial --module app
ng generate component components/emballage --module app
ng generate component components/ventes --module app

ng generate service services/auth
ng generate service services/api-client
ng generate service services/stock
```

When you run each `ng generate` command, append a tracking entry to `frontend/TASKS_COMPLETED.md` with the command and result.

3) Generate API client from OpenAPI (pick one):

Option A — ng-openapi-gen (recommended for tight Angular integration)
- Add config `ng-openapi-gen.json` pointing at `http://localhost:8080/openapi.yaml` and output to `src/app/api`.

Option B — openapi-generator (typescript-angular)
- Use OpenAPI Generator to produce a full Angular client.

Option C — openapi-typescript-codegen
- Produces a lightweight TypeScript client (fetch/axios).

Example (ng-openapi-gen):
```cmd
npm install --save-dev ng-openapi-gen
npx ng-openapi-gen --config ng-openapi-gen.json
```

Record the generator command and result in the tracking file.

4) Configure environment
- Set `environment.apiBaseUrl = 'http://localhost:8080'` in Angular `environment.ts`/`environment.prod.ts`.
- Document any runtime overrides in the top-level README.

5) JWT interceptor
- Create `JwtInterceptor` under `src/app/services/` or `src/app/interceptors/` via CLI (generate a service and then register it in `app.module.ts`).
- Behavior summary:
  - Read token from `sessionStorage` (or a small `AuthService` memory store).
  - Skip requests to `/api/auth/`.
  - Add `Authorization: Bearer <token>` to other requests.
  - On 401, redirect to login and clear token.

Interceptor skeleton (for developer reference — put the actual file into the Angular project):

```ts
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = sessionStorage.getItem('token');
    const skip = req.url.includes('/api/auth/');
    if (!token || skip) return next.handle(req);
    const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next.handle(authReq).pipe(
      catchError(err => {
        if (err.status === 401) { /* navigate to login and clear state */ }
        return throwError(() => err);
      })
    );
  }
}
```

Register the interceptor in `app.module.ts` providers.

6) AuthService responsibilities
- `signup`, `login`, `logout`, `getRoles`, `isAuthenticated`.
- Persist token in `sessionStorage` and emit an observable auth state for components.

7) Route guards
- Create role-based `CanActivate` guards and wire them into routing.
- Example guards: `AdminGuard`, `CommercialAgentGuard`, `VendorGuard`.

8) Webhook refresh strategies
Browser SPAs cannot receive server webhooks directly. Recommended options:
- Option A: Public proxy receiver + WebSocket push
  - Small public endpoint receives webhooks then notifies SPA via WebSocket or SSE.
- Option B: Polling fallback
  - Poll key endpoints (stock, ventes) every 15–30s and on page focus or after mutations.
- Option C: Hybrid
  - Poll when no push-layer is available, otherwise use push notifications.

Implementation note: On webhook reception the backend should emit a small event to connected SPA clients, which triggers refetch of stocks/ventes.

9) UI components to build (minimum MVP):
- Auth: login/signup/logout
- Dashboard: overall stock, emballage summary, recent ventes
- StockBrut: view quantities, increase/decrease
- Industrial: create bottles from StockBrute
- Commercial: create bottles and boites; validate boite ratios client-side before sending
- Emballage: list chariots, add/remove chariot, add/remove boite, summary
- Ventes: create unified vente (AU_VENDEUR or DU_VENDEUR) and list/filter

10) Boite ratio validation (client-side)
- Enforce the bottle counts for each carton type before submitting:
  - 1L -> 15
  - 1/2L -> 30
  - 2L -> 8
  - 5L -> 6
- If a template in `Template/` asks for a password or other sensitive data, do not port it.

11) Example unified vente payload

```json
{
  "type": "AU_VENDEUR",
  "vendeurId": "123",
  "lignes": [
    { "typeLigne": "BOITE", "produitId": "10", "quantite": 3, "prixUnitaire": 50.0 },
    { "typeLigne": "BOUTEILLE", "produitId": "42", "quantite": 10, "prixUnitaire": 5.0 }
  ]
}
```

---

## Commands & Examples (Windows cmd.exe)
- Check node and npm versions:

```cmd
node -v
npm -v
```

- Create Angular project (record this command first in `TASKS_COMPLETED.md`):

```cmd
npx -p @angular/cli@21 ng new frontend --routing --style=css --standalone=false
cd frontend
npm install
```

- Generate components and services (examples):

```cmd
cd frontend
ng generate component components/stock-brut --module app
ng generate service services/auth
```

- Generate OpenAPI client (ng-openapi-gen example):

```cmd
npm install --save-dev ng-openapi-gen
npx ng-openapi-gen --config ng-openapi-gen.json
```

- Serve locally:

```cmd
cd frontend
ng serve
```

- Build for production:

```cmd
cd frontend
ng build --configuration production
```

---

## Docker / Deployment notes
- If the repo includes `frontend/Dockerfile`, copy the Angular `dist/<app>` artifacts into the Docker context expected by the Dockerfile (often `frontend/public/`) before running `docker compose up`.
- Example: build the app then copy files into the Docker context as part of CI.

---

## Security & Sensitive Data
- Never store tokens or secrets in repository files.
- Do not port inputs that collect passwords, SSNs, private keys, or tokens. Replace them with non-sensitive placeholders if necessary and document the change in `TASKS_COMPLETED.md`.

---

## Tests & Quality gates
- Add a small set of unit tests for critical business logic: boite ratio validation, stock consumption when creating bouteilles, and the JWT interceptor behavior on 401.
- Validate builds locally: `ng build` and `npm test` in the `frontend` folder.
- Add entries to both tracking files when tests are added / executed.

---

## Minimal "contract" for frontend modules (suggested)
- Inputs: API base URL (environment), JWT token via AuthService, OpenAPI-generated models
- Outputs: HTTP requests to API endpoints listed above; UI events for successful mutations
- Error modes: 400 validation, 401 auth (redirect), 5xx backend errors (display toast/notification)

---

## Edge cases to consider
- Network offline or intermittent: show cached values and retry background sync.
- Race conditions: multiple clients mutating stock; prefer server-side validation and optimistic UI updates with re-fetch on confirmation.
- Partial failures in vente creation (some lignes succeed): handle with clear error messages and server-provided rollback/reconciliation.

---

## Checklist (read/mechanic before running automation)
- [ ] Confirm `TASKS_COMPLETED.md` exists and read it.
- [ ] Add a tracking entry before each CLI command.
- [ ] Use Angular CLI for every component/service/module generation.
- [ ] Do not modify files in `Template/`; copy fragments only.
- [ ] Remove or replace sensitive inputs and document in tracking file.
- [ ] Generate OpenAPI client and record the command.
- [ ] Implement JWT interceptor and register it.
- [ ] Implement basic polling or push integration to refresh stock on webhook events.
- [ ] Run `ng build` and `npm test` and record results.

---

## Where to put this guide
- This file should live at repository root: `INTEGRATION_INSTRUCTIONS.md`.
- Keep `TASKS_COMPLETED.md` in the repo root and inside the `frontend/` project after generating it.

---

If you'd like, I can also:
- Create an initial `frontend/TASKS_COMPLETED.md` template and a root `TASKS_COMPLETED.md` if missing.
- Generate the exact `ng` CLI commands for all the listed components and append sample tracking entries.

Tell me which of the above you'd like me to perform next (create tracking files, run the Angular CLI to scaffold a `frontend/` project, or only add generator commands).

## additional rules
- when saing that you are only allowed to use css for styling, i only prevented you from using tailwindcss , but you can use sass/scss if it needed, in addition to using componets laibraries for logos like lucide-icons
- when designing the styling and the ui, keep in mind that the app should be reactive and mobile friendly (take a deep interest in the sizes that you use)
- if anithing is unclear or you need more information, ask me before proceeding, you are not allowed to assume or remove any features