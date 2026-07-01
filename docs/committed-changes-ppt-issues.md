# CAFM OXAGON - Committed Changes for PPT Issues

Date: 2026-07-01
Repository: webtranz/CAFM_OXAGON
Branch: main

## Summary

The CAFM issues raised from the PPT review were implemented and pushed to GitHub. The changes focus on housing operations, room and bed availability, location selection, asset visibility, upload compatibility, filters, reports, and user-facing form improvements.

## Latest Verification

- TypeScript check passed: `npx.cmd tsc --noEmit --tsBuildInfoFile .\tmp-tsbuildinfo-check`
- Housing rules smoke tests passed: `npm.cmd run test:housing`
- Latest pushed commit: `7843c2c Load complete housing data on refresh`

## Committed Changes

### 7843c2c - Load complete housing data on refresh

- Updated Housing Operations refresh to load the full housing operational dataset.
- `/api/housing` now returns housing rooms, beds, bookings, inspections, assets, inventory, approvals, notifications, history, locations, spaces, and CAFM assets together.
- Resolves missing room/location/asset visibility caused by initial capped data loading.

### aa7d384 - Complete housing room asset visibility fixes

- Increased housing reference loading from 300 to 2000 records.
- Added room-wise asset visibility in Housing Dashboard.
- Added bed count, asset count, and room asset list to the accommodation drill-down.
- Added explicit room location display in Housing Assets.
- Made Room Inspection asset, bed, and booking selectors room-aware.
- Added dynamic housing asset group dropdowns based on uploaded system data.
- Added FM occupancy report to Housing Reports and backend report generation.
- Enforced SP selection before Building/Room when SP values exist.

### df827d4 - Improve housing booking and location selection

- Prevented duplicate room and bed bookings through active booking checks.
- Ensured missing bed rows are generated based on room capacity before auto-assignment.
- Updated Service Request and Work Order forms to use sequential selection:
  `Zone -> SP -> Building -> Block / Room`
- Replaced key "Site" labels with "Zone" in user-facing workflows.

### 3a2f252 - Add asset group and department filters

- Added asset group filter support.
- Added department-wise filtering for assets.
- Improved asset search and filtering usability.

### 1ecec31 - Load full facility references and compact forms

- Expanded facility reference loading for locations/buildings/spaces.
- Improved compact form layout to reduce unnecessary scrolling.
- Helped make more locations available in creation forms.

### 3fa02fe - Simplify sequenced location selectors

- Simplified location selection to smaller sequence fields instead of one long combined code.
- Improved usability for Service Requests, Bookings, and Work Orders.

### 8f5a3a5 - Add sequenced location creation fields

- Added sequence fields for creating locations.
- Supported selecting/entering Zone, Building, Floor/Block, and Room data more clearly.

### 1cfec2b - Improve location asset selection flows

- Improved linked asset filtering by selected location hierarchy.
- Made related assets more visible when a location is selected.

### 0991e31 - Harden building bulk upload compatibility

- Improved building bulk upload compatibility and duplicate handling.
- Helped resolve building file upload failures.

### a104c61 - Add bulk upload preserve mode

- Added upload option to preserve existing data or replace old data.
- Prevents uploaded files from unintentionally replacing current system records.

### 4cce445 - Add broad module search filters

- Added broad keyword/date/module filters across key modules.
- Improved searching by headings, names, numbers, locations, spaces, buildings, and other keywords.

### 6d1d3d0 - Label iqama expiry booking field

- Updated Accommodation & Booking field label to show Iqama Expiry clearly.
- Added contractor/subcontractor-related booking field changes in the booking flow.

## PPT Issue Coverage

| PPT Issue | Status |
| --- | --- |
| Housing assets missing from selection | Implemented |
| Bed availability incorrect / duplicate bed booking | Implemented |
| Building/floor fields confusing in booking | Implemented |
| Room-wise housing asset display missing | Implemented |
| SP data missing or inconsistent in ticket creation | Implemented |
| Incomplete room list after selecting building | Implemented through expanded/full refresh loading |
| Pagination/Next disabled due to capped initial data | Addressed through full housing refresh loading |
| Housing assets room-wise display | Implemented |
| Reports after upload need verification | Report paths updated; FM report added |
| Asset name/group search filters missing | Implemented |
| "Site" should be shown as "Zone" | Implemented in key workflows |
| FM Occupancy report needed | Implemented |
| Building/location selection should be user-friendly | Implemented with sequenced selectors |

## Data Safety

- No production data was intentionally changed by these commits.
- Changes are application code and API behavior changes only.
- Existing untracked generated files were left untouched:
  - `outputs/`
  - `scripts/prepare_300626_bulk_upload.py`

