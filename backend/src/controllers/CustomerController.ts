import { Request, Response } from 'express';
import { CustomerService } from '../services/CustomerService';

export class CustomerController {
  constructor(private readonly customerService = new CustomerService()) {}

  getCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.customerService.getCustomers(
        Number(req.query.page),
        Number(req.query.limit),
        req.query.search?.toString(),
      );

      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers',
      });
    }
  };

  getCustomerById = async (req: Request, res: Response): Promise<void> => {
    try {
      const customer = await this.customerService.getCustomerById(
        Number(req.params.id),
      );

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
        return;
      }

      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch customer',
      });
    }
  };

  createCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const customer = await this.customerService.createCustomer(req.body);

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create customer',
      });
    }
  };

  updateCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const updated = await this.customerService.updateCustomer(
        Number(req.params.id),
        req.body,
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update customer',
      });
    }
  };

  deleteCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
      const deleted = await this.customerService.deleteCustomer(
        Number(req.params.id),
      );

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete customer',
      });
    }
  };
}
