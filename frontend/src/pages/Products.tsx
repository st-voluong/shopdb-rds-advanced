import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { FormField, TextAreaField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { api, currencyFormatter, getErrorMessage, numberFormatter } from '../lib/api';
import {
  ApiResponse,
  CreateProductInput,
  PaginatedResult,
  Product,
} from '../types/api';

interface ProductsProps {
  notify: (type: 'success' | 'error', message: string) => void;
}

const emptyProductForm: CreateProductInput = {
  name: '',
  description: '',
  price: 1,
  stock_quantity: 0,
};

export function Products({ notify }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductInput>(emptyProductForm);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      inStock: inStock || undefined,
    }),
    [inStock, maxPrice, minPrice, page, search],
  );

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<PaginatedResult<Product>>>(
        '/api/products',
        { params },
      );
      setProducts(response.data.data.items);
      setTotal(response.data.data.total);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      notify('error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [notify, params]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyProductForm);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: Number(product.price),
      stock_quantity: Number(product.stock_quantity),
    });
    setModalOpen(true);
  };

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.product_id}`, form);
        notify('success', 'Product updated successfully');
      } else {
        await api.post('/api/products', form);
        notify('success', 'Product created successfully');
      }

      setModalOpen(false);
      await loadProducts();
    } catch (error) {
      notify('error', getErrorMessage(error));
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/products/${product.product_id}`);
      notify('success', 'Product deleted successfully');
      await loadProducts();
    } catch (error) {
      notify('error', getErrorMessage(error));
    }
  };

  const quickPurchase = async (product: Product) => {
    try {
      const customerId = Math.floor(Math.random() * 5) + 1;
      await api.post('/api/orders', {
        customer_id: customerId,
        product_id: product.product_id,
        quantity: 1,
      });
      notify('success', `Quick purchase created for ${product.name}`);
      await loadProducts();
    } catch (error) {
      notify('error', getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Product Catalog</h1>
          <p className="mt-1 text-sm text-slate-500">
            Product management and write-traffic simulation for the master pool.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-5 lg:grid-cols-[1fr_140px_140px_150px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search product name or description"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
            />
          </label>
          <input
            value={minPrice}
            onChange={(event) => {
              setPage(1);
              setMinPrice(event.target.value);
            }}
            placeholder="Min price"
            type="number"
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
          />
          <input
            value={maxPrice}
            onChange={(event) => {
              setPage(1);
              setMaxPrice(event.target.value);
            }}
            placeholder="Max price"
            type="number"
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
          />
          <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(event) => {
                setPage(1);
                setInStock(event.target.checked);
              }}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            In Stock Only
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Product</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Price</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Stock</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {products.map((product) => (
                <tr key={product.product_id} className="hover:bg-slate-50/60">
                  <td className="max-w-xl px-5 py-4">
                    <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
                    <p className="truncate text-xs text-slate-500">{product.description}</p>
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-medium text-slate-700">
                    {currencyFormatter.format(Number(product.price))}
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-slate-600">
                    {numberFormatter.format(Number(product.stock_quantity))}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => void quickPurchase(product)} disabled={product.stock_quantity <= 0}>
                        <Zap className="h-4 w-4" />
                        ⚡ Quick Purchase
                      </Button>
                      <Button onClick={() => openEditModal(product)}>
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => void deleteProduct(product)}>
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

        {!loading && products.length === 0 ? (
          <div className="p-5">
            <EmptyState>No products found</EmptyState>
          </div>
        ) : null}

        <Pagination page={page} total={total} totalPages={totalPages} onPageChange={setPage} />
      </section>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={(event) => void submitProduct(event)}>
          <FormField
            label="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <TextAreaField
            label="Description"
            value={form.description || ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
              required
            />
            <FormField
              label="Stock Quantity"
              type="number"
              min="0"
              step="1"
              value={form.stock_quantity}
              onChange={(event) =>
                setForm({ ...form, stock_quantity: Number(event.target.value) })
              }
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
