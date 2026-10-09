const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    released: 'bg-sky-100 text-sky-800',
    returned: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    disapproved: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }) {
    return (
        <span className={'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ' + (styles[status] || 'bg-gray-100 text-gray-800')}>
            {status}
        </span>
    );
}