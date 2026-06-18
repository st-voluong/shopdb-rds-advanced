import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { masterPool, replicaPool } from '../config/database';

export interface Product {
  product_id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  created_at: Date;
}

export interface ProductListQuery {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface CreateProductInput {
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  price?: number;
  stock_quantity?: number;
}

export class ProductRepository {
  async findAll(query: ProductListQuery): Promise<Product[]> {
    const params: Array<string | number> = [];
    const where = this.buildWhereClause(query, params);

    const [rows] = await replicaPool.query<RowDataPacket[]>(
      `
        SELECT product_id, name, description, price, stock_quantity, created_at
        FROM products
        ${where}
        ORDER BY product_id ASC
        LIMIT ? OFFSET ?
      `,
      [...params, query.limit, query.offset],
    );

    return rows as Product[];
  }

  async count(query: ProductListQuery): Promise<number> {
    const params: Array<string | number> = [];
    const where = this.buildWhereClause(query, params);

    const [rows] = await replicaPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM products ${where}`,
      params,
    );

    return Number(rows[0]?.total || 0);
  }

  async findById(productId: number): Promise<Product | null> {
    const [rows] = await replicaPool.query<RowDataPacket[]>(
      `
        SELECT product_id, name, description, price, stock_quantity, created_at
        FROM products
        WHERE product_id = ?
      `,
      [productId],
    );

    return (rows[0] as Product | undefined) || null;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const [result] = await masterPool.execute<ResultSetHeader>(
      `
        INSERT INTO products (name, description, price, stock_quantity)
        VALUES (?, ?, ?, ?)
      `,
      [
        input.name,
        input.description || null,
        input.price,
        input.stock_quantity,
      ],
    );

    return {
      product_id: result.insertId,
      name: input.name,
      description: input.description || null,
      price: input.price,
      stock_quantity: input.stock_quantity,
      created_at: new Date(),
    };
  }

  async update(productId: number, input: UpdateProductInput): Promise<boolean> {
    const [result] = await masterPool.execute<ResultSetHeader>(
      `
        UPDATE products
        SET
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          stock_quantity = COALESCE(?, stock_quantity)
        WHERE product_id = ?
      `,
      [
        input.name ?? null,
        input.description ?? null,
        input.price ?? null,
        input.stock_quantity ?? null,
        productId,
      ],
    );

    return result.affectedRows > 0;
  }

  async delete(productId: number): Promise<boolean> {
    const [result] = await masterPool.execute<ResultSetHeader>(
      'DELETE FROM products WHERE product_id = ?',
      [productId],
    );

    return result.affectedRows > 0;
  }

  private buildWhereClause(
    query: ProductListQuery,
    params: Array<string | number>,
  ): string {
    const filters: string[] = [];

    if (query.search) {
      const keyword = `%${query.search}%`;
      filters.push('(name LIKE ? OR description LIKE ?)');
      params.push(keyword, keyword);
    }

    if (Number.isFinite(query.minPrice)) {
      filters.push('price >= ?');
      params.push(Number(query.minPrice));
    }

    if (Number.isFinite(query.maxPrice)) {
      filters.push('price <= ?');
      params.push(Number(query.maxPrice));
    }

    if (query.inStock) {
      filters.push('stock_quantity > 0');
    }

    return filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  }
}
