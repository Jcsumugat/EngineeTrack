# EngineeTrack

Equipment and facility borrowing, reservation, and return management system.

**Status:** Database, backend, Breeze + React (Inertia) setup, layout, login, dashboard, and all module pages are written. Currently testing each module end to end. Remaining: Profile page restyle, branded 403 page, final testing, deployment.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Setup](#2-setup)
3. [Project Directory](#3-project-directory)
4. [Progress](#4-progress)
5. [Requested Improvements and Where They Live](#5-requested-improvements-and-where-they-live)
6. [Roles](#6-roles)
7. [Lifecycle and Stock Rules](#7-lifecycle-and-stock-rules)
8. [Database Tables](#8-database-tables)
9. [Design / Theme](#9-design--theme)
10. [Testing Checklist](#10-testing-checklist)
11. [Useful Commands](#11-useful-commands)
12. [Known Issues and Fixes](#12-known-issues-and-fixes)
13. [Open Questions](#13-open-questions)

---

## 1. Tech Stack

- **Backend:** Laravel 12 (PHP 8.2+)
- **Frontend:** React via Inertia.js
- **Auth scaffolding:** Laravel Breeze (React stack), registration removed
- **Build tool:** Vite (with `@vitejs/plugin-react`)
- **Database:** MySQL 8+ (XAMPP / phpMyAdmin)
- **Styling:** Tailwind CSS v3 (pinned), blue and white gradient theme, sharp corners
- **Calendar:** FullCalendar (React), fed by `calendar.events`
- **Export:** CSV (built in)

**Requirements:** PHP 8.2+, Composer 2+, Node.js 20+, MySQL 8+ (XAMPP), Git.

---

## 2. Setup

### Database

1. Open phpMyAdmin and paste/import the project SQL. It creates the `engineetrack` database, tables, 5 departments, the admin account, and sample data.
2. Do **NOT** run `php artisan migrate`. The SQL already contains the tables.
3. The default admin account is created by the SQL. Change its email and password right away (see [Change admin credentials](#change-admin-credentials-tinker)).

### Notes

- The `sessions`, `cache`, and `cache_locks` tables are not in the SQL, so file drivers are used.
- The CHECK constraint on `reservations` (equipment or facility, not both) was removed because MySQL 8 rejects it alongside CASCADE foreign keys. It is enforced in `ReservationController` validation.
- The PHP warning "Module openssl is already loaded" is harmless (duplicate `extension=openssl` in `php.ini`).
- Forgot-password pages use the `password_reset_tokens` table, which is not in the SQL. Create it or remove those routes if you want that feature.

### .env

```env
APP_NAME=EngineeTrack
APP_TIMEZONE=Asia/Manila
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=engineetrack
DB_USERNAME=root
DB_PASSWORD=
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

Then run:

```bash
php artisan config:clear
```

### Frontend install

```bash
composer install
npm install
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

### Tailwind (must be v3)

```bash
npm uninstall @tailwindcss/vite @tailwindcss/postcss
npm install -D tailwindcss@3 postcss autoprefixer @tailwindcss/forms @vitejs/plugin-react
```

- `postcss.config.js` uses the `tailwindcss` and `autoprefixer` plugins.
- `tailwind.config.js` sets `borderRadius` to 2/2/3/4/6px and loads the forms plugin.
- `resources/css/app.css` contains only the three `@tailwind` directives.
- Tailwind v4 breaks this setup ("use @tailwindcss/postcss" error). Keep v3.

### vite.config.js

- Plugins: `laravel({ input: 'resources/js/app.jsx', refresh: true })` and `react()`.
- `resources/views/app.blade.php` must include `@viteReactRefresh` before `@vite`.

### Run (keep both running)

```bash
php artisan serve
npm run dev
```

### Change admin credentials (tinker)

```bash
php artisan tinker
```

```php
DB::table('users')->where('email', 'OLD_EMAIL')->update(['email' => 'NEW_EMAIL', 'password' => Hash::make('NEW_PASSWORD')]);
```

Use `DB::table` with `Hash::make`. Updating through the `User` model would double-hash the password because of the `hashed` cast.

### Editor tips

- VS Code: File > Auto Save (or `files.autoSave = afterDelay`). Vite hot reload refreshes the browser automatically. Do not use Live Server.

---

## 3. Project Directory

### Full tree

```
engineetrack/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/                       Breeze auth controllers (register removed)
│   │   │   ├── BorrowingController.php
│   │   │   ├── CalendarController.php
│   │   │   ├── Controller.php
│   │   │   ├── DashboardController.php
│   │   │   ├── FacilityController.php
│   │   │   ├── InventoryController.php
│   │   │   ├── ProfileController.php       Breeze (do not delete)
│   │   │   ├── ReportController.php
│   │   │   ├── ReservationController.php
│   │   │   └── UserController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureUserHasRole.php       alias "role"
│   │   │   └── HandleInertiaRequests.php   shares auth user + flash messages
│   │   └── Requests/                       Breeze form requests (login, profile)
│   ├── Models/
│   │   ├── Borrowing.php
│   │   ├── Department.php
│   │   ├── Equipment.php
│   │   ├── EquipmentStockLog.php
│   │   ├── Facility.php
│   │   ├── Reservation.php
│   │   └── User.php
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   └── Services/
│       └── AvailabilityService.php         availability / overlap calculations
│
├── bootstrap/
│   ├── app.php                             middleware alias registration
│   └── cache/
│
├── config/                                 Laravel config files
│
├── database/
│   ├── factories/
│   ├── migrations/                         not used (schema comes from the SQL)
│   └── seeders/
│
├── public/
│   ├── build/                              generated by npm run build
│   ├── index.php
│   └── .htaccess
│
├── resources/
│   ├── css/
│   │   └── app.css                         three @tailwind directives only
│   ├── js/
│   │   ├── app.jsx                         Inertia + React entry point
│   │   ├── bootstrap.js
│   │   ├── utils.js                        date formatter
│   │   ├── Layouts/
│   │   │   ├── AuthenticatedLayout.jsx     gradient sidebar, mobile drawer, flash messages
│   │   │   └── GuestLayout.jsx
│   │   ├── Components/
│   │   │   ├── Field.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── (Breeze components: ApplicationLogo, Checkbox, DangerButton,
│   │   │        Dropdown, InputError, InputLabel, Modal, NavLink,
│   │   │        PrimaryButton, ResponsiveNavLink, SecondaryButton, TextInput)
│   │   └── Pages/
│   │       ├── Auth/
│   │       │   └── Login.jsx               two-section gradient design
│   │       ├── Borrowings/
│   │       │   ├── Index.jsx               includes return modal with damage note
│   │       │   └── Create.jsx
│   │       ├── Calendar/
│   │       │   └── Index.jsx               FullCalendar
│   │       ├── Dashboard.jsx
│   │       ├── Facilities/
│   │       │   ├── Index.jsx
│   │       │   ├── Create.jsx
│   │       │   └── Edit.jsx
│   │       ├── Inventory/
│   │       │   ├── Index.jsx               includes add-stock modal
│   │       │   ├── Create.jsx
│   │       │   ├── Edit.jsx
│   │       │   └── Show.jsx                stock log
│   │       ├── Profile/                    Breeze (restyle pending)
│   │       │   ├── Edit.jsx
│   │       │   └── Partials/
│   │       ├── Reports/
│   │       │   ├── Borrowed.jsx            filters + CSV export
│   │       │   └── Returns.jsx
│   │       ├── Reservations/
│   │       │   ├── Index.jsx
│   │       │   └── Create.jsx
│   │       └── Users/
│   │           ├── Index.jsx
│   │           ├── Create.jsx
│   │           └── Edit.jsx
│   └── views/
│       └── app.blade.php                   root Inertia template (@viteReactRefresh, @vite, fonts)
│
├── routes/
│   ├── web.php                             main routes (admin-only group under role:admin)
│   ├── auth.php                            Breeze auth routes (register removed)
│   └── console.php
│
├── storage/
│   ├── app/
│   ├── framework/                          file sessions + cache live here
│   └── logs/
│
├── tests/
│   ├── Feature/
│   └── Unit/
│
├── vendor/                                 Composer packages (not committed)
├── node_modules/                           npm packages (not committed)
│
├── .env                                    environment config (not committed)
├── .env.example
├── artisan
├── composer.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

### Directory guide

| Directory | Purpose |
|---|---|
| `app/Http/Controllers/` | One controller per module. Each returns `Inertia::render()` for pages and redirects for actions. |
| `app/Http/Middleware/` | `EnsureUserHasRole` (route alias `role`) and `HandleInertiaRequests` (shared props). |
| `app/Models/` | Eloquent models mapped to the tables in Section 8. |
| `app/Services/` | Business logic that does not belong in a controller (`AvailabilityService`). |
| `routes/` | `web.php` holds app routes (62 verified with `route:list`); `auth.php` holds login/logout/password routes. |
| `resources/js/Pages/` | One folder per module. Inertia resolves page names from this folder. |
| `resources/js/Layouts/` | Shared page shells (sidebar layout for logged-in users, guest layout). |
| `resources/js/Components/` | Reusable UI pieces shared across pages. |
| `resources/views/` | Only `app.blade.php`, the single Blade file that boots the React app. |
| `database/` | Migrations are unused; the schema is imported from the SQL file. |
| `storage/framework/` | File-driver sessions and cache. Must be writable. |
| `public/build/` | Compiled assets created by `npm run build` for production. |

### Module-to-file map

| Module | Controller | Pages | Access |
|---|---|---|---|
| Dashboard | `DashboardController` | `Dashboard.jsx` | All users |
| Calendar | `CalendarController` | `Calendar/Index.jsx` | All users (own records for Faculty/Staff) |
| Reservations | `ReservationController` | `Reservations/Index, Create` | All users request; admin approves, releases, completes |
| Borrowings | `BorrowingController` | `Borrowings/Index, Create` | All users request; admin approves, releases, receives returns |
| Inventory | `InventoryController` | `Inventory/Index, Create, Edit, Show` | Admin only |
| Facilities | `FacilityController` | `Facilities/Index, Create, Edit` | Admin only |
| Users | `UserController` | `Users/Index, Create, Edit` | Admin only |
| Reports | `ReportController` | `Reports/Borrowed, Returns` | Admin only |
| Profile | `ProfileController` | `Profile/Edit` | All users |

---

## 4. Progress

### Done

- [x] Database schema and seed data (SQL imported)
- [x] Laravel project, `.env` configured for MySQL
- [x] Models: User, Department, Equipment, EquipmentStockLog, Facility, Reservation, Borrowing
- [x] Middleware `EnsureUserHasRole` (alias `role`) and `AvailabilityService`
- [x] Controllers converted to `Inertia::render` (Dashboard, User, Inventory, Facility, Reservation, Borrowing, Calendar, Report)
- [x] `HandleInertiaRequests` shares auth user and flash messages
- [x] Routes (admin-only group under `role:admin`), 62 routes verified with `route:list`
- [x] Breeze (React) installed, registration removed
- [x] Login page: two-section gradient design with large EngineeTrack title
- [x] Layout: gradient sidebar (mobile drawer), flash messages, page header
- [x] Dashboard: welcome banner, stat cards, quick actions
- [x] Pages written: Inventory (Index, Create, Edit, Show, add-stock modal), Facilities, Users, Calendar, Reservations (Index, Create), Borrowings (Index, Create, return modal with damage note), Reports (Borrowed with filters and CSV, Returns)
- [x] Shared components: Field, StatusBadge, Pagination, utils (date format)

### Next

- [ ] Test every module end to end (see Section 10)
- [ ] Restyle the Profile page (Breeze) to match the theme
- [ ] Branded 403 / error page
- [ ] Update README default login after changing admin credentials
- [ ] Deployment: `npm run build`, `php artisan config:cache`, `APP_ENV=production`, `APP_DEBUG=false`

---

## 5. Requested Improvements and Where They Live

| Request | Location |
|---|---|
| Rename Rejected to Disapproved | `disapproved` status in reservations and borrowings |
| Disapproved not in borrowed reports | `ReportController::borrowedQuery()` includes only approved/released/returned |
| No public registration, admin creates accounts | Register routes removed; `UserController` (admin only) |
| Choose Admin or Faculty/Staff when adding a user | Role select in `Users/Create.jsx` |
| Equipment borrowing in the calendar | `CalendarController::events()` + `Calendar/Index.jsx` |
| Releasing of equipment | `BorrowingController::release()`, `ReservationController::release()` |
| Reservation differs from Borrowing | Separate tables, controllers, pages |
| Add additional quantity | `InventoryController::addStock()` + `equipment_stock_logs` + modal in `Inventory/Index.jsx` |
| Adding of facilities | `FacilityController` + Facilities pages |
| Return and note if broken | `BorrowingController::return()` + return modal in `Borrowings/Index.jsx` |
| Departments (5 colleges) | Seeded in the SQL |
| Supervisor renamed to Staff/Faculty | Role value `faculty_staff`, label "Staff/Faculty" |
| Reports by department | `Reports/Borrowed.jsx` (filters, CSV), `Reports/Returns.jsx` |
| User profile | Breeze profile page, linked from the sidebar user block |
| No deduction on reserving | See Section 7 |

---

## 6. Roles

**Admin:** log in; manage accounts, inventory, facilities; request reservation/borrowing; approve/disapprove, release, receive returns; calendar; reports; sees all requests.

**Faculty/Staff:** log in; request reservation/borrowing; cancel own requests; calendar (own); sees own requests only. No access to accounts, inventory, facilities, approvals, releasing, or reports.

---

## 7. Lifecycle and Stock Rules

- **Borrowing:** pending → approved → released → returned (optionally damaged), or disapproved.
- **Reservation:** pending → approved → released → completed, or disapproved / cancelled.

Rules:

- `equipment.total_quantity` is not reduced when reserving or approving.
- Availability = `total_quantity` − approved overlapping reservations − released (unreturned) borrowings, computed in `AvailabilityService`.
- Releasing an equipment reservation creates a released borrowing; the reservation becomes `released` so it is never counted twice.
- Returning restores availability. Returning a reservation-linked borrowing marks the reservation `completed`.
- Damaged units on return are removed from `total_quantity` and logged in `equipment_stock_logs`.
- Facilities cannot be double-booked for overlapping dates (approved/released reservations).
- Facility reservations are completed manually by the admin ("Complete" action after release).

---

## 8. Database Tables

```
departments            id, name
users                  id, name, email, password, role(admin|faculty_staff), department_id
equipment              id, name, description, total_quantity, is_active
equipment_stock_logs   id, equipment_id, change, reason, created_by
facilities             id, name, description, capacity, is_active
reservations           id, user_id, equipment_id|facility_id, quantity, date_from, date_to,
                       purpose, status, reviewed_by, reviewed_at, remarks
borrowings             id, user_id, reservation_id?, equipment_id, quantity, purpose,
                       borrowed_at, due_at, status, reviewed_by, released_by, released_at,
                       returned_at, received_by, is_damaged, damaged_quantity, damage_note
```

---

## 9. Design / Theme

- **Style:** clean, professional, blue and white, with gradients and sharp corners
- **Sidebar and login left panel:** blue-950 to blue-600 gradient with soft glow circles
- **Brand title:** Montserrat extra-bold, "Enginee" in white, "Track" in sky-blue gradient (font loaded in `app.blade.php`)
- **Primary buttons:** blue-700 to blue-900 gradient; table headers: blue-800 to blue-600 gradient
- **Page background:** blue-50 to gray-100 gradient; cards white with subtle gradient and ring
- **Corner radius:** 2–6px (`tailwind.config.js`); `rounded-full` is unchanged
- **Status badges:** pending = yellow, approved = blue, released = sky, returned/completed = green, disapproved/cancelled = red
- **Calendar colors:** reservations blue (`#2563eb`), borrowings green (`#16a34a`)

---

## 10. Testing Checklist

- [ ] Login and logout work; wrong password shows an error
- [ ] Faculty/Staff sees only Dashboard, Calendar, Reservations, Borrowings; `/users` gives 403
- [ ] `/register` does not exist
- [ ] Inventory: add equipment, add stock, edit, view stock log, delete
- [ ] Facilities: add, edit, delete
- [ ] Users: create Admin and Staff/Faculty with a department, edit, delete (cannot delete self)
- [ ] Reserving does not change `total_quantity`
- [ ] Overlapping reservations cannot exceed available quantity
- [ ] Releasing reduces availability; returning restores it
- [ ] Damaged return stores the note, reduces `total_quantity`, writes a stock log
- [ ] Disapproved requests never appear in borrowed reports
- [ ] Facility cannot be double-booked
- [ ] Calendar shows approved/released reservations and borrowings
- [ ] Reports filter by status, department, and dates; CSV export downloads

---

## 11. Useful Commands

```bash
php artisan route:list
php artisan config:clear
php artisan tinker
php artisan serve
npm run dev
npm run build
php artisan test
```

Find controllers not yet converted to Inertia (Windows):

```bat
findstr /N /C:"view(" app\Http\Controllers\*.php
```

---

## 12. Known Issues and Fixes

| Problem | Fix |
|---|---|
| `Class Inertia not found` | Add `use Inertia\Inertia;` to the controller. |
| `View [x.index] not found` | The controller still uses `view()`; convert it to `Inertia::render()`. |
| Blank page with "React is not defined" or 404 on `/@react-refresh` | Add `react()` to `vite.config.js` and `@viteReactRefresh` to `app.blade.php`. |
| PostCSS error about tailwindcss plugin | Tailwind v4 is installed; pin v3 (see Section 2). |
| `Failed to open stream ... ProfileController.php` | Do not delete Breeze's `ProfileController`. |

---

## 13. Open Questions

- Should one request allow multiple items? (Currently one item per request.)
- Do facility reservations need a return step beyond "completed"?
- Should reservations require a minimum lead time (for example 1 day ahead)?
- Are email/SMS notifications needed for approvals and due dates?