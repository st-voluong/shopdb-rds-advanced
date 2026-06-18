import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { masterPool, replicaPool } from '../config/database';

export interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: Date;
}

export interface CustomerListQuery {
  page: number;
  limit: number;
  offset: number;
  search?: string;
}

export interface CreateCustomerInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
}

export interface UpdateCustomerInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
}

export class CustomerRepository {
  async findAll(query: CustomerListQuery): Promise<Customer[]> {
    const params: Array<string | number> = [];
    const where = this.buildWhereClause(query.search, params);

    const [rows] = await replicaPool.query<RowDataPacket[]>(
      `
        SELECT customer_id, first_name, last_name, email, phone, address, created_at
        FROM customers
        ${where}
        ORDER BY customer_id ASC
        LIMIT ? OFFSET ?
      `,
      [...params, query.limit, query.offset],
    );

    return rows as Customer[];
  }

  async count(search?: string): Promise<number> {
    const params: Array<string | number> = [];
    const where = this.buildWhereClause(search, params);

    const [rows] = await replicaPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM customers ${where}`,
      params,
    );

    return Number(rows[0]?.total || 0);
  }

  async findById(customerId: number): Promise<Customer | null> {
    const [rows] = await replicaPool.query<RowDataPacket[]>(
      `
        SELECT customer_id, first_name, last_name, email, phone, address, created_at
        FROM customers
        WHERE customer_id = ?
      `,
      [customerId],
    );

    return (rows[0] as Customer | undefined) || null;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const [result] = await masterPool.execute<ResultSetHeader>(
      `
        INSERT INTO customers (first_name, last_name, email, phone, address)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        input.first_name,
        input.last_name,
        input.email,
        input.phone || null,
        input.address || null,
      ],
    );

    return {
      customer_id: result.insertId,
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone || null,
      address: input.address || null,
      created_at: new Date(),
    };
  }

  async update(
    customerId: number,
    input: UpdateCustomerInput,
  ): Promise<boolean> {
    const [result] = await masterPool.execute<ResultSetHeader>(
      `
        UPDATE customers
        SET
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address)
        WHERE customer_id = ?
      `,
      [
        input.first_name ?? null,
        input.last_name ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.address ?? null,
        customerId,
      ],
    );

    return result.affectedRows > 0;
  }

  async delete(customerId: number): Promise<boolean> {
    const [result] = await masterPool.execute<ResultSetHeader>(
      'DELETE FROM customers WHERE customer_id = ?',
      [customerId],
    );

    return result.affectedRows > 0;
  }

  private buildWhereClause(
    search: string | undefined,
    params: Array<string | number>,
  ): string {
    if (!search) {
      return '';
    }

    const keyword = `%${search}%`;
    params.push(keyword, keyword, keyword, keyword);

    return `
      WHERE first_name LIKE ?
        OR last_name LIKE ?
        OR email LIKE ?
        OR phone LIKE ?
    `;
  }
}
