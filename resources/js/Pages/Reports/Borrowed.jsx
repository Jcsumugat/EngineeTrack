import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import StatusBadge from '@/Components/StatusBadge';
import { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { Head, Link, router, usePage } from '@inertiajs/react';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const FOCUS_LABELS = { all: 'All Resources', equipment: 'Equipment Only', venue: 'Venues Only' };

const PER_PAGE = 10;

function StatCard({ label, value, danger = false }) {
    return (
        <div className={'bg-white p-4 shadow-sm ring-1 ' + (danger ? 'ring-red-200' : 'ring-gray-200')}>
            <div className="text-xs text-gray-500">{label}</div>
            <div className={'mt-1 text-3xl font-extrabold ' + (danger ? 'text-red-700' : 'text-blue-900')}>{value}</div>
        </div>
    );
}

export default function Borrowed({ report, filters }) {
    const { auth } = usePage().props;
    const [f, setF] = useState({
        month: filters.month,
        year: filters.year,
        focus: filters.focus,
    });
    const [preview, setPreview] = useState(false);
    const [page, setPage] = useState(1);

    const apply = (e) => {
        e.preventDefault();
        setPage(1);
        router.get(route('reports.borrowed'), f, { preserveState: true });
    };

    const exportUrl = route('reports.borrowed.export') + '?' + new URLSearchParams(f).toString();
    const preparedOn = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const { totals, equipment_summary, detail_rows } = report;

    // Screen-only pagination (print layout and CSV always include every row)
    const pages = Math.max(1, Math.ceil(detail_rows.length / PER_PAGE));
    const current = Math.min(page, pages);
    const pageRows = detail_rows.slice((current - 1) * PER_PAGE, current * PER_PAGE);

    // Damaged items come from the detail rows that were returned with damaged units
    const damaged_rows = detail_rows.filter((r) => Number(r.damaged_quantity ?? 0) > 0);
    const damagedUnits = totals.damaged_quantity ?? damaged_rows.reduce((s, r) => s + Number(r.damaged_quantity), 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Reports</h2>
                    <Link href={route('reports.returns')} className={btnSecondary}>Returns by Department</Link>
                </div>
            }
        >
            <Head title="Reports" />

            {/* Prints only the report section, hides the rest of the page */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-report, #print-report * { visibility: visible; }
                    #print-report { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>

            <div className="print:hidden">
                {/* Filter */}
                <form onSubmit={apply} className="mb-4 bg-white p-5 shadow-sm ring-1 ring-gray-200">
                    <h3 className="text-base font-bold text-gray-800">Generate Monthly Report</h3>
                    <p className="mb-4 mt-1 text-xs text-gray-500">
                        Monthly report on borrowed resources and equipment requested from the Engineer&rsquo;s Office.
                    </p>
                    <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Month</label>
                            <select className={inputClass} value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })}>
                                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Year</label>
                            <input type="number" min="2020" max="2100" className={inputClass} value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Report Focus</label>
                            <select className={inputClass} value={f.focus} onChange={(e) => setF({ ...f, focus: e.target.value })}>
                                {Object.entries(FOCUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button className={btnPrimary}>Apply Filter</button>
                            <button type="button" onClick={() => window.print()} className={btnSecondary}>Print Report</button>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setPreview(!preview)} className={btnSecondary}>
                            {preview ? 'Hide Print Preview' : 'Preview Print Layout'}
                        </button>
                        <a href={exportUrl} className={btnSecondary}>Export CSV</a>
                    </div>
                </form>

                {/* Summary */}
                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard label={`Reservations & Borrowings (${report.period_label})`} value={totals.reservations} />
                    <StatCard label="Equipment Units Borrowed" value={totals.equipment_quantity} />
                    <StatCard label="Equipment Types Requested" value={totals.equipment_types} />
                    <StatCard label="Departments Served" value={totals.departments} />
                    <StatCard label="Damaged Units Returned" value={damagedUnits} danger />
                </div>

                <div className="grid gap-4 lg:grid-cols-12">
                    {/* Equipment types */}
                    <div className="lg:col-span-5">
                        <div className="overflow-x-auto bg-white shadow-sm ring-1 ring-gray-200">
                            <div className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-gray-800">Equipment Types (Monthly)</div>
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gradient-to-r from-blue-800 to-blue-600 text-left text-xs uppercase text-white">
                                    <tr>
                                        <th className="px-4 py-3">Equipment</th>
                                        <th className="px-4 py-3">Qty</th>
                                        <th className="px-4 py-3">Requests</th>
                                        <th className="px-4 py-3">Damaged</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {equipment_summary.map((row) => (
                                        <tr key={row.resource_name}>
                                            <td className="px-4 py-3 font-medium text-gray-900">{row.resource_name}</td>
                                            <td className="px-4 py-3">{row.total_quantity}</td>
                                            <td className="px-4 py-3">{row.request_count}</td>
                                            <td className="px-4 py-3">
                                                {Number(row.damaged_quantity ?? 0) > 0
                                                    ? <span className="font-semibold text-red-600">{row.damaged_quantity}</span>
                                                    : <span className="text-gray-400">0</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {equipment_summary.length === 0 && (
                                        <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-500">No equipment data for this period.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="lg:col-span-7">
                        <div className="overflow-x-auto bg-white shadow-sm ring-1 ring-gray-200">
                            <div className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-gray-800">Borrowed Resources &amp; Reservations</div>
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gradient-to-r from-blue-800 to-blue-600 text-left text-xs uppercase text-white">
                                    <tr>
                                        <th className="px-4 py-3">Request</th>
                                        <th className="px-4 py-3">Borrower</th>
                                        <th className="px-4 py-3">Resource</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Schedule</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pageRows.map((row) => (
                                        <tr key={row.key}>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900">{row.request_code}</div>
                                                <div className="text-xs text-gray-500">{row.event_title}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-gray-900">{row.requester_name}</div>
                                                <div className="text-xs text-gray-500">{row.department}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.resource_name} (x{row.quantity})
                                                {Number(row.damaged_quantity ?? 0) > 0 && (
                                                    <div className="text-xs font-semibold text-red-600">{row.damaged_quantity} damaged</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 capitalize">{row.item_type}</td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <div>{row.start}</div>
                                                <div className="text-xs text-gray-500">to {row.end}</div>
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                                        </tr>
                                    ))}
                                    {detail_rows.length === 0 && (
                                        <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-500">No records for the selected period.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            {detail_rows.length > PER_PAGE && (
                                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-600">
                                    <span>
                                        Showing {(current - 1) * PER_PAGE + 1}-{Math.min(current * PER_PAGE, detail_rows.length)} of {detail_rows.length}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={current === 1}
                                            onClick={() => setPage(current - 1)}
                                            className={btnSecondary + ' disabled:opacity-40'}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            disabled={current === pages}
                                            onClick={() => setPage(current + 1)}
                                            className={btnSecondary + ' disabled:opacity-40'}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Damaged items returned */}
                <div className="mt-4 overflow-x-auto bg-white shadow-sm ring-1 ring-red-200">
                    <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-3">
                        <div className="text-sm font-bold text-red-800">Damaged Items Returned</div>
                        <div className="text-xs font-semibold text-red-700">{damagedUnits} unit(s) &middot; {damaged_rows.length} record(s)</div>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gradient-to-r from-red-800 to-red-600 text-left text-xs uppercase text-white">
                            <tr>
                                <th className="px-4 py-3">Request</th>
                                <th className="px-4 py-3">Equipment</th>
                                <th className="px-4 py-3">Borrower</th>
                                <th className="px-4 py-3">Damaged / Borrowed</th>
                                <th className="px-4 py-3">Returned</th>
                                <th className="px-4 py-3">Damage Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {damaged_rows.map((row) => (
                                <tr key={row.key}>
                                    <td className="px-4 py-3 font-semibold text-gray-900">{row.request_code}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{row.resource_name}</td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">{row.requester_name}</div>
                                        <div className="text-xs text-gray-500">{row.department}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-semibold text-red-600">{row.damaged_quantity}</span> of {row.quantity}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">{row.returned_at ?? '-'}</td>
                                    <td className="px-4 py-3 text-gray-600">{row.damage_note || '-'}</td>
                                </tr>
                            ))}
                            {damaged_rows.length === 0 && (
                                <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-500">No damaged items returned in this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print layout: shown on paper, and on screen only when previewing */}
            <div className={preview ? 'mt-6 block' : 'hidden print:block'}>
                {/* Toolbar: only visible on screen while previewing, never printed */}
                {preview && (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 bg-blue-50 px-4 py-3 ring-1 ring-blue-200 print:hidden">
                        <div className="text-sm font-semibold text-blue-900">
                            Print preview &middot; {report.period_label} &middot; {FOCUS_LABELS[filters.focus]}
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => window.print()} className={btnPrimary}>Print</button>
                            <button type="button" onClick={() => setPreview(false)} className={btnSecondary}>Close Preview</button>
                        </div>
                    </div>
                )}

                <div
                    id="print-report"
                    className={(preview ? 'ring-1 ring-gray-300' : '') + ' bg-white p-8 text-black print:p-0 print:ring-0'}
                >
                    <div className="border-b-2 border-black pb-3 text-center">
                        <div className="text-xl font-extrabold tracking-tight">EngineeTrack</div>
                        <div className="text-sm font-semibold">Engineer&rsquo;s Office</div>
                        <div className="mt-2 text-base font-bold uppercase">Monthly Report on Borrowed Resources and Equipment</div>
                        <div className="text-sm">For the month of {report.period_label} &middot; {FOCUS_LABELS[filters.focus]}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-5 gap-3 text-center text-xs">
                        <div className="border border-black p-2"><div className="text-lg font-bold">{totals.reservations}</div>Reservations &amp; Borrowings</div>
                        <div className="border border-black p-2"><div className="text-lg font-bold">{totals.equipment_quantity}</div>Equipment Units Borrowed</div>
                        <div className="border border-black p-2"><div className="text-lg font-bold">{totals.equipment_types}</div>Equipment Types</div>
                        <div className="border border-black p-2"><div className="text-lg font-bold">{totals.departments}</div>Departments Served</div>
                        <div className="border border-black p-2"><div className="text-lg font-bold">{damagedUnits}</div>Damaged Units Returned</div>
                    </div>

                    <h4 className="mb-1 mt-5 text-sm font-bold uppercase">Equipment Types</h4>
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr>
                                <th className="border border-black px-2 py-1 text-left">Equipment</th>
                                <th className="border border-black px-2 py-1 text-left">Qty</th>
                                <th className="border border-black px-2 py-1 text-left">Requests</th>
                                <th className="border border-black px-2 py-1 text-left">Damaged</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipment_summary.map((row) => (
                                <tr key={row.resource_name}>
                                    <td className="border border-black px-2 py-1">{row.resource_name}</td>
                                    <td className="border border-black px-2 py-1">{row.total_quantity}</td>
                                    <td className="border border-black px-2 py-1">{row.request_count}</td>
                                    <td className="border border-black px-2 py-1">{row.damaged_quantity ?? 0}</td>
                                </tr>
                            ))}
                            {equipment_summary.length === 0 && (
                                <tr><td colSpan="4" className="border border-black px-2 py-2 text-center">No equipment data for this period.</td></tr>
                            )}
                        </tbody>
                    </table>

                    <h4 className="mb-1 mt-5 text-sm font-bold uppercase">Borrowed Resources &amp; Reservations</h4>
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr>
                                {['Request', 'Borrower', 'Department', 'Resource', 'Type', 'Schedule', 'Status'].map((h) => (
                                    <th key={h} className="border border-black px-2 py-1 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {detail_rows.map((row) => (
                                <tr key={row.key}>
                                    <td className="border border-black px-2 py-1">{row.request_code}{row.event_title ? ` - ${row.event_title}` : ''}</td>
                                    <td className="border border-black px-2 py-1">{row.requester_name}</td>
                                    <td className="border border-black px-2 py-1">{row.department}</td>
                                    <td className="border border-black px-2 py-1">{row.resource_name} (x{row.quantity})</td>
                                    <td className="border border-black px-2 py-1 capitalize">{row.item_type}</td>
                                    <td className="border border-black px-2 py-1">{row.start} to {row.end}</td>
                                    <td className="border border-black px-2 py-1 capitalize">{row.status}</td>
                                </tr>
                            ))}
                            {detail_rows.length === 0 && (
                                <tr><td colSpan="7" className="border border-black px-2 py-2 text-center">No records for the selected period.</td></tr>
                            )}
                        </tbody>
                    </table>

                    <h4 className="mb-1 mt-5 text-sm font-bold uppercase">Damaged Items Returned</h4>
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr>
                                {['Request', 'Equipment', 'Borrower', 'Department', 'Damaged', 'Borrowed', 'Returned', 'Damage Note'].map((h) => (
                                    <th key={h} className="border border-black px-2 py-1 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {damaged_rows.map((row) => (
                                <tr key={row.key}>
                                    <td className="border border-black px-2 py-1">{row.request_code}</td>
                                    <td className="border border-black px-2 py-1">{row.resource_name}</td>
                                    <td className="border border-black px-2 py-1">{row.requester_name}</td>
                                    <td className="border border-black px-2 py-1">{row.department}</td>
                                    <td className="border border-black px-2 py-1">{row.damaged_quantity}</td>
                                    <td className="border border-black px-2 py-1">{row.quantity}</td>
                                    <td className="border border-black px-2 py-1">{row.returned_at ?? '-'}</td>
                                    <td className="border border-black px-2 py-1">{row.damage_note || '-'}</td>
                                </tr>
                            ))}
                            {damaged_rows.length === 0 && (
                                <tr><td colSpan="8" className="border border-black px-2 py-2 text-center">No damaged items returned in this period.</td></tr>
                            )}
                        </tbody>
                    </table>

                    <div className="mt-10 grid grid-cols-2 gap-10 text-xs">
                        <div>
                            <div className="mb-8">Prepared by:</div>
                            <div className="border-t border-black pt-1 font-semibold">{auth.user.name}</div>
                            <div>Engineer&rsquo;s Office Staff</div>
                        </div>
                        <div>
                            <div className="mb-8">Noted by:</div>
                            <div className="border-t border-black pt-1 font-semibold">Engr. Erhic M. Doroteo</div>
                            <div>Head, Engineer&rsquo;s Office</div>
                        </div>
                    </div>
                    <div className="mt-6 text-xs">Date prepared: {preparedOn}</div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}