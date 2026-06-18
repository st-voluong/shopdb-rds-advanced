export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'ShopDB E-commerce and BI API',
    version: '1.0.0',
    description:
      'Backend API for the shopdb RDS lab. Write operations use the master database pool, while read and analytics endpoints use the replica pool.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Customers' },
    { name: 'Products' },
    { name: 'Orders' },
    { name: 'Analytics' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API health',
        responses: {
          '200': {
            description: 'API is healthy',
          },
        },
      },
    },
    '/api/customers': {
      get: {
        tags: ['Customers'],
        summary: 'List customers',
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Search by first name, last name, email, or phone.',
          },
        ],
        responses: {
          '200': {
            description: 'Paginated customer list',
          },
        },
      },
      post: {
        tags: ['Customers'],
        summary: 'Create a customer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCustomerInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Customer created' },
          '400': { description: 'Invalid input' },
        },
      },
    },
    '/api/customers/{id}': {
      get: {
        tags: ['Customers'],
        summary: 'Get customer by ID',
        parameters: [{ $ref: '#/components/parameters/Id' }],
        responses: {
          '200': { description: 'Customer detail' },
          '404': { description: 'Customer not found' },
        },
      },
      put: {
        tags: ['Customers'],
        summary: 'Update customer',
        parameters: [{ $ref: '#/components/parameters/Id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateCustomerInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Customer updated' },
          '404': { description: 'Customer not found' },
        },
      },
      delete: {
        tags: ['Customers'],
        summary: 'Delete customer',
        parameters: [{ $ref: '#/components/parameters/Id' }],
        responses: {
          '200': { description: 'Customer deleted' },
          '404': { description: 'Customer not found' },
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'List products',
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'minPrice',
            in: 'query',
            schema: { type: 'number' },
          },
          {
            name: 'maxPrice',
            in: 'query',
            schema: { type: 'number' },
          },
          {
            name: 'inStock',
            in: 'query',
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          '200': { description: 'Paginated product list' },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create product',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProductInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Product created' },
          '400': { description: 'Invalid input' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by ID',
        parameters: [{ $ref: '#/components/parameters/Id' }],
        responses: {
          '200': { description: 'Product detail' },
          '404': { description: 'Product not found' },
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Update product',
        parameters: [{ $ref: '#/components/parameters/Id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProductInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Product updated' },
          '404': { description: 'Product not found' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete product',
        parameters: [{ $ref: '#/components/parameters/Id' }],
        responses: {
          '200': { description: 'Product deleted' },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/api/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders with joined customer and product fields',
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          {
            name: 'status',
            in: 'query',
            schema: { $ref: '#/components/schemas/OrderStatus' },
          },
          {
            name: 'customerId',
            in: 'query',
            schema: { type: 'integer' },
          },
          {
            name: 'productId',
            in: 'query',
            schema: { type: 'integer' },
          },
          {
            name: 'fromDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
          {
            name: 'toDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          '200': { description: 'Paginated order list' },
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create order and decrease product stock',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Order created' },
          '400': { description: 'Invalid input or insufficient stock' },
        },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order detail',
        parameters: [{ $ref: '#/components/parameters/Id' }],
        responses: {
          '200': { description: 'Order detail' },
          '404': { description: 'Order not found' },
        },
      },
    },
    '/api/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status',
        parameters: [{ $ref: '#/components/parameters/Id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateOrderStatusInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Order status updated' },
          '400': { description: 'Invalid status' },
          '404': { description: 'Order not found' },
        },
      },
    },
    '/api/analytics/summary': {
      get: {
        tags: ['Analytics'],
        summary: 'Get dashboard summary metrics',
        responses: {
          '200': { description: 'Summary metrics' },
        },
      },
    },
    '/api/analytics/top-orders': {
      get: {
        tags: ['Analytics'],
        summary: 'Top 5 customers by order count',
        responses: { '200': { description: 'Top customers by order count' } },
      },
    },
    '/api/analytics/top-spending': {
      get: {
        tags: ['Analytics'],
        summary: 'Top 5 customers by spending',
        responses: { '200': { description: 'Top customers by spending' } },
      },
    },
    '/api/analytics/top-sold-products': {
      get: {
        tags: ['Analytics'],
        summary: 'Top 5 products by quantity sold',
        responses: { '200': { description: 'Top products by quantity sold' } },
      },
    },
    '/api/analytics/top-revenue': {
      get: {
        tags: ['Analytics'],
        summary: 'Top 5 products by revenue',
        responses: { '200': { description: 'Top products by revenue' } },
      },
    },
    '/api/analytics/orders-by-status': {
      get: {
        tags: ['Analytics'],
        summary: 'Order count grouped by status',
        responses: { '200': { description: 'Orders grouped by status' } },
      },
    },
    '/api/analytics/daily-revenue': {
      get: {
        tags: ['Analytics'],
        summary: 'Daily revenue for the latest 30 order dates',
        responses: { '200': { description: 'Daily revenue rows' } },
      },
    },
  },
  components: {
    parameters: {
      Id: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer', minimum: 1 },
      },
      Page: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      Limit: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
    },
    schemas: {
      OrderStatus: {
        type: 'string',
        enum: [
          'Pending',
          'Payment Received',
          'Processing',
          'Shipped',
          'Delivered',
          'Cancelled',
        ],
      },
      CreateCustomerInput: {
        type: 'object',
        required: ['first_name', 'last_name', 'email'],
        properties: {
          first_name: { type: 'string', example: 'Nguyen' },
          last_name: { type: 'string', example: 'An' },
          email: { type: 'string', example: 'nguyen.an@example.com' },
          phone: { type: 'string', example: '0901234567' },
          address: { type: 'string', example: '123 Le Loi, Da Nang' },
        },
      },
      UpdateCustomerInput: {
        allOf: [{ $ref: '#/components/schemas/CreateCustomerInput' }],
      },
      CreateProductInput: {
        type: 'object',
        required: ['name', 'price', 'stock_quantity'],
        properties: {
          name: { type: 'string', example: 'Laptop Model447' },
          description: {
            type: 'string',
            example: 'High quality electronics item',
          },
          price: { type: 'number', example: 413.42 },
          stock_quantity: { type: 'integer', example: 36 },
        },
      },
      UpdateProductInput: {
        allOf: [{ $ref: '#/components/schemas/CreateProductInput' }],
      },
      CreateOrderInput: {
        type: 'object',
        required: ['customer_id', 'product_id', 'quantity'],
        properties: {
          customer_id: { type: 'integer', example: 1 },
          product_id: { type: 'integer', example: 1 },
          quantity: { type: 'integer', example: 2 },
          total_amount: {
            type: 'number',
            example: 826.84,
            description:
              'Optional. If omitted, the backend calculates price * quantity.',
          },
        },
      },
      UpdateOrderStatusInput: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { $ref: '#/components/schemas/OrderStatus' },
        },
      },
    },
  },
};
