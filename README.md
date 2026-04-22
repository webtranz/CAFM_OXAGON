# BrightWorks CAFM

A deployable Computer Aided Facility Management application for enterprise facility teams.

## Modules

- Portfolio, sites, buildings, floors and spaces
- Asset registry with lifecycle, criticality, warranty and cost fields
- Service requests, helpdesk triage, SLAs and priorities
- Work orders, preventive maintenance, job plans and technician assignment
- Inspections, permits, HSE incidents and compliance tasks
- Inventory, spare parts, purchase requests, vendors and contracts
- Energy meters, IoT alerts, dashboards, KPIs and reports
- Role-aware operating cockpit for management, helpdesk, supervisors and technicians

## Local setup

```bash
npm install
copy .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

## Dokploy

Deploy with the included `Dockerfile` and `docker-compose.yml`. Set `DATABASE_URL` and `NEXT_PUBLIC_APP_NAME` in Dokploy if you use an external PostgreSQL service.
