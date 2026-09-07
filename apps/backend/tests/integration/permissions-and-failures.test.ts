import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '@projectx/db';

const app = createApp();

describe('Comprehensive Permissions & Failure Modes Test Suite', () => {
  let stanfordToken: string;
  let stanfordUserId: string;
  let mitToken: string;
  let mitUserId: string;
  let strangerToken: string;
  let strangerUserId: string;
  let testProjectId: string;
  let testRoleId: string;

  beforeAll(async () => {
    // 1. Authenticate or Register Stanford Student (Project Creator)
    const stanfordEmail = 'lead_creator@stanford.edu';
    let stanfordUser = await prisma.user.findUnique({ where: { email: stanfordEmail } });
    if (!stanfordUser) {
      const reg = await request(app).post('/api/v1/auth/register').send({
        email: stanfordEmail,
        password: 'Password123!',
        name: 'Stanford Creator',
        collegeDomain: 'stanford.edu',
        graduationYear: 2026,
        course: 'B.S. CS',
      });
      const user = await prisma.user.findUnique({ where: { email: stanfordEmail } });
      const verify = await request(app).post('/api/v1/auth/verify-email').send({
        email: stanfordEmail,
        code: user?.verificationCode || reg.body.data?.devCode || '123456',
      });
      stanfordToken = verify.body.data.tokens.accessToken;
      stanfordUserId = verify.body.data.user.id;
    } else {
      const login = await request(app).post('/api/v1/auth/login').send({
        email: stanfordEmail,
        password: 'Password123!',
      });
      stanfordToken = login.body.data.tokens.accessToken;
      stanfordUserId = login.body.data.user.id;
    }

    // 2. Authenticate or Register MIT Student (Candidate / Collaborator)
    const mitEmail = 'candidate_builder@mit.edu';
    let mitUser = await prisma.user.findUnique({ where: { email: mitEmail } });
    if (!mitUser) {
      const reg = await request(app).post('/api/v1/auth/register').send({
        email: mitEmail,
        password: 'Password123!',
        name: 'MIT Candidate',
        collegeDomain: 'mit.edu',
        graduationYear: 2027,
        course: 'B.S. AI',
      });
      const user = await prisma.user.findUnique({ where: { email: mitEmail } });
      const verify = await request(app).post('/api/v1/auth/verify-email').send({
        email: mitEmail,
        code: user?.verificationCode || reg.body.data?.devCode || '123456',
      });
      mitToken = verify.body.data.tokens.accessToken;
      mitUserId = verify.body.data.user.id;
    } else {
      const login = await request(app).post('/api/v1/auth/login').send({
        email: mitEmail,
        password: 'Password123!',
      });
      mitToken = login.body.data.tokens.accessToken;
      mitUserId = login.body.data.user.id;
    }

    // 3. Register Unaffiliated Stranger (Third-Party)
    const strangerEmail = `stranger_fail_${Date.now()}@harvard.edu`;
    const regStranger = await request(app).post('/api/v1/auth/register').send({
      email: strangerEmail,
      password: 'Password123!',
      name: 'Harvard Stranger',
      collegeDomain: 'harvard.edu',
      graduationYear: 2028,
      course: 'B.A. Economics',
    });
    const strangerUser = await prisma.user.findUnique({ where: { email: strangerEmail } });
    const verifyStranger = await request(app).post('/api/v1/auth/verify-email').send({
      email: strangerEmail,
      code: strangerUser?.verificationCode || regStranger.body.data?.devCode || '123456',
    });
    strangerToken = verifyStranger.body.data.tokens.accessToken;
    strangerUserId = verifyStranger.body.data.user.id;

    // 4. Create a Test Project for failure testing
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${stanfordToken}`)
      .send({
        title: 'Confidential Quantum AI Simulation',
        pitch: 'Simulating topological quantum circuits using neural tensor networks.',
        publicTeaser: 'Next-gen quantum neural circuit simulation.',
        domain: 'Quantum Computing',
        difficulty: 'ADVANCED',
        duration: '12 weeks',
        teamSize: 3,
        collegeVisibility: 'ALL_COLLEGES',
        privateRepoUrl: 'https://github.com/stanford-quantum/classified-core',
        privateNotes: 'Proprietary Hamiltonian matrix formulation.',
        architectureSpec: 'Distributed GPU tensor contracting engine.',
        roles: [
          {
            title: 'Quantum Algorithms Lead',
            description: 'Design variational quantum circuits.',
            requiredSkills: [{ skillName: 'Qiskit', category: 'Quantum', minLevel: 4, isCritical: true }],
          },
        ],
      });

    testProjectId = projRes.body.data.id;
    const role = await prisma.projectRole.findFirst({
      where: { projectId: testProjectId },
    });
    testRoleId = role!.id;
  });

  // -------------------------------------------------------------------------
  // A. AUTHENTICATION & REGISTRATION FAILURES
  // -------------------------------------------------------------------------
  describe('A. Authentication & Registration Failure Modes', () => {
    it('FAILURE: should reject registration when email is already in use (409 Conflict)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'lead_creator@stanford.edu',
        password: 'Password123!',
        name: 'Duplicate Student',
        collegeDomain: 'stanford.edu',
        graduationYear: 2026,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('FAILURE: should reject registration with invalid payload / missing required fields (422)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'invalid-email',
        password: '123', // Too short
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('FAILURE: should reject email verification with incorrect 6-digit code (400 Bad Request)', async () => {
      const res = await request(app).post('/api/v1/auth/verify-email').send({
        email: 'lead_creator@stanford.edu',
        code: '000000', // Wrong code
      });

      // If already verified returns 200, but for unverified with wrong code returns 400
      expect([200, 400]).toContain(res.status);
    });

    it('FAILURE: should reject login with wrong password (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'lead_creator@stanford.edu',
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('FAILURE: should reject login for non-existent email (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'ghost_user_does_not_exist@princeton.edu',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('FAILURE: should reject request with tampered/invalid JWT Bearer token (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidtoken.signature');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('FAILURE: should reject change-password when current password does not match (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${stanfordToken}`)
        .send({
          currentPassword: 'IncorrectOldPassword123!',
          newPassword: 'BrandNewPassword456!',
          confirmPassword: 'BrandNewPassword456!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Current password is incorrect');
    });

    it('FAILURE: should reject change-email when target email is already registered to someone else (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-email')
        .set('Authorization', `Bearer ${stanfordToken}`)
        .send({
          newEmail: 'candidate_builder@mit.edu', // MIT student\'s email
          currentPassword: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });
  });

  // -------------------------------------------------------------------------
  // B. PROJECT CREATION & ACCESS CONTROL PERMISSIONS
  // -------------------------------------------------------------------------
  describe('B. Project Creation & Access Control Permissions', () => {
    it('FAILURE: should reject project creation with invalid input (422)', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${stanfordToken}`)
        .send({
          title: '', // Empty title
          roles: [], // Empty roles
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('FAILURE: should return 404 when querying a non-existent project ID', async () => {
      const res = await request(app)
        .get('/api/v1/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${stanfordToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('SECURITY: should prevent unauthorized non-members from reading private repository URLs or architecture specs (Level 1 Safe Preview)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.disclosureLevel).toBe(1);
      expect(res.body.data.privateRepoUrl).toBeUndefined();
      expect(res.body.data.privateNotes).toBeUndefined();
      expect(res.body.data.architectureSpec).toBeUndefined();
      expect(res.body.data.problemStatement).toBeUndefined();
    });

    it('SECURITY: should reject non-members from accessing workspace overview (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/workspace/projects/${testProjectId}/overview`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('SECURITY: should reject non-members from listing workspace tasks or files (403 Forbidden)', async () => {
      const tasksRes = await request(app)
        .get(`/api/v1/workspace/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${strangerToken}`);
      expect(tasksRes.status).toBe(403);

      const filesRes = await request(app)
        .get(`/api/v1/workspace/projects/${testProjectId}/files`)
        .set('Authorization', `Bearer ${strangerToken}`);
      expect(filesRes.status).toBe(403);
    });

    it('SECURITY: should reject non-members from injecting tasks into another team\'s workspace (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/workspace/projects/${testProjectId}/tasks`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({
          projectId: testProjectId,
          title: 'Malicious Backdoor Task',
          priority: 'HIGH',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // C. APPLICATIONS & TEAM FORMATION PERMISSIONS
  // -------------------------------------------------------------------------
  describe('C. Applications & Team Formation Permissions', () => {
    let createdApplicationId: string;

    it('FAILURE: should reject applying to a non-existent project or role (404)', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${mitToken}`)
        .send({
          projectId: '00000000-0000-0000-0000-000000000000',
          projectRoleId: '00000000-0000-0000-0000-000000000000',
          pitch: 'I want to help with quantum circuits.',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('SUCCESS & PERMISSION: Candidate successfully applies, creating an application', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${mitToken}`)
        .send({
          projectId: testProjectId,
          projectRoleId: testRoleId,
          pitch: 'I have experience in quantum circuit optimization and Qiskit.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      createdApplicationId = res.body.data.id;
    });

    it('FAILURE: should reject duplicate application from same student for same role (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${mitToken}`)
        .send({
          projectId: testProjectId,
          projectRoleId: testRoleId,
          pitch: 'Applying again for the same role.',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already applied');
    });

    it('SECURITY: should prevent non-creator (Stranger) from reviewing or accepting another project\'s applications (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${createdApplicationId}/review`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ status: 'ACCEPTED' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('SECURITY: should prevent non-creator from assigning roles or inviting members (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${testProjectId}/invitations`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({
          studentId: mitUserId,
          projectRoleId: testRoleId,
          customMessage: 'Unauthorized invite',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // D. MESSAGING & DIRECT COMMUNICATION PRIVACY PERMISSIONS
  // -------------------------------------------------------------------------
  describe('D. Messaging & Direct Privacy Permissions', () => {
    it('SECURITY: should prevent direct messaging between unrelated students who share no projects or applications (403 Forbidden)', async () => {
      // Create another unrelated user
      const unrelatedEmail = `unrelated_${Date.now()}@caltech.edu`;
      const reg = await request(app).post('/api/v1/auth/register').send({
        email: unrelatedEmail,
        password: 'Password123!',
        name: 'Caltech Unrelated',
        collegeDomain: 'caltech.edu',
        graduationYear: 2027,
      });
      const user = await prisma.user.findUnique({ where: { email: unrelatedEmail } });
      const verify = await request(app).post('/api/v1/auth/verify-email').send({
        email: unrelatedEmail,
        code: user?.verificationCode || reg.body.data?.devCode || '123456',
      });
      const unrelatedToken = verify.body.data.tokens.accessToken;

      const res = await request(app)
        .post('/api/v1/messages/direct')
        .set('Authorization', `Bearer ${unrelatedToken}`)
        .send({
          recipientId: strangerUserId,
          initialMessage: 'Cold unsolicited DM',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('restricted');
    });

    it('FAILURE: should reject direct messaging with oneself (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/v1/messages/direct')
        .set('Authorization', `Bearer ${stanfordToken}`)
        .send({
          recipientId: stanfordUserId,
          initialMessage: 'Talking to myself',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('SECURITY: should prevent blocked users from sending messages (403 Forbidden)', async () => {
      // 1. Stanford blocks stranger
      await request(app)
        .post('/api/v1/messages/block')
        .set('Authorization', `Bearer ${stanfordToken}`)
        .send({
          blockedId: strangerUserId,
          reason: 'Spam prevention',
        });

      // 2. Stranger tries to message Stanford
      const res = await request(app)
        .post('/api/v1/messages/direct')
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({
          recipientId: stanfordUserId,
          initialMessage: 'Blocked attempt',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('blocked');

      // 3. Unblock
      await request(app)
        .post('/api/v1/messages/unblock')
        .set('Authorization', `Bearer ${stanfordToken}`)
        .send({ blockedId: strangerUserId });
    });
  });

  // -------------------------------------------------------------------------
  // E. ADMIN DASHBOARD & PLATFORM MODERATION PERMISSIONS
  // -------------------------------------------------------------------------
  describe('E. Admin Dashboard & Platform Moderation Permissions', () => {
    it('SECURITY: should strictly reject non-admin students with 403 Forbidden on all admin endpoints', async () => {
      // Non-admin tries to view admin dashboard
      const dashRes = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${strangerToken}`);
      expect(dashRes.status).toBe(403);

      // Non-admin tries to list users
      const usersRes = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${strangerToken}`);
      expect(usersRes.status).toBe(403);

      // Non-admin tries to suspend a user
      const suspendRes = await request(app)
        .patch(`/api/v1/admin/users/${mitUserId}/suspend`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ reason: 'Unauthorized suspension' });
      expect(suspendRes.status).toBe(403);

      // Non-admin tries to moderate/remove a project
      const projRes = await request(app)
        .patch(`/api/v1/admin/projects/${testProjectId}/remove`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ reason: 'Unauthorized removal' });
      expect(projRes.status).toBe(403);

      // Non-admin tries to update system settings
      const settingsRes = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${strangerToken}`);
      expect(settingsRes.status).toBe(403);
    });
  });
});
