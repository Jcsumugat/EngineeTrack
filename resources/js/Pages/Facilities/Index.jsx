import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import { btnPrimary } from '@/Components/Field';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ facilities }) {
    const remove = (f) => {
        if (confirm(`Delete "${f.name}"? This also deletes its reservations.`)) {
            router.delete(route('facilities.destroy', f.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Facilities</h2>
                    <Link href={route('facilities.create')} className={btnPrimary}>Add Facility</Link>
                </div>
            }
        >
            <Head title="Facilities" />
            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Capacity</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {facilities.data.map((f) => (
                            <tr key={f.id}>
                                <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                                <td className="px-4 py-3 text-gray-600">{f.description}</td>
                                <td className="px-4 py-3">{f.capacity ?? '-'}</td>
                                <td className="px-4 py-3">
                                    <span className={'rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (f.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700')}>
                                        {f.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="space-x-3 px-4 py-3 text-right">
                                    <Link href={route('facilities.edit', f.id)} className="text-blue-700 hover:underline">Edit</Link>
                                    <button onClick={() => remove(f)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {facilities.data.length === 0 && (
                            <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No facilities yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination links={facilities.links} />
        </AuthenticatedLayout>
    );
}