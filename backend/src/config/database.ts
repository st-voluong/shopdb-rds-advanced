import dotenv from 'dotenv';
import mysql, { Pool, PoolOptions } from 'mysql2/promise';

dotenv.config();

const dbPort = Number(process.env.DB_PORT || 3306);

const createPoolConfig = (host: string | undefined): PoolOptions => ({
  host: host || '127.0.0.1',
  port: dbPort,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shopdb',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const masterPool: Pool = mysql.createPool(
  createPoolConfig(process.env.DB_MASTER_HOST),
);

export const replicaPool: Pool = mysql.createPool(
  createPoolConfig(process.env.DB_REPLICA_HOST),
);

export const testDatabaseConnections = async (): Promise<void> => {
  const masterConnection = await masterPool.getConnection();
  masterConnection.release();

  const replicaConnection = await replicaPool.getConnection();
  replicaConnection.release();
};
