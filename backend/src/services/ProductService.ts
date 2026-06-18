import {
  CreateProductInput,
  ProductRepository,
  UpdateProductInput,
} from '../repositories/ProductRepository';
import { normalizePagination, toPaginatedResult } from '../types/pagination';

export class ProductService {
  constructor(private readonly productRepository = new ProductRepository()) {}

  async getProducts(options: {
    page?: number;
    limit?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }) {
    const pagination = normalizePagination(options.page, options.limit);
    const query = {
      ...pagination,
      search: options.search,
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      inStock: options.inStock,
    };

    const [items, total] = await Promise.all([
      this.productRepository.findAll(query),
      this.productRepository.count(query),
    ]);

    return toPaginatedResult(items, pagination.page, pagination.limit, total);
  }

  async getProductById(productId: number) {
    this.validateId(productId, 'product_id');
    return this.productRepository.findById(productId);
  }

  async createProduct(input: CreateProductInput) {
    this.validateProductInput(input);
    return this.productRepository.create(input);
  }

  async updateProduct(productId: number, input: UpdateProductInput) {
    this.validateId(productId, 'product_id');

    if (input.price !== undefined && input.price <= 0) {
      throw new Error('price must be greater than 0');
    }

    if (
      input.stock_quantity !== undefined &&
      (!Number.isInteger(input.stock_quantity) || input.stock_quantity < 0)
    ) {
      throw new Error('stock_quantity must be a non-negative integer');
    }

    return this.productRepository.update(productId, input);
  }

  async deleteProduct(productId: number) {
    this.validateId(productId, 'product_id');
    return this.productRepository.delete(productId);
  }

  private validateProductInput(input: CreateProductInput): void {
    if (!input.name?.trim()) {
      throw new Error('name is required');
    }

    if (!Number.isFinite(input.price) || input.price <= 0) {
      throw new Error('price must be greater than 0');
    }

    if (
      !Number.isInteger(input.stock_quantity) ||
      input.stock_quantity < 0
    ) {
      throw new Error('stock_quantity must be a non-negative integer');
    }
  }

  private validateId(id: number, field: string): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`${field} must be a positive integer`);
    }
  }
}
