import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { btnSecondary } from '@/Components/Field';
import { Head, Link } from '@inertiajs/react';

export default function Show({ equipment }) {
    const available = equipment.available_quantity ?? equipment.total_quantity;
    const borrowed = equipment.total_quantity - available;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">{equipment.name}</h2>
                    <Link href={route('inventory.index')} className={btnSecondary}>Back</Link>
                </div>
            }
        >
            <Head title={equipment.name} />
            <div className="mb-6 rounded-lg border bg-white p-5 shadow-sm">
                <p className="text-gray-600">{equipment.description || 'No description.'}</p>
                <div className="mt-3 flex flex-wrap gap-6 text-sm">
                    <p>Total quantity: <span className="font-bold text-blue-700">{equipment.total_quantity}</span></p>
                    <p>Currently borrowed: <span className="font-bold text-amber-600">{borrowed}</span></p>
                    <p>Available: <span className={'font-bold ' + (available <= 0 ? 'text-red-600' : 'text-green-700')}>{available}</span></p>
                </div>
            </div>

            <h3 className="mb-2 font-semibold text-gray-800">Stock log</h3>
            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Change</th>
                            <th className="px-4 py-3">Reason</th>
                            <th className="px-4 py-3">By</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {equipment.stock_logs.map((log) => (
                            <tr key={log.id}>
                                <td className="px-4 py-3">{new Date(log.created_at).toLocaleString()}</td>
                                <td className={'px-4 py-3 font-semibold ' + (log.change >= 0 ? 'text-green-700' : 'text-red-600')}>
                                    {log.change > 0 ? '+' : ''}{log.change}
                                </td>
                                <td className="px-4 py-3">{log.reason}</td>
                                <td className="px-4 py-3">{log.creator?.name || '-'}</td>
                            </tr>
                        ))}
                        {equipment.stock_logs.length === 0 && (
                            <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-500">No stock changes yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}