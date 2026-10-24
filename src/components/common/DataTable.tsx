import React from 'react';

interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  caption,
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records available.',
  className = '',
}: DataTableProps<T>) {
  return (
    <div className={`overflow-x-auto border border-slate-200 rounded-md bg-white ${className}`}>
      <table className="w-full text-left text-xs md:text-sm border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
            {columns.map((col, idx) => (
              <th key={idx} scope="col" className={`p-3 font-semibold ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-4 text-center text-slate-500 italic">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-slate-50/80 transition-colors">
                {columns.map((col, idx) => (
                  <td key={idx} className={`p-3 text-slate-800 ${col.className || ''}`}>
                    {col.render ? col.render(row) : col.accessor ? String(row[col.accessor] ?? '') : ''}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
