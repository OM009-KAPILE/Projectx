import { Router } from 'express';
import { CollegesController } from './colleges.controller';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  CreateUniversitySchema,
  UpdateUniversitySchema,
  CreateCollegeSchema,
  UpdateCollegeSchema,
  CreateDepartmentSchema,
  UpdateDepartmentSchema,
  CreateCourseSchema,
  UpdateCourseSchema,
} from '@projectx/common';

export const collegesRouter = Router();

// =========================================================================
// 1. PUBLIC / STUDENT DIRECTORY BROWSING
// =========================================================================
collegesRouter.get('/', CollegesController.listColleges);
collegesRouter.get('/meta/universities', CollegesController.listUniversities);
collegesRouter.get('/:id', CollegesController.getCollegeById);
collegesRouter.get('/:collegeId/departments', CollegesController.listDepartments);
collegesRouter.get('/departments/:departmentId/courses', CollegesController.listCourses);

// =========================================================================
// 2. ADMIN DIRECTORY GOVERNANCE (RBAC Guarded)
// =========================================================================

// Universities
collegesRouter.post(
  '/admin/universities',
  authenticateToken,
  requireRole(['ADMIN']),
  validate(CreateUniversitySchema),
  CollegesController.createUniversity
);
collegesRouter.patch(
  '/admin/universities/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  validate(UpdateUniversitySchema),
  CollegesController.updateUniversity
);
collegesRouter.delete(
  '/admin/universities/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  CollegesController.deleteUniversity
);

// Colleges
collegesRouter.post(
  '/admin/colleges',
  authenticateToken,
  requireRole(['ADMIN']),
  validate(CreateCollegeSchema),
  CollegesController.createCollege
);
collegesRouter.patch(
  '/admin/colleges/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  validate(UpdateCollegeSchema),
  CollegesController.updateCollege
);
collegesRouter.delete(
  '/admin/colleges/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  CollegesController.deleteCollege
);

// Departments
collegesRouter.post(
  '/admin/departments',
  authenticateToken,
  requireRole(['ADMIN']),
  validate(CreateDepartmentSchema),
  CollegesController.createDepartment
);
collegesRouter.patch(
  '/admin/departments/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  validate(UpdateDepartmentSchema),
  CollegesController.updateDepartment
);
collegesRouter.delete(
  '/admin/departments/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  CollegesController.deleteDepartment
);

// Courses
collegesRouter.post(
  '/admin/courses',
  authenticateToken,
  requireRole(['ADMIN']),
  validate(CreateCourseSchema),
  CollegesController.createCourse
);
collegesRouter.patch(
  '/admin/courses/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  validate(UpdateCourseSchema),
  CollegesController.updateCourse
);
collegesRouter.delete(
  '/admin/courses/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  CollegesController.deleteCourse
);
