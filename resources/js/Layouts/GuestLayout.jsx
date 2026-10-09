import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Brand from '@/Components/Brand';

const links = [
    { label: 'Home', name: 'dashboard', match: 'dashboard' },
    { label: 'Calendar', name: 'calendar.index', match: 'calendar.*' },
    { label: 'Reservations', name: 'reservations.index', match: 'reservations.*' },
    { label: 'Borrowings', name: 'borrowings.index', match: 'borrowings.*' },
];

export default function StaffLayout({ header, children }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
            {/* Top navigation */}
            <nav className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-blue-900 to-blue-700 text-white shadow-md">
                <div className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />

                <div className="relative mx-auto flex h-16 max-w-7xl items-stretch justify-between px-4 sm:px-8">
                    <div className="flex items-stretch gap-8">
                        <Link href={route('dashboard')} className="flex items-center">
                            <Brand small />
                        </Link>

                        <div className="hidden items-stretch md:flex">
                            {links.map((l) => (
                                <Link
                                    key={l.name}
                                    href={route(l.name)}
                                    className={'flex items-center border-b-4 px-4 text-sm font-medium transition ' +
                                        (route().current(l.match)
                                            ? 'border-sky-300 bg-white/15 text-white'
                                            : 'border-transparent text-blue-100 hover:bg-white/10 hover:text-white')}
                                >
                                    {l.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Desktop user area */}
                    <div className="hidden items-center gap-4 md:flex">
                        <div className="text-right leading-tight">
                            <div className="max-w-[12rem] truncate text-sm font-semibold">{user.name}</div>
                            <div className="text-xs text-blue-200">Staff/Faculty</div>
                        </div>
                        <Link href={route('profile.edit')} className="border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
                            Profile
                        </Link>
                        <Link href={route('logout')} method="post" as="button" className="bg-white/90 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-white">
                            Log out
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setOpen((v) => !v)}
                        aria-label="Menu"
                        aria-expanded={open}
                        className="flex items-center md:hidden"
                    >
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {open
                                ? <path strokeLinecap="round" strokeWidth="2" d="M6 6l12 12M18 6L6 18" />
                                : <path strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
                        </svg>
                    </button>
                </div>

                {/* Mobile menu */}
                {open && (
                    <div className="relative border-t border-white/15 md:hidden">
                        {links.map((l) => (
                            <Link
                                key={l.name}
                                href={route(l.name)}
                                onClick={() => setOpen(false)}
                                className={'block border-l-4 px-5 py-3 text-sm font-medium ' +
                                    (route().current(l.match)
                                        ? 'border-sky-300 bg-white/15 text-white'
                                        : 'border-transparent text-blue-100 hover:bg-white/10')}
                            >
                                {l.label}
                            </Link>
                        ))}
                        <div className="border-t border-white/15 p-4">
                            <div className="truncate text-sm font-semibold">{user.name}</div>
                            <div className="mb-3 text-xs text-blue-200">Staff/Faculty</div>
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
                )}
            </nav>

            {header && (
                <header className="border-b-2 border-blue-700 bg-gradient-to-r from-white to-blue-50 shadow-sm">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8">{header}</div>
                </header>
            )}

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
                {flash?.success && (
                    <div className="mb-4 border-l-4 border-green-600 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                )}
                {flash?.error && (
                    <div className="mb-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{flash.error}</div>
                )}
                {children}
            </main>
        </div>
    );
}