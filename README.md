# hacom-cloud-admin-panel

Vite + React frontend for Hacom Cloud. The Cloud backend owner is `hacom-cloud-service`.

Current contract: [Cloud Admin implementation plan](docs/cloud-admin-implementation-plan.md).

Cloud requests go directly to `hacom-cloud-service`; `chat-admin-service` is not a runtime dependency. Auth identity/session authority remains in `chat-auth-service`.

For a local UI-only demonstration, explicitly set
`VITE_LOCAL_DEMO_AUTH=true` and `VITE_CLOUD_API_MODE=fixture`. Real Auth and
Cloud services are the default contract; use `VITE_LOCAL_DEMO_AUTH=false` and
`VITE_CLOUD_API_MODE=live` when exercising them locally.

The panel inherits presentation patterns from `chat-admin-panel`, but its
Cloud runtime contract is independent. Identity uses Auth `/api/v1/auth/me`;
Cloud data uses `/api/v1/admin/cloud/*`. Only shared presentation primitives
are retained from the old panel; its feature modules and API clients are not
part of this repository.

## Runtime

- Dev port: `5174`
- Production container port: `80`
- Package manager: `npm`

## Local host mode

```bash
cp .env.example .env
make install
make dev
```

Vite dev server proxies API/auth calls to local services by default:

- `/api/v1/admin` -> `http://localhost:8080` (`hacom-cloud-service`)
- `/api/v1/auth` -> `http://localhost:3101`

Override with these env vars when needed:

- `VITE_DEV_CLOUD_PROXY_TARGET` (preferred)
- `VITE_DEV_ADMIN_PROXY_TARGET` (compatibility alias)
- `VITE_DEV_AUTH_PROXY_TARGET`

Runtime envs for hybrid dev and develop:

- `VITE_ADMIN_API_ROOT`: canonical admin API root (`/api/v1/admin` or absolute URL)
- `VITE_ADMIN_API_BASE_URL`: compatibility alias for the same admin root
- `VITE_AUTH_BASE_URL`: canonical auth root (`/api/v1/auth` or absolute URL)

Run local admin panel with develop backends:

```bash
cp .env.local.example .env.local
make dev
```

Build and preview the production bundle:

```bash
make build
make start
```

## Docker

```bash
make docker-build
make docker-run
make docker-logs
make docker-stop
```

Canonical admin API root is `/api/v1/admin`.

- `VITE_ADMIN_API_ROOT` is the preferred source of truth for admin-only routes.
- `VITE_ADMIN_API_BASE_URL` remains as a compatibility fallback and must resolve to the same admin root as `VITE_ADMIN_API_ROOT`.
- Auth routes are resolved independently through `VITE_AUTH_BASE_URL`; the panel no longer assumes a shared `/api/v1` browser surface.
- The production bundle is always built for the host root, so assets resolve as `/assets/...`.
- If an edge proxy still exposes the panel under `/admin`, rewrite `/admin/*` to `/` at the proxy instead of rebuilding the bundle with a `/admin` base path.
