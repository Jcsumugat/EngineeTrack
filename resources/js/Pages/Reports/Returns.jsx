import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import StatusBadge from '@/Components/StatusBadge';
import { btnSecondary } from '@/Components/Field';
import { Head, Link } from '@inertiajs/react';

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'returned', label: 'Returned' },
    { key: 'unreturned', label: 'Unreturned' },
    { key: 'damaged', label: 'Damaged' },
];

export default function Returns({ rows, details = {} }) {
    const [dept, setDept] = useState(null);
    const [filter, setFilter] = useState('all');

    const close = () => {
        setDept(null);
        setFilter('all');
    };

    const records = dept ? details[dept.id] ?? [] : [];
    const shown = records.filter((b) => {
        if (filter === 'returned') return b.status === 'returned';
        if (filter === 'unreturned') return b.status === 'released';
        if (filter === 'damaged') return b.damaged_quantity > 0;
        return true;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Returned vs Unreturned by Department</h2>
                    <Link href={route('reports.borrowed')} className={btnSecondary}>Borrowed Report</Link>
                </div>
            }
        >
            <Head title="Returns Report" />
            <div className="overflow-x-auto bg-white shadow-sm ring-1 ring-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gradient-to-r from-blue-800 to-blue-600 text-left text-xs uppercase text-white">
                        <tr>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Returned</th>
                            <th className="px-4 py-3">Unreturned</th>
                            <th className="px-4 py-3">Damaged units</th>
                            <th className="px-4 py-3 text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((r) => {
                            const count = (details[r.id] ?? []).length;
                            return (
                                <tr key={r.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                                    <td className="px-4 py-3 font-semibold text-green-700">{r.returned_count ?? 0}</td>
                                    <td className="px-4 py-3 font-semibold text-amber-600">{r.unreturned_count ?? 0}</td>
                                    <td className="px-4 py-3 font-semibold text-red-600">{r.damaged_total ?? 0}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            disabled={count === 0}
                                            onClick={() => setDept(r)}
                                            className="border border-blue-700 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
                                        >
                                            Details{count > 0 ? ` (${count})` : ''}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {rows.length === 0 && (
                            <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No departments found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal show={!!dept} onClose={close} maxWidth="2xl">
                {dept && (
                    <div>
                        <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-4 text-white">
                            <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Department</div>
                            <h3 className="text-lg font-bold">{dept.name}</h3>
                            <div className="mt-2 flex flex-wrap gap-4 text-xs">
                                <span>Returned: <b>{dept.returned_count ?? 0}</b></span>
                                <span>Unreturned: <b>{dept.unreturned_count ?? 0}</b></span>
                                <span>Damaged units: <b>{dept.damaged_total ?? 0}</b></span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-6 py-3">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.key}
                                    type="button"
                                    onClick={() => setFilter(f.key)}
                                    className={'px-3 py-1 text-xs font-semibold ' + (filter === f.key
                                        ? 'bg-blue-700 text-white'
                                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50')}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="max-h-96 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-2">Request</th>
                                        <th className="px-4 py-2">Equipment</th>
                                        <th className="px-4 py-2">Borrower</th>
                                        <th className="px-4 py-2">Borrowed</th>
                                        <th className="px-4 py-2">Returned</th>
                                        <th className="px-4 py-2">Status</th>
                                        <th className="px-4 py-2">Condition</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {shown.map((b) => (
                                        <tr key={b.id}>
                                            <td className="px-4 py-2 font-semibold text-gray-900">{b.request_code}</td>
                                            <td className="px-4 py-2">{b.equipment} <span className="text-gray-500">(x{b.quantity})</span></td>
                                            <td className="px-4 py-2">{b.borrower}</td>
                                            <td className="whitespace-nowrap px-4 py-2">
                                                <div>{b.borrowed_at ?? '-'}</div>
                                                <div className="text-xs text-gray-500">Due {b.due_at ?? '-'}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-2">{b.returned_at ?? '-'}</td>
                                            <td className="px-4 py-2"><StatusBadge status={b.status} /></td>
                                            <td className="px-4 py-2">
                                                {b.status !== 'returned' ? '-' : b.damaged_quantity > 0 ? (
                                                    <span className="text-red-600">
                                                        {b.damaged_quantity} damaged
                                                        {b.damage_note && <div className="text-xs text-gray-600">{b.damage_note}</div>}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-700">Good</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {shown.length === 0 && (
                                        <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-500">No records for this filter.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                            <button type="button" onClick={close} className={btnSecondary}>Close</button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}