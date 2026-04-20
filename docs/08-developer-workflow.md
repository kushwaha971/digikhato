# 08 - Developer Workflow

## 1. Environment Setup
- Create backend env: `cp backend/.env.example backend/.env`
- Create frontend env: `cp frontend/.env.local.example frontend/.env.local`

## 2. Start Local Stack
```bash
cd backend && docker compose up --build -d
cd ../frontend && docker compose up --build
```

## 3. Backend Commands
```bash
cd backend
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

## 4. Frontend Quality Checks
```bash
cd frontend
npm run build
```

## 5. Backend Quality Checks
```bash
cd backend
python3 manage.py check
```

## 6. Feature Development Rules
- Add/extend backend domain in `apps/<domain>/`.
- Add/extend frontend domain API in `src/features/<domain>/`.
- Use RHF + Zod for forms.
- Add reusable UI to `src/components/ui/`.
- Keep business-specific reusable widgets in `src/components/business/`.

## 7. PR Checklist
- API endpoint documented in `docs/05-api-reference-mvp.md`.
- MVP status updated in `docs/02-current-implementation-status.md`.
- Any new future work tracked in `docs/07-roadmap-post-mvp.md`.
- Build checks pass (backend + frontend).
