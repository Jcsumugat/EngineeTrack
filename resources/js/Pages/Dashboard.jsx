import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/StatusBadge';
import { fmt } from '@/utils';
import { Head, Link, usePage } from '@inertiajs/react';

const ICONS = {
    cube: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
    building: 'M3.75 21h16.5M4.5 3h15v18h-15zM9 7.5h1.5M13.5 7.5H15M9 12h1.5M13.5 12H15M10.5 21v-4.5h3V21',
    clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
    inbox: 'M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M2.25 13.5V6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v6.75m-19.5 0v4.5A2.25 2.25 0 004.5 20.25h15a2.25 2.25 0 002.25-2.25v-4.5',
    alert: 'M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
    plus: 'M12 4.5v15m7.5-7.5h-15',
    calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    chart: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    arrow: 'M8.25 4.5l7.5 7.5-7.5 7.5',
};

function Icon({ name, className = 'h-5 w-5' }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d={ICONS[name]} />
        </svg>
    );
}

const TONES = {
    blue: { chip: 'bg-blue-50 text-blue-700', bar: 'bg-blue-600' },
    sky: { chip: 'bg-sky-50 text-sky-700', bar: 'bg-sky-500' },
    amber: { chip: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500' },
    rose: { chip: 'bg-rose-50 text-rose-700', bar: 'bg-rose-500' },
};

function StatCard({ label, value, icon, href, tone = 'blue', hint }) {
    const t = TONES[tone];
    const body = (
        <div className="group relative h-full overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={'absolute inset-x-0 top-0 h-1 ' + t.bar} />
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</div>
                    <div className="mt-2 text-3xl font-extrabold text-gray-900">{value}</div>
                </div>
                <div className={'rounded-lg p-2.5 ' + t.chip}><Icon name={icon} /></div>
            </div>
            {hint && <div className="mt-3 text-xs text-gray-500">{hint}</div>}
        </div>
    );
    return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

function Panel({ title, action, children }) {
    return (
        <section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">{title}</h3>
                {action}
            </div>
            {children}
        </section>
    );
}

function QuickAction({ href, icon, children, primary = false }) {
    return (
        <Link
            href={href}
            className={'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ' +
                (primary
                    ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-sm hover:from-blue-800 hover:to-blue-950'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800')}
        >
            <Icon name={icon} className="h-5 w-5 shrink-0" />
            <span className="flex-1">{children}</span>
            <Icon name="arrow" className="h-4 w-4 opacity-60" />
        </Link>
    );
}

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard({
    equipmentCount,
    facilityCount,
    pendingReservations,
    pendingBorrowings,
    unreturned,
    recent = [],
    stock = [],
}) {
    const user = usePage().props.auth.user;
    const isAdmin = user.role === 'admin';
    const firstName = (user.name || '').split(' ')[0];
    const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const pendingTotal = pendingReservations + pendingBorrowings;

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-bold text-gray-800">Dashboard</h2>}>
            <Head title="Dashboard" />

            {/* Welcome banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 px-6 py-8 text-white shadow-md sm:px-8">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sky-400/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />
                <div className="relative flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-widest text-blue-200">{today}</div>
                        <h1 className="mt-2 text-3xl font-extrabold" style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif" }}>
                            {greeting()}, {user.name}
                        </h1>
                        <p className="mt-1 max-w-xl text-sm text-blue-100">
                            {isAdmin
                                ? 'Review pending requests, release equipment, and keep the inventory up to date.'
                                : 'Request equipment or facilities and track the status of your requests.'}
                        </p>
                    </div>
                    <div className="rounded-lg bg-white/10 px-4 py-3 text-right ring-1 ring-white/20 backdrop-blur">
                        <div className="text-2xl font-extrabold">{pendingTotal}</div>
                        <div className="text-xs uppercase tracking-wider text-blue-100">
                            {isAdmin ? 'Awaiting review' : 'Pending requests'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Equipment Items" value={equipmentCount} icon="cube" tone="blue" href={isAdmin ? route('inventory.index') : null} hint="Active in inventory" />
                <StatCard label="Facilities" value={facilityCount} icon="building" tone="sky" href={isAdmin ? route('facilities.index') : null} hint="Available to reserve" />
                <StatCard label="Pending Reservations" value={pendingReservations} icon="clock" tone="amber" href={route('reservations.index')} hint="Waiting for approval" />
                <StatCard label="Pending Borrowings" value={pendingBorrowings} icon="inbox" tone="amber" href={route('borrowings.index')} hint="Waiting for approval" />
                <StatCard label="Unreturned Items" value={unreturned} icon="alert" tone="rose" href={route('borrowings.index')} hint="Currently out" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* Recent activity */}
                <div className="lg:col-span-2">
                    <Panel
                        title="Recent activity"
                        action={<Link href={route('borrowings.index')} className="text-xs font-semibold text-blue-700 hover:underline">View borrowings</Link>}
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Item</th>
                                        {isAdmin && <th className="px-5 py-3 font-semibold">Requested by</th>}
                                        <th className="px-5 py-3 font-semibold">Type</th>
                                        <th className="px-5 py-3 font-semibold">Date</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recent.map((row) => (
                                        <tr key={row.key} className="hover:bg-gray-50">
                                            <td className="px-5 py-3">
                                                <div className="font-medium text-gray-900">{row.item}</div>
                                                {row.quantity > 1 && <div className="text-xs text-gray-500">Qty {row.quantity}</div>}
                                            </td>
                                            {isAdmin && <td className="px-5 py-3 text-gray-600">{row.user}</td>}
                                            <td className="px-5 py-3">
                                                <span className={'rounded-md px-2 py-0.5 text-xs font-semibold ' + (row.type === 'Borrowing' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700')}>
                                                    {row.type}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-gray-600">{fmt(row.created_at)}</td>
                                            <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                                        </tr>
                                    ))}
                                    {recent.length === 0 && (
                                        <tr><td colSpan={isAdmin ? 5 : 4} className="px-5 py-10 text-center text-gray-500">No activity yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <Panel title="Quick actions">
                        <div className="space-y-2.5 p-5">
                            <QuickAction href={route('reservations.create')} icon="plus" primary>New Reservation</QuickAction>
                            <QuickAction href={route('borrowings.create')} icon="plus" primary>New Borrow Request</QuickAction>
                            <QuickAction href={route('calendar.index')} icon="calendar">View Calendar</QuickAction>
                            {isAdmin && (
                                <>
                                    <QuickAction href={route('inventory.create')} icon="cube">Add Equipment</QuickAction>
                                    <QuickAction href={route('reports.borrowed')} icon="chart">Reports</QuickAction>
                                </>
                            )}
                        </div>
                    </Panel>

                    {isAdmin && (
                        <Panel
                            title="Stock levels"
                            action={<Link href={route('inventory.index')} className="text-xs font-semibold text-blue-700 hover:underline">Inventory</Link>}
                        >
                            <div className="space-y-4 p-5">
                                {stock.map((s) => {
                                    const pct = s.total > 0 ? Math.round((s.available / s.total) * 100) : 0;
                                    const bar = pct < 20 ? 'bg-rose-500' : pct < 50 ? 'bg-amber-500' : 'bg-emerald-500';
                                    return (
                                        <div key={s.id}>
                                            <div className="mb-1 flex items-baseline justify-between text-sm">
                                                <span className="font-medium text-gray-800">{s.name}</span>
                                                <span className="text-xs text-gray-500">{s.available} / {s.total} available</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                                <div className={'h-full rounded-full transition-all ' + bar} style={{ width: pct + '%' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                                {stock.length === 0 && <div className="py-4 text-center text-sm text-gray-500">No equipment yet.</div>}
                            </div>
                        </Panel>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}