import { Router } from 'express';
import { ApplicationsController } from './applications.controller';
import { authenticateToken } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { SubmitApplicationSchema, ReviewApplicationSchema } from '@projectx/common';

export const applicationsRouter = Router();

applicationsRouter.use(authenticateToken);

applicationsRouter.post('/', validate(SubmitApplicationSchema), ApplicationsController.submitApplication);
applicationsRouter.get('/received', ApplicationsController.listReceived);
applicationsRouter.get('/sent', ApplicationsController.listSent);
applicationsRouter.patch('/:id/review', validate(ReviewApplicationSchema), ApplicationsController.reviewApplication);
applicationsRouter.delete('/:id', ApplicationsController.withdrawApplication);
