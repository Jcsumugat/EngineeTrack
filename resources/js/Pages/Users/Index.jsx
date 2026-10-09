import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Pagination from '@/Components/Pagination';
import { btnPrimary } from '@/Components/Field';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ users }) {
    const remove = (u) => {
        if (confirm(`Delete user "${u.name}"? Their reservations and borrowings are deleted too.`)) {
            router.delete(route('users.destroy', u.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Users</h2>
                    <Link href={route('users.create')} className={btnPrimary}>Add User</Link>
                </div>
            }
        >
            <Head title="Users" />
            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.data.map((u) => (
                            <tr key={u.id}>
                                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                                <td className="px-4 py-3">{u.email}</td>
                                <td className="px-4 py-3">
                                    <span className={'rounded-full px-2.5 py-0.5 text-xs font-semibold ' + (u.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')}>
                                        {u.role === 'admin' ? 'Admin' : 'Staff/Faculty'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{u.department?.name || '-'}</td>
                                <td className="space-x-3 px-4 py-3 text-right">
                                    <Link href={route('users.edit', u.id)} className="text-blue-700 hover:underline">Edit</Link>
                                    <button onClick={() => remove(u)} className="text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination links={users.links} />
        </AuthenticatedLayout>
    );
}