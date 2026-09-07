import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '@projectx/db';

const app = createApp();

describe('ProjectX Demo Accounts & Role Applications Integration Flow', () => {
  let leadToken: string;
  let leadUserId: string;
  let student1Token: string;
  let student1UserId: string;
  let student2Token: string;
  let student2UserId: string;

  let projectId: string;
  let uiuxRoleId: string;
  let pythonRoleId: string;
  let htmlRoleId: string;

  beforeAll(async () => {
    // 1. Authenticate Lead (lead@test.com / Test@123)
    const leadRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lead@test.com', password: 'Test@123' });

    expect(leadRes.status).toBe(200);
    expect(leadRes.body.success).toBe(true);
    leadToken = leadRes.body.data.tokens.accessToken;
    leadUserId = leadRes.body.data.user.id;
    expect(leadRes.body.data.user.email).toBe('kapileom27@gmail.com');

    // 2. Authenticate Student 1 (student1@test.com / Test@123)
    const s1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@test.com', password: 'Test@123' });

    expect(s1Res.status).toBe(200);
    expect(s1Res.body.success).toBe(true);
    student1Token = s1Res.body.data.tokens.accessToken;
    student1UserId = s1Res.body.data.user.id;
    expect(s1Res.body.data.user.email).toBe('student1@test.com');

    // 3. Authenticate Student 2 (student2@test.com / Test@123)
    const s2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student2@test.com', password: 'Test@123' });

    expect(s2Res.status).toBe(200);
    expect(s2Res.body.success).toBe(true);
    student2Token = s2Res.body.data.tokens.accessToken;
    student2UserId = s2Res.body.data.user.id;
    expect(s2Res.body.data.user.email).toBe('student2@test.com');

    // 4. Find AI Student Assistant Project and clean any prior applications for clean test isolation
    const project = await prisma.project.findFirst({
      where: { title: 'AI Student Assistant' },
      include: { requiredRoles: true },
    });
    expect(project).toBeDefined();
    projectId = project!.id;

    const uiux = project!.requiredRoles.find((r) => r.title === 'UI/UX Designer');
    const python = project!.requiredRoles.find((r) => r.title === 'Python Developer');
    const html = project!.requiredRoles.find((r) => r.title === 'HTML Developer');

    expect(uiux).toBeDefined();
    expect(python).toBeDefined();
    expect(html).toBeDefined();

    uiuxRoleId = uiux!.id;
    pythonRoleId = python!.id;
    htmlRoleId = html!.id;

    // Reset applications for this project
    await prisma.application.deleteMany({
      where: { projectId },
    });
  });

  it('Step 1: Lead views AI Student Assistant project - initially 0/1, 0/2, 0/1 applications', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${leadToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.title).toBe('AI Student Assistant');
    expect(data.creatorId).toBe(leadUserId);

    const uiux = data.requiredRoles.find((r: any) => r.id === uiuxRoleId);
    const python = data.requiredRoles.find((r: any) => r.id === pythonRoleId);
    const html = data.requiredRoles.find((r: any) => r.id === htmlRoleId);

    expect(uiux.requiredMembers).toBe(1);
    expect(uiux.appliedCount).toBe(0);

    expect(python.requiredMembers).toBe(2);
    expect(python.appliedCount).toBe(0);

    expect(html.requiredMembers).toBe(1);
    expect(html.appliedCount).toBe(0);

    // Check received applications list for Lead
    const appsRes = await request(app)
      .get('/api/v1/applications/received')
      .set('Authorization', `Bearer ${leadToken}`);

    expect(appsRes.status).toBe(200);
    const myProjectApps = appsRes.body.data.filter((a: any) => a.projectId === projectId);
    expect(myProjectApps.length).toBe(0);
  });

  it('Step 2: Student 1 applies for Python Developer role', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        projectId,
        projectRoleId: pythonRoleId,
        roleName: 'Python Developer',
        pitch: 'I have 3+ years of Python & FastAPI experience and built async backends at MIT.',
        availabilityHours: 15,
        relevantLinks: ['https://github.com/student1-mit'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roleName).toBe('Python Developer');
    expect(res.body.data.applicantId).toBe(student1UserId);
  });

  it('Step 3: Lead sees Python Developer application count updated to 1/2 and Student 1 applicant details', async () => {
    // 1. Verify project role counts
    const projectRes = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${leadToken}`);

    expect(projectRes.status).toBe(200);
    const projectData = projectRes.body.data;

    const uiux = projectData.requiredRoles.find((r: any) => r.id === uiuxRoleId);
    const python = projectData.requiredRoles.find((r: any) => r.id === pythonRoleId);
    const html = projectData.requiredRoles.find((r: any) => r.id === htmlRoleId);

    expect(uiux.appliedCount).toBe(0); // unchanged
    expect(python.appliedCount).toBe(1); // 1 of 2
    expect(python.requiredMembers).toBe(2);
    expect(html.appliedCount).toBe(0); // unchanged

    // 2. Verify Lead received applications list
    const appsRes = await request(app)
      .get('/api/v1/applications/received')
      .set('Authorization', `Bearer ${leadToken}`);

    expect(appsRes.status).toBe(200);
    const projectApps = appsRes.body.data.filter((a: any) => a.projectId === projectId);
    expect(projectApps.length).toBe(1);

    const s1App = projectApps[0];
    expect(s1App.applicantId).toBe(student1UserId);
    expect(s1App.roleName).toBe('Python Developer');
    expect(s1App.applicant.name).toBe('Vivek Jadhav');
    expect(s1App.applicant.email).toBe('student1@test.com');
    expect(s1App.applicant.skills.length).toBeGreaterThan(0);
    expect(s1App.applicant.experiences.length).toBeGreaterThan(0);
  });

  it('Step 4: Student 2 applies for Python Developer role', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({
        projectId,
        projectRoleId: pythonRoleId,
        roleName: 'Python Developer',
        pitch: 'CS Junior @ UC Berkeley focusing on distributed Python services, Docker, and Postgres.',
        availabilityHours: 12,
        relevantLinks: ['https://github.com/student2-cal'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.roleName).toBe('Python Developer');
    expect(res.body.data.applicantId).toBe(student2UserId);
  });

  it('Step 5: Lead sees Python Developer application count updated to 2/2 and both applicant cards under Python Developer', async () => {
    // 1. Verify project role counts
    const projectRes = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${leadToken}`);

    expect(projectRes.status).toBe(200);
    const projectData = projectRes.body.data;

    const uiux = projectData.requiredRoles.find((r: any) => r.id === uiuxRoleId);
    const python = projectData.requiredRoles.find((r: any) => r.id === pythonRoleId);
    const html = projectData.requiredRoles.find((r: any) => r.id === htmlRoleId);

    expect(uiux.appliedCount).toBe(0); // 0/1
    expect(python.appliedCount).toBe(2); // 2/2
    expect(python.requiredMembers).toBe(2);
    expect(html.appliedCount).toBe(0); // 0/1

    // 2. Verify Lead received applications list
    const appsRes = await request(app)
      .get('/api/v1/applications/received')
      .set('Authorization', `Bearer ${leadToken}`);

    expect(appsRes.status).toBe(200);
    const projectApps = appsRes.body.data.filter((a: any) => a.projectId === projectId);
    expect(projectApps.length).toBe(2);

    const s1App = projectApps.find((a: any) => a.applicantId === student1UserId);
    const s2App = projectApps.find((a: any) => a.applicantId === student2UserId);

    expect(s1App).toBeDefined();
    expect(s1App.applicant.name).toBe('Vivek Jadhav');
    expect(s1App.roleName).toBe('Python Developer');

    expect(s2App).toBeDefined();
    expect(s2App.applicant.name).toBe('Student 2');
    expect(s2App.roleName).toBe('Python Developer');
  });

  it('Step 6: Security - Student 1 cannot view received applications for projects they do not own', async () => {
    const res = await request(app)
      .get('/api/v1/applications/received')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(200);
    // Student 1 owns no projects, so received applications should be empty
    expect(res.body.data.length).toBe(0);
  });
});
