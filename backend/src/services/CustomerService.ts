import {
  CreateCustomerInput,
  CustomerRepository,
  UpdateCustomerInput,
} from '../repositories/CustomerRepository';
import { normalizePagination, toPaginatedResult } from '../types/pagination';

export class CustomerService {
  constructor(private readonly customerRepository = new CustomerRepository()) {}

  async getCustomers(page?: number, limit?: number, search?: string) {
    const pagination = normalizePagination(page, limit);
    const query = {
      ...pagination,
      search,
    };

    const [items, total] = await Promise.all([
      this.customerRepository.findAll(query),
      this.customerRepository.count(search),
    ]);

    return toPaginatedResult(items, pagination.page, pagination.limit, total);
  }

  async getCustomerById(customerId: number) {
    this.validateId(customerId, 'customer_id');
    return this.customerRepository.findById(customerId);
  }

  async createCustomer(input: CreateCustomerInput) {
    this.validateCustomerInput(input);
    return this.customerRepository.create(input);
  }

  async updateCustomer(customerId: number, input: UpdateCustomerInput) {
    this.validateId(customerId, 'customer_id');
    return this.customerRepository.update(customerId, input);
  }

  async deleteCustomer(customerId: number) {
    this.validateId(customerId, 'customer_id');
    return this.customerRepository.delete(customerId);
  }

  private validateCustomerInput(input: CreateCustomerInput): void {
    if (!input.first_name?.trim()) {
      throw new Error('first_name is required');
    }

    if (!input.last_name?.trim()) {
      throw new Error('last_name is required');
    }

    if (!input.email?.trim()) {
      throw new Error('email is required');
    }
  }

  private validateId(id: number, field: string): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`${field} must be a positive integer`);
    }
  }
}
