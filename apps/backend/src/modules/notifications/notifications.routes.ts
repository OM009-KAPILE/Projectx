import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticateToken } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  UpdateNotificationPreferencesSchema,
  RegisterDeviceTokenSchema,
} from '@projectx/common';

const router = Router();

router.use(authenticateToken);

// Notifications Feed
router.get('/', NotificationsController.listNotifications);
router.patch('/read-all', NotificationsController.markAllNotificationsRead);
router.patch('/:id/read', NotificationsController.markNotificationRead);

// Preferences (Settings)
router.get('/preferences', NotificationsController.getPreferences);
router.patch(
  '/preferences',
  validate(UpdateNotificationPreferencesSchema),
  NotificationsController.updatePreferences
);

// Mobile Push Device Registration
router.post(
  '/devices',
  validate(RegisterDeviceTokenSchema),
  NotificationsController.registerDeviceToken
);
router.delete('/devices/:token', NotificationsController.unregisterDeviceToken);

// Verification Testing Dispatch
router.post('/test-dispatch', NotificationsController.testDispatch);

export const notificationsRouter = router;
