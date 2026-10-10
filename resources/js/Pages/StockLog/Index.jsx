import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import ActionMenu from '@/Components/ActionMenu';
import { inputClass, btnSecondary } from '@/Components/Field';
import { Head, Link, router } from '@inertiajs/react';

const TYPES = {
    added: { label: 'Stock added', cls: 'bg-green-100 text-green-800' },
    replacement: { label: 'Replacement', cls: 'bg-sky-100 text-sky-800' },
    damaged: { label: 'Damaged', cls: 'bg-red-100 text-red-800' },
    deducted: { label: 'Deducted', cls: 'bg-amber-100 text-amber-800' },
};

const TYPE_OPTIONS = [
    ['all', 'All movements'],
    ['added', 'Stock added'],
    ['replacement', 'Replacements'],
    ['damaged', 'Damaged'],
    ['deducted', 'Other deductions'],
];

// Drop empty filters from the URL
const clean = (f) =>
    Object.fromEntries(Object.entries(f).filter(([k, v]) => v && !(k === 'type' && v === 'all')));

function StatCard({ label, value, tone }) {
    const tones = {
        blue: 'text-blue-900 ring-gray-200',
        green: 'text-green-700 ring-green-200',
        sky: 'text-sky-700 ring-sky-200',
        red: 'text-red-700 ring-red-200',
    };
    return (
        <div className={'bg-white p-4 shadow-sm ring-1 ' + tones[tone].split(' ')[1]}>
            <div className="text-xs text-gray-500">{label}</div>
            <div className={'mt-1 text-3xl font-extrabold ' + tones[tone].split(' ')[0]}>{value}</div>
        </div>
    );
}

function Detail({ label, children, wide = false }) {
    return (
        <div className={wide ? 'sm:col-span-2' : ''}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{children || <span className="text-gray-400">-</span>}</dd>
        </div>
    );
}

export default function Index({ logs, summary, equipment, filters }) {
    const [f, setF] = useState({
        equipment_id: filters.equipment_id ?? '',
        type: filters.type ?? 'all',
        from: filters.from ?? '',
        to: filters.to ?? '',
    });
    const [details, setDetails] = useState(null);

    // Update one filter and apply it right away
    const update = (key, value) => {
        const next = { ...f, [key]: value };
        setF(next);
        router.get(route('stock-log.index'), clean(next), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const reset = () => {
        setF({ equipment_id: '', type: 'all', from: '', to: '' });
        router.get(route('stock-log.index'), {}, { preserveScroll: true, replace: true });
    };

    const hasFilters = Object.keys(clean(f)).length > 0;
    const exportUrl = route('stock-log.export') + '?' + new URLSearchParams(clean(f)).toString();
    const netSign = summary.net > 0 ? '+' : '';

    const rowActions = (r) => [
        { label: 'View details', onClick: () => setDetails(r) },
    ];

    const d = details;
    const dt = d ? TYPES[d.type] : null;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Stock Log</h2>
                    <Link href={route('inventory.index')} className={btnSecondary}>Back to Inventory</Link>
                </div>
            }
        >
            <Head title="Stock Log" />

            <div className="mb-4 bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Equipment</label>
                        <select className={inputClass} value={f.equipment_id} onChange={(e) => update('equipment_id', e.target.value)}>
                            <option value="">All equipment</option>
                            {equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Movement</label>
                        <select className={inputClass} value={f.type} onChange={(e) => update('type', e.target.value)}>
                            {TYPE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">From</label>
                        <input type="date" className={inputClass} value={f.from} onChange={(e) => update('from', e.target.value)} />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-600">To</label>
                        <input type="date" className={inputClass} value={f.to} onChange={(e) => update('to', e.target.value)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {hasFilters && (
                            <button type="button" onClick={reset} className={btnSecondary}>Reset</button>
                        )}
                        <a href={exportUrl} className={btnSecondary}>Export CSV</a>
                    </div>
                </div>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Units Added" value={summary.added} tone="green" />
                <StatCard label="Replacements Received" value={summary.replaced} tone="sky" />
                <StatCard label="Damaged Units Removed" value={summary.damaged} tone="red" />
                <StatCard label="Net Change" value={`${netSign}${summary.net}`} tone="blue" />
            </div>

            <div className="overflow-x-auto bg-white shadow-sm ring-1 ring-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gradient-to-r from-blue-800 to-blue-600 text-left text-xs uppercase text-white">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Equipment</th>
                            <th className="px-4 py-3">Movement</th>
                            <th className="px-4 py-3">Change</th>
                            <th className="px-4 py-3">Balance after</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.data.map((r) => {
                            const t = TYPES[r.type];
                            return (
                                <tr key={r.id}>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{r.created_at}</td>
                                    <td className="px-4 py-3 font-medium">
                                        <Link href={route('inventory.show', r.equipment_id)} className="text-blue-700 hover:underline">
                                            {r.equipment_name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={'px-2.5 py-0.5 text-xs font-semibold ' + t.cls}>{t.label}</span>
                                    </td>
                                    <td className={'px-4 py-3 font-bold ' + (r.change >= 0 ? 'text-green-700' : 'text-red-600')}>
                                        {r.change > 0 ? '+' : ''}{r.change}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">{r.balance}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        <ActionMenu items={rowActions(r)} />
                                    </td>
                                </tr>
                            );
                        })}
                        {logs.data.length === 0 && (
                            <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-500">No stock movements found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={logs.links} />

            {/* View details */}
            <Modal show={!!d} onClose={() => setDetails(null)} maxWidth="lg">
                {d && (
                    <div>
                        <div className="flex items-start justify-between bg-gradient-to-r from-blue-900 to-blue-600 px-6 py-4 text-white">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                                    Stock movement #{d.id}
                                </div>
                                <h3 className="mt-1 text-lg font-bold">{d.equipment_name}</h3>
                            </div>
                            <span className={'px-2.5 py-0.5 text-xs font-semibold ' + dt.cls}>{dt.label}</span>
                        </div>

                        <dl className="grid gap-4 p-6 sm:grid-cols-2">
                            <Detail label="Date">{d.created_at}</Detail>
                            <Detail label="Recorded by">{d.user}</Detail>
                            <Detail label="Change">
                                <span className={'font-bold ' + (d.change >= 0 ? 'text-green-700' : 'text-red-600')}>
                                    {d.change > 0 ? '+' : ''}{d.change}
                                </span>
                            </Detail>
                            <Detail label="Balance after">{d.balance}</Detail>
                            <Detail label="Reason" wide>{d.reason}</Detail>
                        </dl>

                        <div className="flex justify-end border-t border-gray-100 px-6 py-3">
                            <button type="button" onClick={() => setDetails(null)} className={btnSecondary}>Close</button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}