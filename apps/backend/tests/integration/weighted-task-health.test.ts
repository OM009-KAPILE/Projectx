import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '@projectx/db';

const app = createApp();

describe('Weighted Task Progress & Project Health Integration Tests', () => {
  let leadToken: string;
  let leadUserId: string;
  let memberToken: string;
  let memberUserId: string;
  let strangerToken: string;
  let strangerUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    // 1. Authenticate Lead (Om Kapile)
    let leadAuth = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kapileom27@gmail.com', password: 'Test@123' });
    if (leadAuth.status !== 200) {
      leadAuth = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'lead@test.com', password: 'Test@123' });
    }
    expect(leadAuth.status).toBe(200);
    leadToken = leadAuth.body.data.tokens.accessToken;
    leadUserId = leadAuth.body.data.user.id;

    // 2. Authenticate Vivek Jadhav (student1@test.com)
    const memberAuth = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@test.com', password: 'Test@123' });
    expect(memberAuth.status).toBe(200);
    memberToken = memberAuth.body.data.tokens.accessToken;
    memberUserId = memberAuth.body.data.user.id;

    // 3. Authenticate Stranger (student2@test.com)
    const strangerAuth = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student2@test.com', password: 'Test@123' });
    expect(strangerAuth.status).toBe(200);
    strangerToken = strangerAuth.body.data.tokens.accessToken;
    strangerUserId = strangerAuth.body.data.user.id;

    // Create a fresh test project owned by Lead
    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        title: 'Project Health Test Project',
        pitch: 'Testing weighted sprint tasks and dynamic health calculation in real-time.',
        publicTeaser: 'Testing weighted sprint tasks and dynamic health calculation in real-time.',
        domain: 'AI / Machine Learning',
        difficulty: 'INTERMEDIATE',
        duration: '8 weeks',
        teamSize: 3,
        collegeVisibility: 'ALL_COLLEGES',
        roles: [
          {
            title: 'Python Backend Developer',
            description: 'Develop API services',
            requiredSkills: [{ skillName: 'Python', category: 'Backend', minLevel: 3, isCritical: true }],
          },
        ],
      });

    expect(projectRes.status).toBe(201);
    testProjectId = projectRes.body.data.id;

    // Add Member to Project
    await prisma.projectMember.create({
      data: {
        projectId: testProjectId,
        userId: memberUserId,
        roleTitle: 'Python Backend Developer',
      },
    });
  });

  afterAll(async () => {
    if (testProjectId) {
      await prisma.task.deleteMany({ where: { projectId: testProjectId } });
      await prisma.projectMember.deleteMany({ where: { projectId: testProjectId } });
      await prisma.project.delete({ where: { id: testProjectId } }).catch(() => {});
    }
  });

  let task1Id: string;
  let task2Id: string;

  it('1. Lead can create weighted sprint tasks within the 100% budget', async () => {
    // Task 1: 40% weight, assigned to member
    const res1 = await request(app)
      .post(`/api/v1/workspace/projects/${testProjectId}/tasks`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        title: 'Build FastAPI Microservices',
        description: 'Core backend endpoints with validation',
        priority: 'HIGH',
        weight: 40,
        progress: 0,
        assigneeId: memberUserId,
      });

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.weight).toBe(40);
    expect(res1.body.data.progress).toBe(0);
    expect(res1.body.data.weightedContribution).toBe(0);
    expect(res1.body.data.assignee.name).toBe('Vivek Jadhav');
    task1Id = res1.body.data.id;

    // Task 2: 30% weight
    const res2 = await request(app)
      .post(`/api/v1/workspace/projects/${testProjectId}/tasks`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        title: 'Database Schema & Indexing',
        priority: 'MEDIUM',
        weight: 30,
        progress: 0,
      });

    expect(res2.status).toBe(201);
    expect(res2.body.data.weight).toBe(30);
    task2Id = res2.body.data.id;
  });

  it('2. Enforces weight budget: rejects task creation that exceeds 100% total weight', async () => {
    // Current total: 40 + 30 = 70%. Attempting 50% should fail (70 + 50 = 120 > 100)
    const res = await request(app)
      .post(`/api/v1/workspace/projects/${testProjectId}/tasks`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        title: 'Overweight task',
        weight: 50,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Total task weight cannot exceed 100%');
  });

  it('3. Lead creates task 3 with remaining 30% weight to reach exactly 100%', async () => {
    const res = await request(app)
      .post(`/api/v1/workspace/projects/${testProjectId}/tasks`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        title: 'Dockerization and Deployment',
        weight: 30,
        progress: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.weight).toBe(30);
  });

  it('4. Assigned member (Vivek) updates task progress 0% -> 50% and health dynamically updates', async () => {
    // Member updates their assigned task (Task 1: 40% weight) to 50% progress
    const updateRes = await request(app)
      .patch(`/api/v1/workspace/tasks/${task1Id}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        progress: 50,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.progress).toBe(50);
    expect(updateRes.body.data.status).toBe('IN_PROGRESS');
    // Contribution = 40 * 0.5 = 20%
    expect(updateRes.body.data.weightedContribution).toBe(20);

    // Verify workspace overview reflects 20% progress
    const overviewRes = await request(app)
      .get(`/api/v1/workspace/projects/${testProjectId}/overview`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.progressPercentage).toBe(20);
  });

  it('5. Assigned member (Vivek) updates task progress 50% -> 100% and status auto-syncs to DONE', async () => {
    const updateRes = await request(app)
      .patch(`/api/v1/workspace/tasks/${task1Id}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        progress: 100,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.progress).toBe(100);
    expect(updateRes.body.data.status).toBe('DONE');
    // Contribution = 40 * 1.0 = 40%
    expect(updateRes.body.data.weightedContribution).toBe(40);

    // Verify overview
    const overviewRes = await request(app)
      .get(`/api/v1/workspace/projects/${testProjectId}/overview`)
      .set('Authorization', `Bearer ${leadToken}`);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.progressPercentage).toBe(40);
  });

  it('6. Access Control: Stranger cannot update another member\'s assigned task (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/v1/workspace/tasks/${task1Id}/status`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({
        progress: 0,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('7. Access Control: Assigned member cannot adjust task weight or reassign (403 Forbidden)', async () => {
    // Attempt to change weight
    const weightRes = await request(app)
      .patch(`/api/v1/workspace/tasks/${task1Id}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        weight: 10,
      });

    expect(weightRes.status).toBe(403);
    expect(weightRes.body.message).toContain('Only the project lead can adjust task weights');

    // Attempt to reassign
    const reassignRes = await request(app)
      .patch(`/api/v1/workspace/tasks/${task1Id}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        assigneeId: strangerUserId,
      });

    expect(reassignRes.status).toBe(403);
    expect(reassignRes.body.message).toContain('Only the project lead can reassign tasks');
  });

  it('8. Project Lead has full authority to update task progress, weight, and assignment', async () => {
    const res = await request(app)
      .patch(`/api/v1/workspace/tasks/${task2Id}/status`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        status: 'DONE',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DONE');
    expect(res.body.data.progress).toBe(100);
    expect(res.body.data.weightedContribution).toBe(30);

    // Total progress should now be 40 (task1) + 30 (task2) = 70%
    const overviewRes = await request(app)
      .get(`/api/v1/workspace/projects/${testProjectId}/overview`)
      .set('Authorization', `Bearer ${leadToken}`);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.progressPercentage).toBe(70);
  });
});
