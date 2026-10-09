import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import ConfirmModal from '@/Components/ConfirmModal';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { fmt } from '@/utils';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

const ACTIONS = {
    approve: {
        route: 'borrowings.approve',
        title: 'Approve this borrow request?',
        label: 'Approve',
        tone: 'primary',
        message: (b) =>
            `${b.quantity} x ${b.equipment?.name} will be held for ${b.user?.name}. Stock only goes down when you release it.`,
    },
    disapprove: {
        route: 'borrowings.disapprove',
        title: 'Disapprove this borrow request?',
        label: 'Disapprove',
        tone: 'danger',
        message: (b) => `The request of ${b.user?.name} for ${b.quantity} x ${b.equipment?.name} will be declined.`,
    },
    release: {
        route: 'borrowings.release',
        title: 'Release this equipment?',
        label: 'Release',
        tone: 'primary',
        message: (b) =>
            `${b.quantity} x ${b.equipment?.name} will be handed to ${b.user?.name} and deducted from available stock.`,
    },
};

export default function Index({ borrowings }) {
    const { auth } = usePage().props;
    const isAdmin = auth.user.role === 'admin';
    const [target, setTarget] = useState(null);
    const [confirm, setConfirm] = useState(null); // { action, item }
    const [busy, setBusy] = useState(false);
    const form = useForm({ is_damaged: false, damaged_quantity: 0, damage_note: '' });

    const runConfirmed = () => {
        const cfg = ACTIONS[confirm.action];
        router.patch(route(cfg.route, confirm.item.id), {}, {
            preserveScroll: true,
            onStart: () => setBusy(true),
            onFinish: () => {
                setBusy(false);
                setConfirm(null);
            },
        });
    };

    const close = () => {
        setTarget(null);
        form.reset();
        form.clearErrors();
    };

    const submitReturn = (e) => {
        e.preventDefault();
        form.patch(route('borrowings.return', target.id), { preserveScroll: true, onSuccess: close });
    };

    const link = 'text-blue-700 hover:underline';
    const cfg = confirm ? ACTIONS[confirm.action] : null;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Borrowings</h2>
                    <Link href={route('borrowings.create')} className={btnPrimary}>New Borrow Request</Link>
                </div>
            }
        >
            <Head title="Borrowings" />

            <div className="overflow-x-auto bg-white shadow-sm ring-1 ring-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gradient-to-r from-blue-800 to-blue-600 text-left text-xs uppercase text-white">
                        <tr>
                            {isAdmin && <th className="px-4 py-3">Borrower</th>}
                            <th className="px-4 py-3">Equipment</th>
                            <th className="px-4 py-3">Qty</th>
                            <th className="px-4 py-3">Borrowed</th>
                            <th className="px-4 py-3">Due</th>
                            <th className="px-4 py-3">Returned</th>
                            <th className="px-4 py-3">Condition</th>
                            <th className="px-4 py-3">Status</th>
                            {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {borrowings.data.map((b) => (
                            <tr key={b.id}>
                                {isAdmin && (
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{b.user?.name}</div>
                                        <div className="text-xs text-gray-500">{b.department?.name ?? b.user?.department?.name}</div>
                                    </td>
                                )}
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{b.equipment?.name}</div>
                                    {!isAdmin && (
                                        <div className="text-xs text-gray-500">{b.department?.name}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3">{b.quantity}</td>
                                <td className="px-4 py-3">{fmt(b.borrowed_at)}</td>
                                <td className="px-4 py-3">{fmt(b.due_at)}</td>
                                <td className="px-4 py-3">{fmt(b.returned_at)}</td>
                                <td className="px-4 py-3">
                                    {b.status === 'returned' ? (
                                        b.is_damaged ? (
                                            <span className="text-red-600">
                                                {b.damaged_quantity} damaged
                                                {b.damage_note && <div className="text-xs text-gray-600">{b.damage_note}</div>}
                                            </span>
                                        ) : (
                                            <span className="text-green-700">Good</span>
                                        )
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                                {isAdmin && (
                                    <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right">
                                        {b.status === 'pending' && (
                                            <>
                                                <button onClick={() => setConfirm({ action: 'approve', item: b })} className={link}>Approve</button>
                                                <button onClick={() => setConfirm({ action: 'disapprove', item: b })} className="text-red-600 hover:underline">Disapprove</button>
                                            </>
                                        )}
                                        {b.status === 'approved' && (
                                            <button onClick={() => setConfirm({ action: 'release', item: b })} className={link}>Release</button>
                                        )}
                                        {b.status === 'released' && (
                                            <button onClick={() => setTarget(b)} className={link}>Return</button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                        {borrowings.data.length === 0 && (
                            <tr><td colSpan="9" className="px-4 py-6 text-center text-gray-500">No borrowings yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={borrowings.links} />

            <ConfirmModal
                show={!!confirm}
                title={cfg?.title}
                message={confirm ? cfg.message(confirm.item) : ''}
                confirmLabel={cfg?.label}
                tone={cfg?.tone}
                processing={busy}
                onConfirm={runConfirmed}
                onClose={() => setConfirm(null)}
            />

            <Modal show={!!target} onClose={close} maxWidth="md">
                <form onSubmit={submitReturn} className="space-y-4 p-6">
                    <h3 className="text-lg font-bold text-gray-800">
                        Receive return: {target?.equipment?.name} (x{target?.quantity})
                    </h3>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            className="border-gray-300 text-blue-700 focus:ring-blue-700"
                            checked={form.data.is_damaged}
                            onChange={(e) => form.setData('is_damaged', e.target.checked)}
                        />
                        Some items are broken or damaged
                    </label>

                    {form.data.is_damaged && (
                        <>
                            <Field label={`Damaged quantity (max ${target?.quantity})`} error={form.errors.damaged_quantity}>
                                <input
                                    type="number" min="0" max={target?.quantity}
                                    className={inputClass}
                                    value={form.data.damaged_quantity}
                                    onChange={(e) => form.setData('damaged_quantity', e.target.value)}
                                />
                            </Field>
                            <Field label="Note" error={form.errors.damage_note}>
                                <textarea
                                    rows="3" className={inputClass}
                                    value={form.data.damage_note}
                                    onChange={(e) => form.setData('damage_note', e.target.value)}
                                />
                            </Field>
                            <p className="text-xs text-red-600">Damaged units are removed from the total stock.</p>
                        </>
                    )}

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={close} className={btnSecondary}>Cancel</button>
                        <button disabled={form.processing} className={btnPrimary}>Confirm return</button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}