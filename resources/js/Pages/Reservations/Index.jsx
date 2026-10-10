import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import ConfirmModal from '@/Components/ConfirmModal';
import ActionMenu from '@/Components/ActionMenu';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { fmt } from '@/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';

const itemName = (r) => r.equipment?.name ?? r.facility?.name;

const ACTIONS = {
    approve: {
        route: 'reservations.approve',
        title: 'Approve this reservation?',
        label: 'Approve',
        tone: 'primary',
        message: (r) => `${r.user?.name}'s reservation for ${itemName(r)} will be approved.`,
    },
    disapprove: {
        route: 'reservations.disapprove',
        title: 'Disapprove this reservation?',
        label: 'Disapprove',
        tone: 'danger',
        message: (r) => `${r.user?.name}'s reservation for ${itemName(r)} will be declined.`,
    },
    release: {
        route: 'reservations.release',
        title: 'Release this reservation?',
        label: 'Release',
        tone: 'primary',
        message: (r) =>
            r.equipment_id
                ? `${r.quantity} x ${itemName(r)} will be handed out and deducted from available stock.`
                : `${itemName(r)} will be marked as in use.`,
    },
    complete: {
        route: 'reservations.complete',
        title: 'Mark as completed?',
        label: 'Complete',
        tone: 'primary',
        message: (r) => `The use of ${itemName(r)} will be marked as completed.`,
    },
    cancel: {
        route: 'reservations.cancel',
        title: 'Cancel this reservation?',
        label: 'Yes, cancel it',
        tone: 'danger',
        message: (r) => `The reservation for ${itemName(r)} will be cancelled. This cannot be undone.`,
    },
};

function Detail({ label, children, wide = false }) {
    return (
        <div className={wide ? 'sm:col-span-2' : ''}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{children || <span className="text-gray-400">-</span>}</dd>
        </div>
    );
}

export default function Index({ reservations }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user.role === 'admin';
    const [confirm, setConfirm] = useState(null); // { action, item }
    const [remarks, setRemarks] = useState('');
    const [busy, setBusy] = useState(false);
    const [details, setDetails] = useState(null);

    const open = (action, item) => {
        setRemarks('');
        setConfirm({ action, item });
    };

    const runConfirmed = () => {
        const cfg = ACTIONS[confirm.action];
        const data = confirm.action === 'disapprove' ? { remarks } : {};
        router.patch(route(cfg.route, confirm.item.id), data, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => {
                setBusy(false);
                setConfirm(null);
            },
        });
    };

    const rowActions = (r) => [
        { label: 'View details', onClick: () => setDetails(r) },
        isAdmin && r.status === 'pending' && { label: 'Approve', onClick: () => open('approve', r) },
        isAdmin && r.status === 'pending' && { label: 'Disapprove', onClick: () => open('disapprove', r), tone: 'danger' },
        isAdmin && r.status === 'approved' && { label: 'Release', onClick: () => open('release', r) },
        isAdmin && r.status === 'released' && r.facility_id && { label: 'Complete', onClick: () => open('complete', r) },
        ['pending', 'approved'].includes(r.status) && { label: 'Cancel', onClick: () => open('cancel', r), tone: 'danger' },
    ];

    const cfg = confirm ? ACTIONS[confirm.action] : null;
    const d = details;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Reservations</h2>
                    <Link href={route('reservations.create')} className={btnPrimary}>New Reservation</Link>
                </div>
            }
        >
            <Head title="Reservations" />

            <div className="overflow-x-auto bg-white shadow-sm ring-1 ring-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gradient-to-r from-blue-800 to-blue-600 text-left text-xs uppercase text-white">
                        <tr>
                            {isAdmin && <th className="px-4 py-3">Requested by</th>}
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3">Qty</th>
                            <th className="px-4 py-3">From</th>
                            <th className="px-4 py-3">To</th>
                            <th className="px-4 py-3">Purpose</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reservations.data.map((r) => (
                            <tr key={r.id}>
                                {isAdmin && (
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{r.user?.name}</div>
                                        <div className="text-xs text-gray-500">{r.department?.name ?? r.user?.department?.name}</div>
                                    </td>
                                )}
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{r.equipment?.name ?? r.facility?.name}</div>
                                    <div className="text-xs text-gray-500">{r.equipment_id ? 'Equipment' : 'Facility'}</div>
                                    {!isAdmin && (
                                        <div className="text-xs text-gray-500">{r.department?.name}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3">{r.quantity}</td>
                                <td className="px-4 py-3">{fmt(r.date_from)}</td>
                                <td className="px-4 py-3">{fmt(r.date_to)}</td>
                                <td className="px-4 py-3 text-gray-600">
                                    {r.purpose}
                                    {r.remarks && <div className="text-xs text-red-600">Remarks: {r.remarks}</div>}
                                </td>
                                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                                <td className="whitespace-nowrap px-4 py-3 text-right">
                                    <ActionMenu items={rowActions(r)} />
                                </td>
                            </tr>
                        ))}
                        {reservations.data.length === 0 && (
                            <tr><td colSpan="8" className="px-4 py-6 text-center text-gray-500">No reservations yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={reservations.links} />

            {/* View details */}
            <Modal show={!!d} onClose={() => setDetails(null)} maxWidth="lg">
                {d && (
                    <div>
                        <div className="flex items-start justify-between bg-gradient-to-r from-blue-900 to-blue-600 px-6 py-4 text-white">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                                    Reservation #{d.id}
                                </div>
                                <h3 className="mt-1 text-lg font-bold">{itemName(d)}</h3>
                            </div>
                            <StatusBadge status={d.status} />
                        </div>

                        <dl className="grid gap-4 p-6 sm:grid-cols-2">
                            <Detail label="Requested by">
                                {d.user?.name}
                                {d.user?.email && <div className="text-xs text-gray-500">{d.user.email}</div>}
                            </Detail>
                            <Detail label="Department">{d.department?.name ?? d.user?.department?.name}</Detail>
                            <Detail label="Type">{d.equipment_id ? 'Equipment' : 'Facility'}</Detail>
                            <Detail label="Quantity">{d.quantity}</Detail>
                            <Detail label="From">{fmt(d.date_from)}</Detail>
                            <Detail label="To">{fmt(d.date_to)}</Detail>
                            <Detail label="Purpose" wide>{d.purpose}</Detail>
                            <Detail label="Submitted on">{fmt(d.created_at)}</Detail>
                            <Detail label="Reviewed by">
                                {d.reviewer?.name}
                                {d.reviewed_at && <div className="text-xs text-gray-500">{fmt(d.reviewed_at)}</div>}
                            </Detail>
                            {d.remarks && (
                                <Detail label="Remarks" wide>
                                    <span className="text-red-600">{d.remarks}</span>
                                </Detail>
                            )}
                        </dl>

                        <div className="flex justify-end border-t border-gray-100 px-6 py-3">
                            <button type="button" onClick={() => setDetails(null)} className={btnSecondary}>Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                show={!!confirm}
                title={cfg?.title}
                message={confirm ? cfg.message(confirm.item) : ''}
                confirmLabel={cfg?.label}
                tone={cfg?.tone}
                processing={busy}
                onConfirm={runConfirmed}
                onClose={() => setConfirm(null)}
            >
                {confirm?.action === 'disapprove' && (
                    <Field label="Reason for disapproval (optional)">
                        <textarea
                            rows="3"
                            className={inputClass}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
                    </Field>
                )}
            </ConfirmModal>
        </AuthenticatedLayout>
    );
}