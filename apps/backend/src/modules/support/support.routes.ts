import { Router } from 'express';
import { SupportController } from './support.controller';
import { authenticateToken, optionalAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { CreateSupportTicketSchema, UpdateSupportTicketAdminSchema } from '@projectx/common';

export const supportRouter = Router();

// Public & Student Endpoints
supportRouter.get('/faqs', SupportController.getFaqs);
supportRouter.post('/tickets', optionalAuth, validate(CreateSupportTicketSchema), SupportController.createTicket);
supportRouter.get('/my-tickets', authenticateToken, SupportController.listMyTickets);

// Admin / Support Staff Ticket Management
supportRouter.get('/admin/tickets', authenticateToken, SupportController.listAllTickets);
supportRouter.get('/admin/tickets/:id', authenticateToken, SupportController.getTicketById);
supportRouter.patch('/admin/tickets/:id', authenticateToken, validate(UpdateSupportTicketAdminSchema), SupportController.updateTicketAdmin);
supportRouter.post('/admin/tickets/:id/close', authenticateToken, SupportController.closeTicket);
