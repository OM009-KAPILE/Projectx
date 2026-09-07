import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '@projectx/db';

const app = createApp();

describe('SIH Demo Final Project + Application Visibility Integration Flow', () => {
  let omToken: string;
  let omUserId: string;
  let omEmail = 'kapileom27@gmail.com';

  let vivekToken: string;
  let vivekUserId: string;
  let vivekEmail = 'student1@test.com';

  let student2Token: string;
  let student2UserId: string;
  let student2Email = 'student2@test.com';

  let targetProjectId: string;
  let targetRoleId: string;
  let submittedApplicationId: string;

  beforeAll(async () => {
    // 1. Log in Om Kapile (Lead)
    const omLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: omEmail, password: 'Test@123' });

    expect(omLogin.status).toBe(200);
    expect(omLogin.body.success).toBe(true);
    omToken = omLogin.body.data.tokens.accessToken;
    omUserId = omLogin.body.data.user.id;

    // 2. Log in Vivek Jadhav (Applicant)
    const vivekLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: vivekEmail, password: 'Test@123' });

    expect(vivekLogin.status).toBe(200);
    expect(vivekLogin.body.success).toBe(true);
    vivekToken = vivekLogin.body.data.tokens.accessToken;
    vivekUserId = vivekLogin.body.data.user.id;

    // 3. Log in Student 2
    const s2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: student2Email, password: 'Test@123' });

    expect(s2Login.status).toBe(200);
    expect(s2Login.body.success).toBe(true);
    student2Token = s2Login.body.data.tokens.accessToken;
    student2UserId = s2Login.body.data.user.id;
  });

  describe('1. Demo University Name Consistency', () => {
    it('Om Kapile profile shows Sanjivani University', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${omUserId}`)
        .set('Authorization', `Bearer ${omToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Om Kapile');
      expect(res.body.data.college.name).toBe('Sanjivani University');
    });

    it('Vivek Jadhav profile shows Sanjivani University', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${vivekUserId}`)
        .set('Authorization', `Bearer ${vivekToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Vivek Jadhav');
      expect(res.body.data.college.name).toBe('Sanjivani University');
    });

    it('Student 2 profile shows Sanjivani University', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${student2UserId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.college.name).toBe('Sanjivani University');
    });
  });

  describe('2. Project Separation: Explore Projects vs My Projects', () => {
    it('Om Kapile in Explore Projects (GET /api/v1/projects) sees NO projects created by Om Kapile', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${omToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const projects = res.body.data;
      expect(projects.length).toBeGreaterThan(0);

      // Verify ZERO projects owned by Om appear
      const omOwned = projects.filter((p: any) => p.creator.id === omUserId || p.creatorId === omUserId);
      expect(omOwned.length).toBe(0);
    });

    it('Vivek Jadhav in Explore Projects CAN see Om Kapiles open discoverable projects', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${vivekToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const projects = res.body.data;

      // Find an Om Kapile project open for recruitment
      const omProject = projects.find((p: any) => p.creator.name === 'Om Kapile');
      expect(omProject).toBeDefined();
      expect(omProject.creator.college).toBe('Sanjivani University');
      targetProjectId = omProject.id;
    });
  });

  describe('3. Om Kapile ↔ Vivek Jadhav Application Flow & Prioritization', () => {
    it('Vivek Jadhav submits an application to Om Kapiles project -> status is PENDING', async () => {
      // Find an open role on the project
      const projDetails = await prisma.project.findUnique({
        where: { id: targetProjectId },
        include: {
          requiredRoles: true,
        },
      });

      expect(projDetails).toBeDefined();
      expect(projDetails!.requiredRoles.length).toBeGreaterThan(0);
      targetRoleId = projDetails!.requiredRoles[0].id;

      // Clean any existing application from test runs
      await prisma.application.deleteMany({
        where: {
          projectId: targetProjectId,
          applicantId: vivekUserId,
          projectRoleId: targetRoleId,
        },
      });

      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${vivekToken}`)
        .send({
          projectId: targetProjectId,
          projectRoleId: targetRoleId,
          pitch: 'I am a skilled Python backend developer from Sanjivani University excited to contribute.',
          relevantLinks: ['https://github.com/vivekjadhav-dev'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      submittedApplicationId = res.body.data.id;
      expect(submittedApplicationId).toBeDefined();

      // Check DB application
      const appInDb = await prisma.application.findUnique({
        where: { id: submittedApplicationId },
      });
      expect(appInDb).toBeDefined();
      expect(appInDb!.status).toBe('PENDING');

      // Check In-App Notification created for Om Kapile
      const notif = await prisma.notification.findFirst({
        where: {
          userId: omUserId,
          type: 'APPLICATION_RECEIVED',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(notif).toBeDefined();
      expect(notif!.message).toContain('Vivek Jadhav');
    });

    it('Om Kapile checks My Projects (GET /api/v1/projects/user/created) -> Project with new application is at the TOP with pending count', async () => {
      const res = await request(app)
        .get('/api/v1/projects/user/created')
        .set('Authorization', `Bearer ${omToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const myProjects = res.body.data;
      expect(myProjects.length).toBeGreaterThan(0);

      // The top project MUST be the one with the newest pending application
      const topProject = myProjects[0];
      expect(topProject.id).toBe(targetProjectId);
      expect(topProject.pendingApplicationsCount).toBeGreaterThanOrEqual(1);
      expect(topProject.latestPendingApplicationAt).toBeDefined();

      // Check that Vivek application is in the applications list
      const appFound = topProject.applications.find((a: any) => a.id === submittedApplicationId);
      expect(appFound).toBeDefined();
      expect(appFound.status).toBe('PENDING');
      expect(appFound.applicant.name).toBe('Vivek Jadhav');
      expect(appFound.applicant.collegeName).toBe('Sanjivani University');
    });

    it('Om Kapile shortlists Viveks application -> status syncs to SHORTLISTED', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${submittedApplicationId}/review`)
        .set('Authorization', `Bearer ${omToken}`)
        .send({ status: 'SHORTLISTED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify Vivek sees SHORTLISTED in sent applications
      const vivekSent = await request(app)
        .get('/api/v1/applications/sent')
        .set('Authorization', `Bearer ${vivekToken}`);

      expect(vivekSent.status).toBe(200);
      const sentApp = vivekSent.body.data.find((a: any) => a.id === submittedApplicationId);
      expect(sentApp).toBeDefined();
      expect(sentApp.status).toBe('SHORTLISTED');
    });

    it('Om Kapile accepts Viveks application -> status syncs to ACCEPTED and team membership is created', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${submittedApplicationId}/review`)
        .set('Authorization', `Bearer ${omToken}`)
        .send({ status: 'ACCEPTED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify Vivek is now a ProjectMember in DB
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: targetProjectId,
            userId: vivekUserId,
          },
        },
      });
      expect(member).toBeDefined();

      // Verify Vivek can access joined projects list
      const vivekJoined = await request(app)
        .get('/api/v1/projects/user/joined')
        .set('Authorization', `Bearer ${vivekToken}`);

      expect(vivekJoined.status).toBe(200);
      const joinedProj = vivekJoined.body.data.find((p: any) => p.id === targetProjectId);
      expect(joinedProj).toBeDefined();

      // Verify Vivek can access workspace overview
      const wsRes = await request(app)
        .get(`/api/v1/workspace/projects/${targetProjectId}/overview`)
        .set('Authorization', `Bearer ${vivekToken}`);

      expect(wsRes.status).toBe(200);
      expect(wsRes.body.success).toBe(true);
      expect(wsRes.body.data.healthStatus).toBeDefined();
      expect(wsRes.body.data.progressPercentage).toBeDefined();
    });
  });
});
