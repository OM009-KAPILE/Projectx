import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '@projectx/db';

const app = createApp();

describe('Project Separation: Explore Projects vs My Projects (SIH Demo)', () => {
  let omToken: string;
  let omId: string;
  let vivekToken: string;
  let vivekId: string;
  let omProject: any;

  beforeAll(async () => {
    // 1. Authenticate Om Kapile (Lead)
    const omAuth = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kapileom27@gmail.com', password: 'Test@123' });

    expect(omAuth.status).toBe(200);
    omToken = omAuth.body.data.tokens.accessToken;
    omId = omAuth.body.data.user.id;

    // 2. Authenticate Vivek Jadhav (Applicant / Member)
    const vivekAuth = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@test.com', password: 'Test@123' });

    expect(vivekAuth.status).toBe(200);
    vivekToken = vivekAuth.body.data.tokens.accessToken;
    vivekId = vivekAuth.body.data.user.id;

    // 3. Find or ensure an Om Kapile project exists
    omProject = await prisma.project.findFirst({
      where: { creatorId: omId },
    });

    expect(omProject).toBeDefined();

    // Ensure Vivek is a member of omProject to test joined list
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: omProject.id,
          userId: vivekId,
        },
      },
      update: {},
      create: {
        projectId: omProject.id,
        userId: vivekId,
        roleTitle: 'Python Developer',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('1. Explore Projects (GET /api/v1/projects) for Om Kapile MUST NOT contain Om Kapile owned projects', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${omToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const exploreProjects = res.body.data;
    const omOwnedInExplore = exploreProjects.filter((p: any) => p.creator?.id === omId || p.id === omProject.id);

    expect(omOwnedInExplore.length).toBe(0);
  });

  test('2. My Projects (GET /api/v1/projects/user/created) for Om Kapile DOES contain Om Kapile owned projects', async () => {
    const res = await request(app)
      .get('/api/v1/projects/user/created')
      .set('Authorization', `Bearer ${omToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const createdProjects = res.body.data;
    const foundOmProject = createdProjects.find((p: any) => p.id === omProject.id);

    expect(foundOmProject).toBeDefined();
    expect(foundOmProject.id).toBe(omProject.id);
  });

  test('3. Explore Projects (GET /api/v1/projects) for Vivek Jadhav CAN contain Om Kapile discoverable projects', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${vivekToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const exploreProjects = res.body.data;
    const omProjectForVivek = exploreProjects.find((p: any) => p.id === omProject.id);

    expect(omProjectForVivek).toBeDefined();
    expect(omProjectForVivek.creator.id).toBe(omId);
  });

  test('4. My Joined Projects (GET /api/v1/projects/user/joined) for Vivek Jadhav contains Om Kapile project where Vivek is a member', async () => {
    const res = await request(app)
      .get('/api/v1/projects/user/joined')
      .set('Authorization', `Bearer ${vivekToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const joinedProjects = res.body.data;
    const foundJoined = joinedProjects.find((p: any) => p.id === omProject.id);

    expect(foundJoined).toBeDefined();
    expect(foundJoined.id).toBe(omProject.id);
  });

  test('5. Anonymous Explore Projects (GET /api/v1/projects without auth) returns public projects properly', async () => {
    const res = await request(app).get('/api/v1/projects');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('6. Explore Projects query filters work in conjunction with creator exclusion', async () => {
    const res = await request(app)
      .get('/api/v1/projects?status=RECRUITING')
      .set('Authorization', `Bearer ${omToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Ensure no Om project is returned even with filters
    const omOwned = res.body.data.filter((p: any) => p.creator?.id === omId || p.id === omProject.id);
    expect(omOwned.length).toBe(0);
  });
});
