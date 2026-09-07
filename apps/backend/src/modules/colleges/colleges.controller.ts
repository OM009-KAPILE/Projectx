import { Request, Response, NextFunction } from 'express';
import { prisma } from '@projectx/db';
import { AppError } from '../../middleware/errorHandler';
import {
  CreateUniversityInput,
  UpdateUniversityInput,
  CreateCollegeInput,
  UpdateCollegeInput,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateCourseInput,
  UpdateCourseInput,
} from '@projectx/common';

export class CollegesController {
  // =========================================================================
  // 1. PUBLIC / STUDENT DIRECTORY BROWSING
  // =========================================================================

  public static async listColleges(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, country, universityId } = req.query as {
        search?: string;
        country?: string;
        universityId?: string;
      };

      const where: any = {};
      if (country && country !== 'ALL') where.country = country;
      if (universityId && universityId !== 'ALL') where.universityId = universityId;
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { domain: { contains: search } },
          { city: { contains: search } },
        ];
      }

      const colleges = await prisma.college.findMany({
        where,
        include: {
          university: true,
          _count: {
            select: {
              users: true,
              departments: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: colleges.map((c) => ({
          id: c.id,
          name: c.name,
          domain: c.domain,
          city: c.city,
          country: c.country,
          logoUrl: c.logoUrl,
          universityId: c.universityId,
          universityName: c.university?.name || null,
          departmentsCount: c._count.departments,
          studentsCount: c._count.users,
          createdAt: c.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCollegeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const college = await prisma.college.findUnique({
        where: { id },
        include: {
          university: true,
          departments: {
            include: {
              courses: true,
              _count: { select: { users: true } },
            },
          },
          _count: {
            select: { users: true },
          },
        },
      });

      if (!college) {
        throw new AppError('College not found in the platform directory.', 404);
      }

      return res.status(200).json({
        success: true,
        data: {
          id: college.id,
          name: college.name,
          domain: college.domain,
          city: college.city,
          country: college.country,
          logoUrl: college.logoUrl,
          university: college.university,
          studentsCount: college._count.users,
          departments: college.departments.map((d) => ({
            id: d.id,
            name: d.name,
            code: d.code,
            studentsCount: d._count.users,
            courses: d.courses.map((cr) => ({
              id: cr.id,
              name: cr.name,
              code: cr.code,
              degreeLevel: cr.degreeLevel,
            })),
          })),
          createdAt: college.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listUniversities(req: Request, res: Response, next: NextFunction) {
    try {
      const universities = await prisma.university.findMany({
        include: {
          _count: { select: { colleges: true } },
        },
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: universities.map((u) => ({
          id: u.id,
          name: u.name,
          shortName: u.shortName,
          website: u.website,
          country: u.country,
          logoUrl: u.logoUrl,
          collegesCount: u._count.colleges,
          createdAt: u.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const { collegeId } = req.params;

      const departments = await prisma.department.findMany({
        where: { collegeId },
        include: {
          _count: { select: { courses: true, users: true } },
        },
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: departments.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          collegeId: d.collegeId,
          coursesCount: d._count.courses,
          studentsCount: d._count.users,
          createdAt: d.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId } = req.params;

      const courses = await prisma.course.findMany({
        where: { departmentId },
        include: {
          _count: { select: { users: true } },
        },
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: courses.map((cr) => ({
          id: cr.id,
          name: cr.name,
          code: cr.code,
          degreeLevel: cr.degreeLevel,
          departmentId: cr.departmentId,
          studentsCount: cr._count.users,
          createdAt: cr.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // =========================================================================
  // 2. ADMIN DIRECTORY MANAGEMENT (RBAC Protected)
  // =========================================================================

  // Universities
  public static async createUniversity(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateUniversityInput = req.body;

      const existing = await prisma.university.findUnique({
        where: { name: input.name.trim() },
      });
      if (existing) throw new AppError('University with this name already exists.', 409);

      const university = await prisma.university.create({
        data: {
          name: input.name.trim(),
          shortName: input.shortName || null,
          website: input.website || null,
          country: input.country || 'United States',
          logoUrl: input.logoUrl || null,
        },
      });

      return res.status(201).json({
        success: true,
        message: `University "${university.name}" created successfully.`,
        data: university,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateUniversity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: UpdateUniversityInput = req.body;

      const updated = await prisma.university.update({
        where: { id },
        data: input,
      });

      return res.status(200).json({
        success: true,
        message: 'University details updated.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteUniversity(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.university.delete({ where: { id } });

      return res.status(200).json({
        success: true,
        message: 'University deleted.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Colleges
  public static async createCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateCollegeInput = req.body;

      const existing = await prisma.college.findUnique({
        where: { domain: input.domain.toLowerCase().trim() },
      });
      if (existing) throw new AppError('College domain already exists in the directory.', 409);

      const college = await prisma.college.create({
        data: {
          name: input.name.trim(),
          domain: input.domain.toLowerCase().trim(),
          city: input.city.trim(),
          country: input.country || 'United States',
          logoUrl: input.logoUrl || null,
          universityId: input.universityId || null,
        },
        include: { university: true },
      });

      return res.status(201).json({
        success: true,
        message: `Partner college "${college.name}" registered successfully.`,
        data: college,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: UpdateCollegeInput = req.body;

      const updated = await prisma.college.update({
        where: { id },
        data: {
          name: input.name,
          city: input.city,
          country: input.country,
          logoUrl: input.logoUrl,
          universityId: input.universityId,
        },
        include: { university: true },
      });

      return res.status(200).json({
        success: true,
        message: 'College details updated.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCollege(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const studentCount = await prisma.user.count({ where: { collegeId: id } });
      if (studentCount > 0) {
        throw new AppError(`Cannot delete college with ${studentCount} active enrolled students.`, 400);
      }

      await prisma.college.delete({ where: { id } });

      return res.status(200).json({
        success: true,
        message: 'College removed from directory.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Departments
  public static async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateDepartmentInput = req.body;

      const college = await prisma.college.findUnique({ where: { id: input.collegeId } });
      if (!college) throw new AppError('College not found.', 404);

      const dept = await prisma.department.create({
        data: {
          name: input.name.trim(),
          code: input.code ? input.code.trim().toUpperCase() : null,
          collegeId: input.collegeId,
        },
      });

      return res.status(201).json({
        success: true,
        message: `Department "${dept.name}" created for ${college.name}.`,
        data: dept,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: UpdateDepartmentInput = req.body;

      const updated = await prisma.department.update({
        where: { id },
        data: input,
      });

      return res.status(200).json({
        success: true,
        message: 'Department updated.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.department.delete({ where: { id } });

      return res.status(200).json({
        success: true,
        message: 'Department deleted.',
      });
    } catch (error) {
      next(error);
    }
  }

  // Courses
  public static async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreateCourseInput = req.body;

      const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!dept) throw new AppError('Department not found.', 404);

      const course = await prisma.course.create({
        data: {
          name: input.name.trim(),
          code: input.code ? input.code.trim().toUpperCase() : null,
          degreeLevel: input.degreeLevel || 'UNDERGRADUATE',
          departmentId: input.departmentId,
        },
      });

      return res.status(201).json({
        success: true,
        message: `Course/Program "${course.name}" created.`,
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input: UpdateCourseInput = req.body;

      const updated = await prisma.course.update({
        where: { id },
        data: input,
      });

      return res.status(200).json({
        success: true,
        message: 'Course updated.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.course.delete({ where: { id } });

      return res.status(200).json({
        success: true,
        message: 'Course deleted.',
      });
    } catch (error) {
      next(error);
    }
  }
}
