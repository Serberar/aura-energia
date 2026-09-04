import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Table } from './Table';

const COLUMNS = [
  { key: 'name', title: 'Nombre', dataIndex: 'name' as const, sortable: true },
  { key: 'age', title: 'Edad', dataIndex: 'age' as const },
  { key: 'city', title: 'Ciudad', dataIndex: 'city' as const },
];

const DATA = [
  { name: 'Carlos', age: 30, city: 'Madrid' },
  { name: 'Ana', age: 25, city: 'Barcelona' },
  { name: 'Luis', age: 35, city: 'Sevilla' },
];

describe('Table', () => {
  // ─── Renderizado básico ────────────────────────────────────────────────────

  it('renders column headers', () => {
    render(<Table columns={COLUMNS} data={DATA} />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Edad')).toBeInTheDocument();
    expect(screen.getByText('Ciudad')).toBeInTheDocument();
  });

  it('renders all data rows', () => {
    render(<Table columns={COLUMNS} data={DATA} />);
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Luis')).toBeInTheDocument();
  });

  // ─── Estado vacío ─────────────────────────────────────────────────────────

  it('shows default empty text when data is empty', () => {
    render(<Table columns={COLUMNS} data={[]} />);
    expect(screen.getByText('No hay datos')).toBeInTheDocument();
  });

  it('shows custom emptyText when data is empty', () => {
    render(<Table columns={COLUMNS} data={[]} emptyText="Sin productos" />);
    expect(screen.getByText('Sin productos')).toBeInTheDocument();
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  it('shows loading spinner when loading=true', () => {
    render(<Table columns={COLUMNS} data={DATA} loading />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('does not render data rows when loading', () => {
    render(<Table columns={COLUMNS} data={DATA} loading />);
    expect(screen.queryByText('Carlos')).not.toBeInTheDocument();
  });

  // ─── onRowClick ───────────────────────────────────────────────────────────

  it('calls onRowClick when a row is clicked', () => {
    const handleRowClick = vi.fn();
    render(<Table columns={COLUMNS} data={DATA} onRowClick={handleRowClick} />);
    fireEvent.click(screen.getByText('Carlos').closest('tr')!);
    expect(handleRowClick).toHaveBeenCalledWith(DATA[0], 0);
  });

  // ─── Ordenamiento ────────────────────────────────────────────────────────

  it('renders sort icon on sortable columns', () => {
    render(<Table columns={COLUMNS} data={DATA} />);
    // "↕" is the unsorted icon shown in the header for the sortable "Nombre" column
    expect(screen.getByText('↕')).toBeInTheDocument();
  });

  it('sorts ascending when sortable header is clicked once', () => {
    render(<Table columns={COLUMNS} data={DATA} />);
    fireEvent.click(screen.getByText('Nombre'));
    // After asc sort: Ana, Carlos, Luis
    const cells = screen.getAllByRole('cell');
    const names = cells.filter((_, i) => i % COLUMNS.length === 0).map((c) => c.textContent);
    expect(names).toEqual(['Ana', 'Carlos', 'Luis']);
  });

  it('sorts descending when sortable header is clicked twice', () => {
    render(<Table columns={COLUMNS} data={DATA} />);
    fireEvent.click(screen.getByText('Nombre')); // asc
    fireEvent.click(screen.getByText('Nombre')); // desc
    const cells = screen.getAllByRole('cell');
    const names = cells.filter((_, i) => i % COLUMNS.length === 0).map((c) => c.textContent);
    expect(names).toEqual(['Luis', 'Carlos', 'Ana']);
  });

  // ─── Render personalizado ─────────────────────────────────────────────────

  it('uses custom render function for cell content', () => {
    const columnsWithRender = [
      ...COLUMNS,
      {
        key: 'actions',
        title: 'Acciones',
        render: (_: any, record: any) => <button>Editar {record.name}</button>,
      },
    ];
    render(<Table columns={columnsWithRender} data={DATA} />);
    expect(screen.getByRole('button', { name: 'Editar Carlos' })).toBeInTheDocument();
  });

  // ─── Selección de filas ───────────────────────────────────────────────────

  it('renders checkboxes when selectable=true', () => {
    render(
      <Table columns={COLUMNS} data={DATA} selectable selectedRows={[]} onSelectionChange={vi.fn()} />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    // 1 "select all" header checkbox + 3 row checkboxes
    expect(checkboxes.length).toBe(4);
  });

  it('calls onSelectionChange when a row checkbox is clicked', () => {
    const handleSelection = vi.fn();
    render(
      <Table columns={COLUMNS} data={DATA} selectable selectedRows={[]} onSelectionChange={handleSelection} />
    );
    // Click the first row checkbox (index 1 because index 0 is "select all")
    const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);
    fireEvent.click(rowCheckboxes[0]);
    expect(handleSelection).toHaveBeenCalledWith([0]);
  });

  it('calls onSelectionChange with empty array when all are already selected and select-all is clicked', () => {
    const handleSelection = vi.fn();
    render(
      <Table
        columns={COLUMNS}
        data={DATA}
        selectable
        selectedRows={[0, 1, 2]}
        onSelectionChange={handleSelection}
      />
    );
    const selectAll = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAll);
    expect(handleSelection).toHaveBeenCalledWith([]);
  });
});
