import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

function Brand({ small = false }) {
    return (
        <div>
            <div
                className={'whitespace-nowrap font-extrabold leading-none tracking-tight ' + (small ? 'text-2xl' : 'text-[28px]')}
                style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif" }}
            >
                <span className="text-white">Enginee</span>
                <span className="bg-gradient-to-r from-sky-300 to-blue-100 bg-clip-text pr-0.5 text-transparent">Track</span>
            </div>
            {!small && <div className="mt-3 h-1 w-14 bg-sky-300" />}
        </div>
    );
}

function Footer({ isAdmin }) {
    const year = new Date().getFullYear();
    const links = [
        { label: 'Dashboard', name: 'dashboard' },
        { label: 'Calendar', name: 'calendar.index' },
        { label: 'Reservations', name: 'reservations.index' },
        { label: 'Borrowings', name: 'borrowings.index' },
    ];

    return (
        <footer className="mt-auto border-t border-gray-200 bg-white">
            <div className="flex flex-col gap-4 px-4 py-5 sm:px-8 md:flex-row md:items-center md:justify-between">
                <div>
                    <div
                        className="text-base font-extrabold leading-none tracking-tight"
                        style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif" }}
                    >
                        <span className="text-blue-900">Enginee</span>
                        <span className="text-sky-500">Track</span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                        Equipment and facility reservation, borrowing and inventory management.
                    </p>
                </div>

                <nav className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-gray-600">
                    {links.map((l) => (
                        <Link key={l.name} href={route(l.name)} className="hover:text-blue-700 hover:underline">
                            {l.label}
                        </Link>
                    ))}
                    {isAdmin && (
                        <Link href={route('inventory.index')} className="hover:text-blue-700 hover:underline">
                            Inventory
                        </Link>
                    )}
                </nav>

                <p className="text-xs text-gray-500">
                    &copy; {year} EngineeTrack. All rights reserved.
                </p>
            </div>
        </footer>
    );
}

export default function AuthenticatedLayout({ header, children }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const isAdmin = user.role === 'admin';
    const [open, setOpen] = useState(false);

    const main = [
        { label: 'Dashboard', name: 'dashboard', match: 'dashboard' },
        { label: 'Calendar', name: 'calendar.index', match: 'calendar.*' },
        { label: 'Reservations', name: 'reservations.index', match: 'reservations.*' },
        { label: 'Borrowings', name: 'borrowings.index', match: 'borrowings.*' },
    ];

    const admin = [
        { label: 'Inventory', name: 'inventory.index', match: 'inventory.*' },
        { label: 'Facilities', name: 'facilities.index', match: 'facilities.*' },
        { label: 'Reports', name: 'reports.borrowed', match: 'reports.*' },
        { label: 'Users', name: 'users.index', match: 'users.*' },
    ];

    const item = (l) => {
        const active = route().current(l.match);
        return (
            <Link
                key={l.name}
                href={route(l.name)}
                onClick={() => setOpen(false)}
                className={'block border-l-4 px-4 py-2.5 text-sm font-medium transition ' +
                    (active
                        ? 'border-sky-300 bg-white/15 text-white'
                        : 'border-transparent text-blue-100 hover:bg-white/10 hover:text-white')}
            >
                {l.label}
            </Link>
        );
    };

    const sidebar = (
        <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-blue-950 via-blue-900 to-blue-700 text-white">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

            <div className="relative px-6 py-7"><Brand /></div>

            <nav className="relative flex-1 overflow-y-auto pb-4">
                <div className="px-6 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-blue-300">Main</div>
                {main.map(item)}
                {isAdmin && (
                    <>
                        <div className="px-6 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-widest text-blue-300">Administration</div>
                        {admin.map(item)}
                    </>
                )}
            </nav>

            <div className="relative border-t border-white/15 p-4">
                <div className="truncate text-sm font-semibold">{user.name}</div>
                <div className="mb-3 text-xs text-blue-200">{isAdmin ? 'Admin' : 'Staff/Faculty'}</div>
                <div className="flex gap-2">
                    <Link href={route('profile.edit')} className="flex-1 border border-white/30 px-3 py-1.5 text-center text-xs font-semibold hover:bg-white/10">
                        Profile
                    </Link>
                    <Link href={route('logout')} method="post" as="button" className="flex-1 bg-white/90 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-white">
                        Log out
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 lg:flex">
            {/* Desktop sidebar */}
            <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0">{sidebar}</aside>

            {/* Mobile top bar */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-950 to-blue-700 px-4 py-3 text-white lg:hidden">
                <Brand small />
                <button onClick={() => setOpen(true)} aria-label="Menu">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile drawer */}
            {open && (
                <div className="fixed inset-0 z-40 flex lg:hidden">
                    <div className="w-64">{sidebar}</div>
                    <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
                </div>
            )}

            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                {header && (
                    <header className="border-b-2 border-blue-700 bg-gradient-to-r from-white to-blue-50 shadow-sm">
                        <div className="px-4 py-5 sm:px-8">{header}</div>
                    </header>
                )}

                <main className="flex-1 px-4 py-6 sm:px-8">
                    {flash?.success && (
                        <div className="mb-4 border-l-4 border-green-600 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{flash.error}</div>
                    )}
                    {children}
                </main>

                <Footer isAdmin={isAdmin} />
            </div>
        </div>
    );
}