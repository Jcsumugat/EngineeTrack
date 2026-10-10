import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import Pagination from '@/Components/Pagination';
import ConfirmModal from '@/Components/ConfirmModal';
import ActionMenu from '@/Components/ActionMenu';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { Head, Link, router, useForm } from '@inertiajs/react';

// Units that are not currently out on loan
const availableOf = (item) =>
    Number(item.available_quantity ?? Number(item.total_quantity) - Number(item.out_quantity || 0));

export default function Index({ items, filters }) {
    const [q, setQ] = useState(filters?.q || '');
    const [target, setTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const form = useForm({ action: 'add', quantity: 1, reason: '' });

    const search = (e) => {
        e.preventDefault();
        router.get(route('inventory.index'), { q }, { preserveState: true });
    };

    const closeModal = () => {
        setTarget(null);
        form.reset();
        form.clearErrors();
    };

    const submitStock = (e) => {
        e.preventDefault();
        form.post(route('inventory.stock', target.id), { preserveScroll: true, onSuccess: closeModal });
    };

    const setAction = (action) => {
        form.clearErrors();
        form.setData('action', action);
    };

    const confirmDelete = () => {
        router.delete(route('inventory.destroy', deleteTarget.id), {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const rowActions = (item) => [
        { label: 'View details', onClick: () => router.visit(route('inventory.show', item.id)) },
        { label: 'Manage stock', onClick: () => setTarget(item) },
        { label: 'Edit', onClick: () => router.visit(route('inventory.edit', item.id)) },
        { label: 'Delete', onClick: () => setDeleteTarget(item), tone: 'danger' },
    ];

    const isReduce = form.data.action === 'reduce';
    const available = target ? availableOf(target) : 0;
    const qty = Number(form.data.quantity) || 0;
    const newTotal = target ? Number(target.total_quantity) + (isReduce ? -qty : qty) : 0;

    const tabClass = (active, tone) =>
        'flex-1 px-4 py-2 text-sm font-semibold transition ' +
        (active
            ? tone === 'danger'
                ? 'bg-red-600 text-white'
                : 'bg-blue-700 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50');

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Inventory</h2>
                    <div className="flex gap-2">
                        <Link href={route('stock-log.index')} className={btnSecondary}>Stock Log</Link>
                        <Link href={route('inventory.create')} className={btnPrimary}>Add Equipment</Link>
                    </div>
                </div>
            }
        >
            <Head title="Inventory" />

            <form onSubmit={search} className="mb-4 flex gap-2">
                <input className={inputClass + ' max-w-xs'} placeholder="Search equipment" value={q} onChange={(e) => setQ(e.target.value)} />
                <button className={btnPrimary}>Search</button>
            </form>

            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Total Qty</th>
                            <th className="px-4 py-3">Borrowed</th>
                            <th className="px-4 py-3">Available</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.data.map((item) => {
                            const borrowed = Number(item.out_quantity || 0);
                            const avail = availableOf(item);
                            return (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        <Link href={route('inventory.show', item.id)} className="text-blue-700 hover:underline">{item.name}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{item.description}</td>
                                    <td className="px-4 py-3">{item.total_quantity}</td>
                                    <td className="px-4 py-3">{borrowed}</td>
                                    <td className={'px-4 py-3 font-semibold ' + (avail <= 0 ? 'text-red-600' : 'text-green-700')}>
                                        {avail}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={'rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700')}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        <ActionMenu items={rowActions(item)} />
                                    </td>
                                </tr>
                            );
                        })}
                        {items.data.length === 0 && (
                            <tr><td colSpan="7" className="px-4 py-6 text-center text-gray-500">No equipment found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={items.links} />

            <ConfirmModal
                show={!!deleteTarget}
                title={`Delete "${deleteTarget?.name}"?`}
                message="If this equipment has borrowing or reservation history, it will be deactivated instead of deleted so the records are kept."
                confirmLabel="Delete"
                tone="danger"
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => setDeleteTarget(null)}
            />

            {/* Manage stock modal */}
            <Modal show={!!target} onClose={closeModal} maxWidth="md">
                {target && (
                    <form onSubmit={submitStock} className="space-y-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-800">Manage stock: {target.name}</h3>

                        <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 text-center text-xs ring-1 ring-gray-200">
                            <div>
                                <div className="text-lg font-bold text-gray-800">{target.total_quantity}</div>
                                Total
                            </div>
                            <div>
                                <div className="text-lg font-bold text-amber-600">{Number(target.out_quantity || 0)}</div>
                                Borrowed
                            </div>
                            <div>
                                <div className="text-lg font-bold text-green-700">{available}</div>
                                Available
                            </div>
                        </div>

                        <div className="flex overflow-hidden ring-1 ring-gray-300">
                            <button type="button" onClick={() => setAction('add')} className={tabClass(!isReduce, 'primary')}>
                                Add stock
                            </button>
                            <button type="button" onClick={() => setAction('reduce')} className={tabClass(isReduce, 'danger')}>
                                Reduce stock
                            </button>
                        </div>

                        <Field
                            label={isReduce ? `Quantity to reduce (max ${available})` : 'Quantity to add'}
                            error={form.errors.quantity}
                        >
                            <input
                                type="number"
                                min="1"
                                max={isReduce ? Math.max(available, 1) : undefined}
                                className={inputClass}
                                value={form.data.quantity}
                                onChange={(e) => form.setData('quantity', e.target.value)}
                            />
                        </Field>

                        <Field
                            label={isReduce ? 'Reason (required)' : 'Reason (optional)'}
                            error={form.errors.reason}
                        >
                            <input
                                className={inputClass}
                                placeholder={isReduce ? 'e.g. Lost, disposed, transferred' : 'e.g. New purchase, donation'}
                                value={form.data.reason}
                                onChange={(e) => form.setData('reason', e.target.value)}
                            />
                        </Field>

                        <p className={'text-xs ' + (isReduce ? 'text-red-600' : 'text-green-700')}>
                            New total after this change: <span className="font-semibold">{newTotal}</span>.
                            This movement will be recorded in the stock log.
                        </p>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={closeModal} className={btnSecondary}>Cancel</button>
                            <button
                                disabled={form.processing || (isReduce && (available <= 0 || qty > available))}
                                className={btnPrimary}
                            >
                                {isReduce ? 'Confirm reduction' : 'Confirm addition'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}