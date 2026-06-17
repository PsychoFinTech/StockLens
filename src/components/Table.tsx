import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { TableRowSkeleton } from './Skeleton.jsx';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isPending?: boolean;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  id?: string;
}

export function Table<T extends { id?: string | number; symbol?: string }>({
  columns,
  data,
  isPending = false,
  sortKey,
  sortOrder,
  onSort,
  onRowClick,
  id = 'interactive-data-table'
}: TableProps<T>) {

  const handleHeaderClick = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200/90 bg-white shadow-3xs">
      <table id={id} className="min-w-full divide-y divide-gray-200">
        
        {/* Table header */}
        <thead className="bg-gray-50/75">
          <tr>
            {columns.map((col) => {
              const matchesSort = sortKey === col.key;
              const alignClass = 
                col.align === 'right' ? 'text-right justify-end' : 
                col.align === 'center' ? 'text-center justify-center' : 
                'text-left justify-start';

              return (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col)}
                  className={`px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider text-gray-500 ${
                    col.sortable ? 'cursor-pointer select-none hover:bg-gray-100/70' : ''
                  }`}
                >
                  <div className={`flex items-center gap-1.5 ${alignClass}`}>
                    <span>{col.label}</span>
                    {col.sortable && onSort && (
                      <span className="text-gray-400">
                        {matchesSort ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-emerald-600" /> : <ArrowDown className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 hover:text-gray-605" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table body */}
        <tbody className="divide-y divide-gray-100 bg-white">
          {isPending ? (
            Array.from({ length: 8 }).map((_, rIdx) => (
              <TableRowSkeleton key={rIdx} columns={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <p className="font-sans text-sm text-gray-500 font-medium">No results found matching search parameters</p>
                <p className="font-mono text-xs text-gray-400 mt-1">Try resetting your screener search filters</p>
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr
                key={row.id || row.symbol || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer hover:bg-emerald-50/20' : 'hover:bg-gray-50/30'
                }`}
              >
                {columns.map((col) => {
                  const alignClass = 
                    col.align === 'right' ? 'text-right' : 
                    col.align === 'center' ? 'text-center' : 
                    'text-left';

                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 text-sm font-medium text-gray-700 whitespace-nowrap ${alignClass}`}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key] ?? '—'}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>

      </table>
    </div>
  );
}
