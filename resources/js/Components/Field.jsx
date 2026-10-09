export const inputClass =
    'w-full rounded-md border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600';

export const btnPrimary =
    'inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50';

export const btnSecondary =
    'inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50';

export default function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1">{children}</div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}