import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { FormField, TextAreaField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { api, getErrorMessage } from '../lib/api';
import {
  ApiResponse,
  CreateCustomerInput,
  Customer,
  PaginatedResult,
} from '../types/api';

interface CustomersProps {
  notify: (type: 'success' | 'error', message: string) => void;
}

const emptyCustomerForm: CreateCustomerInput = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
};

export function Customers({ notify }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CreateCustomerInput>(emptyCustomerForm);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
    }),
    [page, search],
  );

  const loadCustomers = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<PaginatedResult<Customer>>>(
        '/api/customers',
        { params },
      );
      setCustomers(response.data.data.items);
      setTotal(response.data.data.total);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      notify('error', getErrorMessage(error));
    }
  }, [notify, params]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm(emptyCustomerForm);
    setModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setModalOpen(true);
  };

  const submitCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingCustomer) {
        await api.put(`/api/customers/${editingCustomer.customer_id}`, form);
        notify('success', 'Customer updated successfully');
      } else {
        await api.post('/api/customers', form);
        notify('success', 'Customer created successfully');
      }

      setModalOpen(false);
      await loadCustomers();
    } catch (error) {
      notify('error', getErrorMessage(error));
    }
  };

  const deleteCustomer = async (customer: Customer) => {
    const fullName = `${customer.first_name} ${customer.last_name}`;

    if (!window.confirm(`Delete customer "${fullName}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/customers/${customer.customer_id}`);
      notify('success', 'Customer deleted successfully');
      await loadCustomers();
    } catch (error) {
      notify('error', getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Customer CRM</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search and maintain customer records imported from shopdb.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <label className="relative block max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search name, email, or phone"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Address</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {customers.map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-800">
                      {customer.first_name} {customer.last_name}
                    </p>
                    <p className="text-xs text-slate-500">Customer #{customer.customer_id}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-700">{customer.email}</p>
                    <p className="text-xs text-slate-500">{customer.phone || 'No phone'}</p>
                  </td>
                  <td className="max-w-md px-5 py-4 text-sm text-slate-600">
                    <span className="line-clamp-2">{customer.address || 'No address'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => openEditModal(customer)}>
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => void deleteCustomer(customer)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {customers.length === 0 ? (
          <div className="p-5">
            <EmptyState>No customers found</EmptyState>
          </div>
        ) : null}

        <Pagination page={page} total={total} totalPages={totalPages} onPageChange={setPage} />
      </section>

      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={(event) => void submitCustomer(event)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="First Name"
              value={form.first_name}
              onChange={(event) => setForm({ ...form, first_name: event.target.value })}
              required
            />
            <FormField
              label="Last Name"
              value={form.last_name}
              onChange={(event) => setForm({ ...form, last_name: event.target.value })}
              required
            />
          </div>
          <FormField
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <FormField
            label="Phone"
            value={form.phone || ''}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
          <TextAreaField
            label="Address"
            value={form.address || ''}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
