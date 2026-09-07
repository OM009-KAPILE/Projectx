import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '@projectx/db';

const app = createApp();

describe('ProjectX Application Status Synchronization Flow (SIH Demo)', () => {
  let vivekToken: string;
  let vivekId: string;
  let omToken: string;
  let omId: string;
  let strangerToken: string;

  let demoProject: any;
  let pythonRole: any;
  let uiuxRole: any;

  beforeAll(async () => {
    // 1. Authenticate Vivek Jadhav (Applicant / student1@test.com)
    const vivekAuth = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@test.com', password: 'Test@123' });

    expect(vivekAuth.status).toBe(200);
    vivekToken = vivekAuth.body.data.tokens.accessToken;
    vivekId = vivekAuth.body.data.user.id;

    // 2. Authenticate Om Kapile (Lead / lead@test.com or kapileom27@gmail.com)
    const omAuth = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kapileom27@gmail.com', password: 'Test@123' });

    expect(omAuth.status).toBe(200);
    omToken = omAuth.body.data.tokens.accessToken;
    omId = omAuth.body.data.user.id;

    // 3. Authenticate Stranger (student2@test.com)
    const strangerAuth = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student2@test.com', password: 'Test@123' });

    expect(strangerAuth.status).toBe(200);
    strangerToken = strangerAuth.body.data.tokens.accessToken;

    // 4. Find Om Kapile's project
    demoProject = await prisma.project.findFirst({
      where: { creatorId: omId, title: 'AI Student Assistant' },
      include: { requiredRoles: true },
    });

    expect(demoProject).toBeDefined();

    pythonRole = demoProject.requiredRoles.find((r: any) => r.title === 'Python Developer');
    uiuxRole = demoProject.requiredRoles.find((r: any) => r.title === 'UI/UX Designer');
    expect(pythonRole).toBeDefined();
    expect(uiuxRole).toBeDefined();

    // Clean previous applications & memberships between Vivek and this project for clean test isolation
    await prisma.application.deleteMany({
      where: { projectId: demoProject.id, applicantId: vivekId },
    });
    await prisma.projectMember.deleteMany({
      where: { projectId: demoProject.id, userId: vivekId },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let applicationId: string;

  test('Step 1-3: Applicant submits application -> Status is PENDING -> Applicant sees Pending', async () => {
    // Vivek applies for Python Developer
    const submitRes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${vivekToken}`)
      .send({
        projectId: demoProject.id,
        projectRoleId: pythonRole.id,
        roleName: 'Python Developer',
        pitch: 'Hi Om! I have 2 years of Python and FastAPI experience and want to build the AI microservices.',
        availabilityHours: 15,
        relevantSkills: ['Python', 'FastAPI'],
        relevantLinks: ['https://github.com/vivekjadhav-dev'],
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.success).toBe(true);
    applicationId = submitRes.body.data.id;
    expect(applicationId).toBeDefined();

    // Verify in DB directly
    const dbApp = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    expect(dbApp?.status).toBe('PENDING');

    // Verify Applicant sees "PENDING" in /applications/sent
    const applicantSentRes = await request(app)
      .get('/api/v1/applications/sent')
      .set('Authorization', `Bearer ${vivekToken}`);

    expect(applicantSentRes.status).toBe(200);
    const myApp = applicantSentRes.body.data.find((a: any) => a.id === applicationId);
    expect(myApp).toBeDefined();
    expect(myApp.status).toBe('PENDING');
  });

  test('Step 4-6: Lead checks received applications -> Sees Vivek as PENDING', async () => {
    const leadReceivedRes = await request(app)
      .get('/api/v1/applications/received')
      .set('Authorization', `Bearer ${omToken}`);

    expect(leadReceivedRes.status).toBe(200);
    const leadApp = leadReceivedRes.body.data.find((a: any) => a.id === applicationId);
    expect(leadApp).toBeDefined();
    expect(leadApp.status).toBe('PENDING');
    expect(leadApp.applicant.name).toBe('Vivek Jadhav');
    expect(leadApp.roleName).toBe('Python Developer');
  });

  test('Step 7-10: Lead clicks Shortlist -> DB status becomes SHORTLISTED -> Applicant sees Shortlisted', async () => {
    // Lead shortlists application
    const shortlistRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/review`)
      .set('Authorization', `Bearer ${omToken}`)
      .send({ status: 'SHORTLISTED', feedback: 'Great profile, shortlisted for round 2.' });

    expect(shortlistRes.status).toBe(200);
    expect(shortlistRes.body.data.status).toBe('SHORTLISTED');

    // Verify in DB directly
    const dbApp = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    expect(dbApp?.status).toBe('SHORTLISTED');

    // Verify Lead received list shows SHORTLISTED
    const leadReceivedRes = await request(app)
      .get('/api/v1/applications/received')
      .set('Authorization', `Bearer ${omToken}`);
    const leadApp = leadReceivedRes.body.data.find((a: any) => a.id === applicationId);
    expect(leadApp.status).toBe('SHORTLISTED');

    // Verify Applicant sees "SHORTLISTED" in /applications/sent
    const applicantSentRes = await request(app)
      .get('/api/v1/applications/sent')
      .set('Authorization', `Bearer ${vivekToken}`);
    const myApp = applicantSentRes.body.data.find((a: any) => a.id === applicationId);
    expect(myApp.status).toBe('SHORTLISTED');
  });

  test('Step 11-17: Lead clicks Accept -> DB status becomes ACCEPTED -> Applicant sees Accepted & Team Formation succeeds', async () => {
    // Lead accepts application
    const acceptRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/review`)
      .set('Authorization', `Bearer ${omToken}`)
      .send({ status: 'ACCEPTED', feedback: 'Welcome to the team, Vivek!' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('ACCEPTED');

    // Verify in DB directly
    const dbApp = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    expect(dbApp?.status).toBe('ACCEPTED');

    // Verify Lead sees ACCEPTED
    const leadReceivedRes = await request(app)
      .get('/api/v1/applications/received')
      .set('Authorization', `Bearer ${omToken}`);
    const leadApp = leadReceivedRes.body.data.find((a: any) => a.id === applicationId);
    expect(leadApp.status).toBe('ACCEPTED');

    // Verify Applicant sees "ACCEPTED" in /applications/sent
    const applicantSentRes = await request(app)
      .get('/api/v1/applications/sent')
      .set('Authorization', `Bearer ${vivekToken}`);
    const myApp = applicantSentRes.body.data.find((a: any) => a.id === applicationId);
    expect(myApp.status).toBe('ACCEPTED');

    // Verify Team Formation: Vivek is now a ProjectMember in the database
    const memberRecord = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: demoProject.id,
          userId: vivekId,
        },
      },
    });
    expect(memberRecord).toBeDefined();
    expect(memberRecord?.roleTitle).toBe('Python Developer');

    // Verify Workspace Access unlocked for Vivek
    const workspaceRes = await request(app)
      .get(`/api/v1/workspace/projects/${demoProject.id}/overview`)
      .set('Authorization', `Bearer ${vivekToken}`);
    expect(workspaceRes.status).toBe(200);
    expect(workspaceRes.body.success).toBe(true);
  });

  test('Step 18-19: Rejection flow -> Applicant applies for second role -> Lead clicks Reject -> DB status becomes REJECTED -> Applicant sees Rejected', async () => {
    // Vivek applies for UI/UX Designer role
    const submitRes2 = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${vivekToken}`)
      .send({
        projectId: demoProject.id,
        projectRoleId: uiuxRole.id,
        roleName: 'UI/UX Designer',
        pitch: 'Applying for UI/UX designer role to test decision flow.',
        availabilityHours: 10,
        relevantSkills: ['UI/UX Design & Figma'],
      });

    expect(submitRes2.status).toBe(201);
    const app2Id = submitRes2.body.data.id;

    // Lead rejects application 2
    const rejectRes = await request(app)
      .patch(`/api/v1/applications/${app2Id}/review`)
      .set('Authorization', `Bearer ${omToken}`)
      .send({ status: 'REJECTED', feedback: 'Position filled by another applicant.' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('REJECTED');

    // Verify in DB directly
    const dbApp2 = await prisma.application.findUnique({
      where: { id: app2Id },
    });
    expect(dbApp2?.status).toBe('REJECTED');

    // Verify Applicant sees "REJECTED" in /applications/sent
    const applicantSentRes = await request(app)
      .get('/api/v1/applications/sent')
      .set('Authorization', `Bearer ${vivekToken}`);
    const myApp2 = applicantSentRes.body.data.find((a: any) => a.id === app2Id);
    expect(myApp2.status).toBe('REJECTED');
  });

  test('Security & Authorization: Non-creator cannot review, and applicant cannot self-review', async () => {
    // 1. Applicant (Vivek) attempts to self-review
    const selfReviewRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/review`)
      .set('Authorization', `Bearer ${vivekToken}`)
      .send({ status: 'ACCEPTED' });

    expect(selfReviewRes.status).toBe(403);

    // 2. Stranger (Student 2) attempts to review Om's project application
    const strangerReviewRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/review`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({ status: 'ACCEPTED' });

    expect(strangerReviewRes.status).toBe(403);
  });
});
