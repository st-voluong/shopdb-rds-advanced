import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';

export class ProductController {
  constructor(private readonly productService = new ProductService()) {}

  getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.productService.getProducts({
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        search: req.query.search?.toString(),
        minPrice:
          req.query.minPrice !== undefined
            ? Number(req.query.minPrice)
            : undefined,
        maxPrice:
          req.query.maxPrice !== undefined
            ? Number(req.query.maxPrice)
            : undefined,
        inStock: req.query.inStock === 'true',
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
      });
    }
  };

  getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
      const product = await this.productService.getProductById(
        Number(req.params.id),
      );

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({ success: true, data: product });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch product',
      });
    }
  };

  createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const product = await this.productService.createProduct({
        name: req.body.name,
        description: req.body.description,
        price: Number(req.body.price),
        stock_quantity: Number(req.body.stock_quantity),
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create product',
      });
    }
  };

  updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const updated = await this.productService.updateProduct(
        Number(req.params.id),
        {
          name: req.body.name,
          description: req.body.description,
          price:
            req.body.price !== undefined ? Number(req.body.price) : undefined,
          stock_quantity:
            req.body.stock_quantity !== undefined
              ? Number(req.body.stock_quantity)
              : undefined,
        },
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update product',
      });
    }
  };

  deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await this.productService.deleteProduct(
        Number(req.params.id),
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete product',
      });
    }
  };
}
