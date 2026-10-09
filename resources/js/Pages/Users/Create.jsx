import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Field, { inputClass, btnPrimary, btnSecondary } from '@/Components/Field';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ departments }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '', email: '', password: '', role: 'faculty_staff', department_id: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('users.store'));
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Add User</h2>}>
            <Head title="Add User" />
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg border bg-white p-6 shadow-sm">
                <Field label="Full name" error={errors.name}>
                    <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} />
                </Field>
                <Field label="Email" error={errors.email}>
                    <input type="email" className={inputClass} value={data.email} onChange={(e) => setData('email', e.target.value)} />
                </Field>
                <Field label="Password (min 8 characters)" error={errors.password}>
                    <input type="password" className={inputClass} value={data.password} onChange={(e) => setData('password', e.target.value)} />
                </Field>
                <Field label="Role" error={errors.role}>
                    <select className={inputClass} value={data.role} onChange={(e) => setData('role', e.target.value)}>
                        <option value="faculty_staff">Staff/Faculty</option>
                        <option value="admin">Admin</option>
                    </select>
                </Field>
                <Field label="Department" error={errors.department_id}>
                    <select className={inputClass} value={data.department_id} onChange={(e) => setData('department_id', e.target.value)}>
                        <option value="">None</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </Field>
                <div className="flex gap-2">
                    <button disabled={processing} className={btnPrimary}>Create user</button>
                    <Link href={route('users.index')} className={btnSecondary}>Cancel</Link>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}