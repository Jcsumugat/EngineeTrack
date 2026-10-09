import { Link } from '@inertiajs/react';

export default function Pagination({ links = [] }) {
    if (links.length <= 3) return null;
    return (
        <div className="mt-4 flex flex-wrap gap-1">
            {links.map((l, i) =>
                l.url ? (
                    <Link
                        key={i}
                        href={l.url}
                        preserveScroll
                        className={'rounded border px-3 py-1 text-sm ' +
                            (l.active ? 'border-blue-700 bg-blue-700 text-white' : 'bg-white text-gray-700 hover:bg-blue-50')}
                        dangerouslySetInnerHTML={{ __html: l.label }}
                    />
                ) : (
                    <span key={i} className="rounded border bg-gray-100 px-3 py-1 text-sm text-gray-400"
                        dangerouslySetInnerHTML={{ __html: l.label }} />
                ),
            )}
        </div>
    );
}