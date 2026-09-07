import { Router } from 'express';
import { MessagesController } from './messages.controller';
import { authenticateToken } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  CreateDirectConversationSchema,
  SendMessageSchema,
  BlockUserSchema,
  ReportUserOrMessageSchema,
} from '@projectx/common';

const router = Router();

// Apply Authentication to all message endpoints
router.use(authenticateToken);

// Conversations
router.get('/conversations', MessagesController.listConversations);
router.post(
  '/direct',
  validate(CreateDirectConversationSchema),
  MessagesController.getOrCreateDirectConversation
);
router.get('/conversations/:conversationId/messages', MessagesController.getConversationMessages);
router.post(
  '/conversations/:conversationId/messages',
  validate(SendMessageSchema),
  MessagesController.sendMessage
);
router.patch('/conversations/:conversationId/read', MessagesController.markConversationAsRead);

// Blocking
router.post('/block', validate(BlockUserSchema), MessagesController.blockUser);
router.post('/unblock', MessagesController.unblockUser);
router.get('/blocked', MessagesController.getBlockedUsers);

// Reporting
router.post(
  '/report',
  validate(ReportUserOrMessageSchema),
  MessagesController.reportUserOrMessage
);

export const messagesRouter = router;
