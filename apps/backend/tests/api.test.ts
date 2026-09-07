import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '@projectx/db';
import { EmailService } from '../src/services/email.service';
import { config } from '../src/config';

const app = createApp();

describe('ProjectX Backend API Test Suite', () => {
  let aliceToken: string;
  let aliceUserId: string;
  let bobToken: string;
  let bobUserId: string;
  let aerorouteProjectId: string;
  let gnnRoleId: string;
  let createdApplicationId: string;

  beforeAll(async () => {
    // 1. Authenticate Alice (Creator from Stanford)
    const aliceRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@stanford.edu', password: 'password123' });

    expect(aliceRes.status).toBe(200);
    expect(aliceRes.body.success).toBe(true);
    aliceToken = aliceRes.body.data.tokens.accessToken;
    aliceUserId = aliceRes.body.data.user.id;

    // 2. Authenticate Bob (Candidate from MIT)
    const bobRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bob@mit.edu', password: 'password123' });

    expect(bobRes.status).toBe(200);
    bobToken = bobRes.body.data.tokens.accessToken;
    bobUserId = bobRes.body.data.user.id;

    // 3. Find AeroRoute AI Project and ensure Bob is NOT a member initially
    const project = await prisma.project.findFirst({
      where: { title: 'AeroRoute AI' },
      include: { requiredRoles: true },
    });
    expect(project).toBeDefined();
    aerorouteProjectId = project!.id;
    const gnnRole = project!.requiredRoles.find((r) => r.title.includes('GNN'));
    expect(gnnRole).toBeDefined();
    gnnRoleId = gnnRole!.id;

    // Ensure Bob is not a member before test suite runs
    const bobUser = await prisma.user.findUnique({ where: { email: 'bob@mit.edu' } });
    if (bobUser) {
      await prisma.projectMember.deleteMany({
        where: { projectId: aerorouteProjectId, userId: bobUser.id },
      });
      await prisma.application.deleteMany({
        where: { projectId: aerorouteProjectId, applicantId: bobUser.id },
      });
      await prisma.blockedUser.deleteMany({
        where: {
          OR: [
            { blockerId: bobUser.id },
            { blockedId: bobUser.id },
          ],
        },
      });
      await prisma.message.deleteMany({
        where: { senderId: bobUser.id },
      });
      await prisma.conversationParticipant.deleteMany({
        where: { userId: bobUser.id },
      });
      await prisma.conversation.deleteMany({
        where: { projectId: aerorouteProjectId },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('0. Authentication Lifecycle & Verification Experience', () => {
    const testEmail = `newstudent_${Date.now()}@cmu.edu`;
    let verificationCode: string;

    it('should register a new student and require email verification', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: 'password123',
          name: 'Sarah Connor',
          collegeDomain: 'cmu.edu',
          course: 'Robotics Engineering',
          graduationYear: 2028,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requiresVerification).toBe(true);
      expect(res.body.data.email).toBe(testEmail);

      // Verify code was generated in DB
      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      expect(user).toBeDefined();
      expect(user!.isVerified).toBe(false);
      expect(user!.verificationCode).toBeDefined();
      verificationCode = user!.verificationCode!;
    });

    it('should verify email using 6-digit code and activate session', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          email: testEmail,
          code: verificationCode,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.user.isVerified).toBe(true);
    });

    it('should dispatch password reset token on forgot-password request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      expect(user!.resetPasswordToken).toBeDefined();

      // Reset password with token
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: testEmail,
          token: user!.resetPasswordToken,
          newPassword: 'newpassword456',
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Login with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'newpassword456',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.tokens.accessToken).toBeDefined();
      const studentToken = loginRes.body.data.tokens.accessToken;

      // Complete Onboarding Flow
      const onboardingRes = await request(app)
        .post('/api/v1/users/onboarding')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Sarah Connor',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          course: 'Robotics Engineering',
          graduationYear: 2028,
          weeklyAvailability: '10-20h',
          interests: ['Robotics & Applied AI', 'Autonomous Systems'],
          skills: [
            { skillName: 'ROS2', proficiency: 4, category: 'Hardware & IoT' },
            { skillName: 'C++', proficiency: 5, category: 'Backend' },
            { skillName: 'Computer Vision', proficiency: 4, category: 'AI/ML' },
          ],
          githubUrl: 'https://github.com/sarahconnor',
          portfolioUrl: 'https://sarah.dev',
        });

      expect(onboardingRes.status).toBe(200);
      expect(onboardingRes.body.success).toBe(true);
      expect(onboardingRes.body.data.user.onboardingCompleted).toBe(true);
      expect(onboardingRes.body.data.completion.score).toBeGreaterThanOrEqual(80);
      expect(onboardingRes.body.data.completion.percentage).toBeGreaterThanOrEqual(80);
    });
  });

  describe('1. Progressive Project Disclosure (IP Protection & 4 Access Levels)', () => {
    it('should return LEVEL 1 (Public Safe Listing) to unauthenticated/non-applicants without leaking technical specs or problem details', async () => {
      // Bob (before applying) queries AeroRoute AI
      const res = await request(app)
        .get(`/api/v1/projects/${aerorouteProjectId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('AeroRoute AI');
      expect(res.body.data.disclosureLevel).toBe(1);
      expect(res.body.data.privacyIndicator.code).toBe('LEVEL_1_PUBLIC');
      expect(res.body.data.isProgressiveDisclosureLocked).toBe(true);
      expect(res.body.data.privateRepoUrl).toBeUndefined();
      expect(res.body.data.privateNotes).toBeUndefined();
      expect(res.body.data.architectureSpec).toBeUndefined();
      expect(res.body.data.technicalApproach).toBeUndefined();
      expect(res.body.data.problemStatement).toBeUndefined();
      expect(res.body.data.publicTeaser).toBeDefined();
    });

    it('should return LEVEL 4 (Project Owner) full administrative access to the project creator', async () => {
      // Alice (creator) queries AeroRoute AI
      const res = await request(app)
        .get(`/api/v1/projects/${aerorouteProjectId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.disclosureLevel).toBe(4);
      expect(res.body.data.privacyIndicator.code).toBe('LEVEL_4_OWNER');
      expect(res.body.data.isProgressiveDisclosureLocked).toBe(false);
      expect(res.body.data.isOwner).toBe(true);
      expect(res.body.data.canRevokeAccess).toBe(true);
      expect(res.body.data.privateRepoUrl).toContain('flight-core');
      expect(res.body.data.architectureSpec).toBeDefined();
      expect(res.body.data.privateNotes).toBeDefined();
      expect(res.body.data.members.length).toBeGreaterThanOrEqual(1);
    });

    it('should return personalized home feed with recommended projects, skill matches, and alerts', async () => {
      const res = await request(app)
        .get('/api/v1/projects/feed/home')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendedProjects).toBeDefined();
      expect(res.body.data.activeProjects).toBeDefined();
      expect(res.body.data.activeProjects.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.profileCompletion).toBeDefined();
    });
  });

  describe('2. AI Project Decomposition & Skill Gap Detection', () => {
    it('should decompose raw idea and identify roles and skills', async () => {
      const res = await request(app)
        .post('/api/v1/projects/ai-analyze')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          title: 'SolarGrid Distributed',
          pitch: 'Decentralized peer-to-peer solar energy trading using smart contracts and time-series load forecasting with PyTorch and Go.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.extractedRoles.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.publicTeaser).toBeDefined();
    });

    it('should compute live skill gaps for project comparing required vs team skills', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${aerorouteProjectId}/gaps`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skillCoveragePercentage).toBeDefined();
      expect(res.body.data.summaryMessage).toBeDefined();
      expect(res.body.data.requiredSkills).toBeDefined();
      expect(res.body.data.coveredSkills).toBeDefined();
      expect(res.body.data.missingSkills).toBeDefined();
      expect(res.body.data.overlappingSkills).toBeDefined();

      // Check missing skill details
      if (res.body.data.missingSkills.length > 0) {
        const firstMissing = res.body.data.missingSkills[0];
        expect(firstMissing.skillName).toBeDefined();
        expect(firstMissing.minLevel).toBeDefined();
        expect(firstMissing.peopleNeeded).toBe(1);
      }
    });
  });

  describe('3. Application & Team Formation Workflow', () => {
    it('should allow Bob from MIT to apply for GNN Role with full application fields and dispatch dual emails', async () => {
      // Clear sent email inbox for clean count
      EmailService.sentInbox = [];

      // Delete prior application if exists to test clean submit
      await prisma.application.deleteMany({
        where: {
          projectId: aerorouteProjectId,
          applicantId: (await prisma.user.findUnique({ where: { email: 'bob@mit.edu' } }))!.id,
        },
      });

      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          projectId: aerorouteProjectId,
          projectRoleId: gnnRoleId,
          pitch: 'I have extensive research experience in GNN routing algorithms at MIT CSAIL.',
          relevantSkills: ['Python', 'PyTorch', 'Graph Neural Networks', 'Computer Vision'],
          availability: '10-20 hours/week',
          experience: 'Published 1 workshop paper on graph attention networks; built pathfinding simulator.',
          githubUrl: 'https://github.com/bobmiller-ai/gnn-routing',
          portfolioUrl: 'https://bobmiller-mit.dev',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matchScore).toBeGreaterThanOrEqual(70);
      createdApplicationId = res.body.data.id;

      // Verify email dispatched to Alice (project owner) AND receipt to Bob (applicant)
      const ownerEmail = EmailService.sentInbox.find((e) => e.to === 'alice@stanford.edu');
      const applicantEmail = EmailService.sentInbox.find((e) => e.to === 'bob@mit.edu');

      expect(ownerEmail).toBeDefined();
      expect(ownerEmail!.subject).toContain('AeroRoute AI');
      expect(applicantEmail).toBeDefined();
      expect(applicantEmail!.subject).toContain('Application Submitted');

      // Verify Alice can fetch her created projects and see Bob's application in queue
      const createdProjectsRes = await request(app)
        .get('/api/v1/projects/user/created')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(createdProjectsRes.status).toBe(200);
      expect(createdProjectsRes.body.success).toBe(true);
      const aeroCreated = createdProjectsRes.body.data.find((p: any) => p.id === aerorouteProjectId);
      expect(aeroCreated).toBeDefined();
      expect(aeroCreated.applications.length).toBeGreaterThan(0);
      const bobApp = aeroCreated.applications.find((a: any) => a.id === createdApplicationId);
      expect(bobApp).toBeDefined();
      expect(bobApp.applicant.email).toBe('bob@mit.edu');

      // Verify Bob now has LEVEL 2 (Applicant) access
      const applicantRes = await request(app)
        .get(`/api/v1/projects/${aerorouteProjectId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(applicantRes.status).toBe(200);
      expect(applicantRes.body.data.disclosureLevel).toBe(2);
      expect(applicantRes.body.data.privacyIndicator.code).toBe('LEVEL_2_APPLICANT');
      expect(applicantRes.body.data.problemStatement).toBeDefined();
      expect(applicantRes.body.data.privateRepoUrl).toBeUndefined();
      expect(applicantRes.body.data.architectureSpec).toBeUndefined();
      expect(applicantRes.body.data.technicalApproach).toBeUndefined();
    });

    it('should allow an applicant to withdraw a pending application', async () => {
      // Create a temporary application to test withdrawal
      const tempAppRes = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          projectId: aerorouteProjectId,
          projectRoleId: gnnRoleId,
          pitch: 'Temporary pitch for withdrawal testing.',
        });

      // Status could be 201 or 400 if duplicate, but delete existing if any
      const tempAppId = tempAppRes.body?.data?.id;
      if (tempAppId) {
        const withdrawRes = await request(app)
          .delete(`/api/v1/applications/${tempAppId}`)
          .set('Authorization', `Bearer ${bobToken}`);

        expect(withdrawRes.status).toBe(200);
        expect(withdrawRes.body.success).toBe(true);
        expect(withdrawRes.body.message).toContain('withdrawn successfully');
      }
    });

    it('should allow Alice to SHORTLIST Bob and dispatch shortlist email to applicant', async () => {
      EmailService.sentInbox = [];

      const res = await request(app)
        .patch(`/api/v1/applications/${createdApplicationId}/review`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ status: 'SHORTLISTED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SHORTLISTED');

      // Verify shortlist notification email sent to Bob
      const shortlistEmail = EmailService.sentInbox.find((e) => e.to === 'bob@mit.edu');
      expect(shortlistEmail).toBeDefined();
      expect(shortlistEmail!.subject).toContain('Shortlisted');
    });

    it('should allow Alice to review and ACCEPT Bob into the team granting LEVEL 3 Member Access', async () => {
      EmailService.sentInbox = [];

      const res = await request(app)
        .patch(`/api/v1/applications/${createdApplicationId}/review`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ status: 'ACCEPTED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACCEPTED');

      // Verify acceptance email sent to Bob
      const acceptEmail = EmailService.sentInbox.find((e) => e.to === 'bob@mit.edu');
      expect(acceptEmail).toBeDefined();
      expect(acceptEmail!.subject).toContain('Accepted');

      // Now Bob is an official member, verify LEVEL 3 (Member) access unlocks
      const memberRes = await request(app)
        .get(`/api/v1/projects/${aerorouteProjectId}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(memberRes.status).toBe(200);
      expect(memberRes.body.data.disclosureLevel).toBe(3);
      expect(memberRes.body.data.privacyIndicator.code).toBe('LEVEL_3_MEMBER');
      expect(memberRes.body.data.isProgressiveDisclosureLocked).toBe(false);
      expect(memberRes.body.data.privateRepoUrl).toContain('flight-core');
      expect(memberRes.body.data.architectureSpec).toBeDefined();
      expect(memberRes.body.data.privateNotes).toBeUndefined(); // Private notes are Owner only
    });

    it('should enforce access revocation by project owner', async () => {
      // Find Bob's member record
      const bobUser = await prisma.user.findUnique({ where: { email: 'bob@mit.edu' } });
      const member = await prisma.projectMember.findFirst({
        where: { projectId: aerorouteProjectId, userId: bobUser!.id },
      });

      expect(member).toBeDefined();

      // Bob tries to revoke his own or another member (Forbidden)
      const unauthorizedRes = await request(app)
        .delete(`/api/v1/projects/${aerorouteProjectId}/members/${member!.id}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(unauthorizedRes.status).toBe(403);

      // Alice (Owner) revokes access
      const revokeRes = await request(app)
        .delete(`/api/v1/projects/${aerorouteProjectId}/members/${member!.id}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.success).toBe(true);

      // Re-add Bob for subsequent workspace tests
      await prisma.projectMember.create({
        data: {
          projectId: aerorouteProjectId,
          userId: bobUser!.id,
          roleTitle: 'GNN Engineer',
        },
      });
    });
  });

  describe('3.1 Team Management & Skill Coverage Module', () => {
    it('should return complete visual skill coverage breakdown and team roster', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${aerorouteProjectId}/team`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.visualCoverage).toBeDefined();
      expect(Array.isArray(res.body.data.visualCoverage)).toBe(true);
      expect(res.body.data.visualCoverage.length).toBeGreaterThan(0);

      // Verify category coverage shape
      const firstCat = res.body.data.visualCoverage[0];
      expect(firstCat.category).toBeDefined();
      expect(typeof firstCat.percentage).toBe('number');
      expect(firstCat.status).toBeDefined();

      // Verify members list with skills and proficiencies
      expect(res.body.data.members.length).toBeGreaterThanOrEqual(2);
      const bobMember = res.body.data.members.find((m: any) => m.name === 'Bob Miller');
      expect(bobMember).toBeDefined();
      expect(bobMember.skills.length).toBeGreaterThan(0);
    });

    it('should allow project owner to assign/reassign a member role', async () => {
      const bobUser = await prisma.user.findUnique({ where: { email: 'bob@mit.edu' } });
      const member = await prisma.projectMember.findFirst({
        where: { projectId: aerorouteProjectId, userId: bobUser!.id },
      });

      const res = await request(app)
        .patch(`/api/v1/projects/${aerorouteProjectId}/members/${member!.id}/role`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ roleTitle: 'Lead Trajectory Optimization Specialist' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roleTitle).toBe('Lead Trajectory Optimization Specialist');

      // Verify member received notification
      const notif = await prisma.notification.findFirst({
        where: { userId: bobUser!.id, type: 'ROLE_ASSIGNED' },
        orderBy: { createdAt: 'desc' },
      });
      expect(notif).toBeDefined();
      expect(notif!.message).toContain('Lead Trajectory Optimization Specialist');
    });

    it('should allow project owner to invite a candidate directly and send professional email', async () => {
      EmailService.sentInbox = [];

      const res = await request(app)
        .post(`/api/v1/projects/${aerorouteProjectId}/invitations`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          email: 'bob@mit.edu',
          roleTitle: 'Autonomous Routing Architect',
          customMessage: 'We would love your expertise in graph modeling for our platform!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify invitation email was dispatched to candidate
      const inviteEmail = EmailService.sentInbox.find((e) => e.to === 'bob@mit.edu');
      expect(inviteEmail).toBeDefined();
      expect(inviteEmail!.subject).toContain('Invitation from Alice Chen');
      expect(inviteEmail!.html).toContain('Autonomous Routing Architect');
    });

    it('should forbid non-owners from assigning roles or inviting members', async () => {
      const bobUser = await prisma.user.findUnique({ where: { email: 'bob@mit.edu' } });
      const member = await prisma.projectMember.findFirst({
        where: { projectId: aerorouteProjectId, userId: bobUser!.id },
      });

      const unauthAssign = await request(app)
        .patch(`/api/v1/projects/${aerorouteProjectId}/members/${member!.id}/role`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ roleTitle: 'Hacked Role' });

      expect(unauthAssign.status).toBe(403);

      const unauthInvite = await request(app)
        .post(`/api/v1/projects/${aerorouteProjectId}/invitations`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ email: 'charlie@stanford.edu', roleTitle: 'Designer' });

      expect(unauthInvite.status).toBe(403);
    });
  });

  describe('4. Workspace Tasks & Project Health', () => {
    let createdTaskId: string;
    let createdMilestoneId: string;
    let createdFileId: string;

    it('should allow team members to create tasks with priority, assignee, and due date', async () => {
      const bobUser = await prisma.user.findUnique({ where: { email: 'bob@mit.edu' } });

      const res = await request(app)
        .post(`/api/v1/workspace/projects/${aerorouteProjectId}/tasks`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          projectId: aerorouteProjectId,
          title: 'Train Spatial GNN on MIT Supercloud GPU Node',
          description: 'Model optimization for real-time collision prediction',
          priority: 'URGENT',
          assigneeId: bobUser!.id,
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Train Spatial GNN on MIT Supercloud GPU Node');
      expect(res.body.data.priority).toBe('URGENT');
      expect(res.body.data.assignee.name).toBe('Bob Miller');
      createdTaskId = res.body.data.id;
    });

    it('should allow team members to add comments to a task discussion thread', async () => {
      const res = await request(app)
        .post(`/api/v1/workspace/tasks/${createdTaskId}/comments`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          content: 'I uploaded the benchmark trajectory dataset to MIT Supercloud.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toContain('benchmark trajectory dataset');
      expect(res.body.data.authorName).toBe('Alice Chen');
    });

    it('should allow updating task status across Kanban columns', async () => {
      const res = await request(app)
        .patch(`/api/v1/workspace/tasks/${createdTaskId}/status`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ status: 'DONE' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DONE');
    });

    it('should calculate simple progress and return workspace overview', async () => {
      const res = await request(app)
        .get(`/api/v1/workspace/projects/${aerorouteProjectId}/overview`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalTasks).toBeGreaterThanOrEqual(1);
      expect(res.body.data.completedTasks).toBeGreaterThanOrEqual(1);
      expect(typeof res.body.data.progressPercentage).toBe('number');
      expect(res.body.data.progressPercentage).toBeGreaterThanOrEqual(0);
    });

    it('should allow team members to share and retrieve project files & resources', async () => {
      const addFileRes = await request(app)
        .post(`/api/v1/workspace/projects/${aerorouteProjectId}/files`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: 'Stanford Flight Trajectory Dataset v1',
          url: 'https://drive.google.com/stanford-aero-dataset',
          category: 'DATASET',
        });

      expect(addFileRes.status).toBe(201);
      expect(addFileRes.body.success).toBe(true);
      expect(addFileRes.body.data.name).toBe('Stanford Flight Trajectory Dataset v1');
      createdFileId = addFileRes.body.data.id;

      const getFilesRes = await request(app)
        .get(`/api/v1/workspace/projects/${aerorouteProjectId}/files`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(getFilesRes.status).toBe(200);
      expect(getFilesRes.body.success).toBe(true);
      expect(getFilesRes.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow team members to create delivery milestones and track roadmap', async () => {
      const res = await request(app)
        .post(`/api/v1/workspace/projects/${aerorouteProjectId}/milestones`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          title: 'Phase 1: Real-time MAVLink Telemetry Bridge MVP',
          description: 'Working simulator integration with sub-100ms latency',
          dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('Phase 1');
      createdMilestoneId = res.body.data.id;

      // Toggle milestone status
      const updateRes = await request(app)
        .patch(`/api/v1/workspace/milestones/${createdMilestoneId}/status`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ isCompleted: true });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.isCompleted).toBe(true);
    });

    it('should evaluate and return comprehensive project health intelligence using real project data', async () => {
      const res = await request(app)
        .get(`/api/v1/health/projects/${aerorouteProjectId}/health`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const health = res.body.data;
      expect(typeof health.healthScore).toBe('number');
      expect(health.healthScore).toBeGreaterThan(0);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(health.riskLevel);

      // Verify 6 Diagnostic Factors
      expect(health.teamCompleteness).toBeDefined();
      expect(typeof health.teamCompleteness.score).toBe('number');
      expect(health.teamCompleteness.details).toBeDefined();

      expect(health.taskProgress).toBeDefined();
      expect(typeof health.taskProgress.score).toBe('number');

      expect(health.deadlineRisk).toBeDefined();
      expect(typeof health.deadlineRisk.score).toBe('number');

      expect(health.skillCoverage).toBeDefined();
      expect(typeof health.skillCoverage.score).toBe('number');

      expect(health.milestoneProgress).toBeDefined();
      expect(typeof health.milestoneProgress.score).toBe('number');

      expect(health.workloadDistribution).toBeDefined();
      expect(typeof health.workloadDistribution.score).toBe('number');

      // Verify Rule-based Recommendations
      expect(Array.isArray(health.recommendations)).toBe(true);
      expect(health.recommendations.length).toBeGreaterThan(0);
      expect(health.recommendations[0].message).toBeDefined();
      expect(health.recommendations[0].severity).toBeDefined();

      // Verify Team Diversity
      expect(health.teamDiversity.distinctColleges).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Real-time Messaging, Privacy Restrictions, Reporting & Blocking', () => {
    let directConversationId: string;
    let sentMessageId: string;

    it('should allow authorized project collaborators (Alice & Bob) to start 1:1 direct conversation', async () => {
      const res = await request(app)
        .post('/api/v1/messages/direct')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          recipientId: bobUserId,
          projectId: aerorouteProjectId,
          initialMessage: 'Hey Bob! Welcome to AeroRoute AI. Review the private architecture spec.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      directConversationId = res.body.data.id;
    });

    it('should list conversations with unread counter, timestamps, and participant profiles', async () => {
      const res = await request(app)
        .get('/api/v1/messages/conversations')
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const conv = res.body.data.find((c: any) => c.id === directConversationId);
      expect(conv).toBeDefined();
      expect(conv.unreadCount).toBeGreaterThanOrEqual(1);
      expect(conv.otherParticipant.name).toBe('Alice Chen');
    });

    it('should allow sending real-time messages with ISO timestamps and college badges', async () => {
      const res = await request(app)
        .post(`/api/v1/messages/conversations/${directConversationId}/messages`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          content: 'Thanks Alice! I have reviewed the GNN model architecture and started the PyTorch implementation.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toContain('PyTorch implementation');
      expect(res.body.data.senderName).toBe('Bob Miller');
      expect(res.body.data.senderCollege).toContain('Sanjivani');
      expect(res.body.data.createdAt).toBeDefined();
      sentMessageId = res.body.data.id;
    });

    it('should mark conversation messages as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/messages/conversations/${directConversationId}/read`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow reporting an abusive or inappropriate message/user', async () => {
      const res = await request(app)
        .post('/api/v1/messages/report')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          reportedUserId: bobUserId,
          messageId: sentMessageId,
          projectId: aerorouteProjectId,
          reason: 'SPAM',
          details: 'Testing spam report submission in automated test suite',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Report submitted');
    });

    it('should allow blocking a user and prevent blocked users from sending direct messages', async () => {
      // Alice blocks Bob
      const blockRes = await request(app)
        .post('/api/v1/messages/block')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          blockedId: bobUserId,
          reason: 'Do not contact',
        });

      expect(blockRes.status).toBe(200);
      expect(blockRes.body.success).toBe(true);

      // Bob tries to send message to Alice -> Should be forbidden (403)
      const msgRes = await request(app)
        .post(`/api/v1/messages/conversations/${directConversationId}/messages`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          content: 'Hey Alice, are you there?',
        });

      expect(msgRes.status).toBe(403);
      expect(msgRes.body.message).toContain('blocked');

      // Alice unblocks Bob to restore normal test state
      const unblockRes = await request(app)
        .post('/api/v1/messages/unblock')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          blockedId: bobUserId,
        });

      expect(unblockRes.status).toBe(200);
      expect(unblockRes.body.success).toBe(true);
    });
  });

  describe('6. Notification System, Multi-Channel Preferences, Push Architecture & 10 Trigger Rules', () => {
    let testNotificationId: string;
    const testDeviceToken = 'apns_token_sample_test_device_123456789';

    it('should retrieve and initialize default notification preferences in settings', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.emailNotifications).toBe(true);
      expect(res.body.data.pushNotifications).toBe(true);
      expect(res.body.data.inAppNotifications).toBe(true);
      expect(res.body.data.notifyHealthWarning).toBe(true);
      expect(res.body.data.notifyNewApplication).toBe(true);
    });

    it('should allow updating granular notification preferences in settings', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          emailNotifications: true,
          pushNotifications: true,
          notifyHealthWarning: true,
          notifySkillGap: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifySkillGap).toBe(true);
    });

    it('should register mobile device tokens for mobile push notification architecture', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/devices')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          token: testDeviceToken,
          platform: 'IOS',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe(testDeviceToken);
      expect(res.body.data.platform).toBe('IOS');
    });

    it('should dispatch multi-channel notifications across In-App, Email, and Push for Project Health Warning', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/test-dispatch')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          type: 'PROJECT_HEALTH_WARNING',
          title: 'Project Health Warning: Action Needed',
          message: 'AeroRoute AI sprint velocity has dropped below threshold. Action recommended.',
          link: `/workspace/${aerorouteProjectId}`,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.inAppSent).toBe(true);
      expect(res.body.data.emailSent).toBe(true);
      expect(res.body.data.pushSent).toBe(true);
      expect(res.body.data.notificationId).toBeDefined();
      testNotificationId = res.body.data.notificationId;
    });

    it('should list paginated notifications with unread count for the active user', async () => {
      const res = await request(app)
        .get('/api/v1/notifications?limit=10')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination.unreadCount).toBeGreaterThanOrEqual(1);

      const found = res.body.data.find((n: any) => n.id === testNotificationId);
      expect(found).toBeDefined();
      expect(found.type).toBe('PROJECT_HEALTH_WARNING');
      expect(found.isRead).toBe(false);
    });

    it('should mark a specific notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${testNotificationId}/read`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(checkRes.body.pagination.unreadCount).toBe(0);
    });

    it('should unregister mobile device tokens on logout or permission revocation', async () => {
      const res = await request(app)
        .delete(`/api/v1/notifications/devices/${testDeviceToken}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('7. Student Profile & Skill Evidence Suite', () => {
    let newSkillId: string;
    let newExpId: string;
    let newHackId: string;
    let newProjId: string;

    it('should fetch public student profile with college, course, bio, skills, hackathons, and experience', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${bobUserId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Bob Miller');
      expect(res.body.data.college.name).toContain('Sanjivani');
      expect(res.body.data.skills.length).toBeGreaterThan(0);
      expect(res.body.data.experiences).toBeDefined();
      expect(res.body.data.hackathons).toBeDefined();
      expect(res.body.data.pastProjects).toBeDefined();
    });

    it('should allow student to update their bio, availability, interests, course, and URLs', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          bio: 'MIT CSAIL AI researcher working on spatio-temporal graph models and combinatorial algorithms.',
          weeklyAvailability: '10-20h',
          interests: 'Graph Neural Networks, Combinatorial Optimization, Robotics Perception',
          course: 'M.S. EECS (AI Focus)',
          githubUrl: 'https://github.com/bobmiller-ai',
          portfolioUrl: 'https://bobmiller.mit.edu',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.weeklyAvailability).toBe('10-20h');
      expect(res.body.data.interests).toContain('Robotics Perception');
    });

    it('should allow student to add a skill with GitHub evidence and assign Evidence-supported status', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/skills')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          skillName: 'CUDA & GPU Computing',
          category: 'Hardware & IoT',
          proficiency: 4,
          verificationStatus: 'EVIDENCE_SUPPORTED',
          evidenceType: 'GITHUB_PROJECT',
          evidenceTitle: 'CUDA Spatio-Temporal Graph Kernels',
          evidenceUrl: 'https://github.com/bobmiller-ai/cuda-graph-kernels',
          evidenceSummary: 'Custom CUDA kernels for accelerated sparse matrix multiplication.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skillName).toBe('CUDA & GPU Computing');
      expect(res.body.data.verificationStatus).toBe('EVIDENCE_SUPPORTED');
      expect(res.body.data.evidenceType).toBe('GITHUB_PROJECT');
      expect(res.body.data.evidenceUrl).toContain('cuda-graph-kernels');
      newSkillId = res.body.data.id;
    });

    it('should not allow self-declared skill without proof to be claimed as Verified', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/skills')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          skillName: 'Quantum Computing',
          category: 'AI/ML',
          proficiency: 3,
          verificationStatus: 'VERIFIED', // Attempting to claim verified without credentials
        });

      expect(res.status).toBe(200);
      // Backend automatically corrects unproven claims to SELF_DECLARED
      expect(res.body.data.verificationStatus).toBe('SELF_DECLARED');
      expect(res.body.data.isVerified).toBe(false);
    });

    it('should allow student to add research/internship experience', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/experiences')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          title: 'Research Fellow',
          company: 'MIT CSAIL',
          location: 'Cambridge, MA',
          startDate: 'Sep 2024',
          endDate: 'Present',
          isCurrent: true,
          description: 'Leading GNN algorithmic design on autonomous logistics project.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Research Fellow');
      expect(res.body.data.company).toBe('MIT CSAIL');
      newExpId = res.body.data.id;
    });

    it('should allow student to add hackathon award', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/hackathons')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          title: 'TreeHacks 2025',
          projectName: 'GraphFly Autonomy',
          award: '🏆 1st Place - Mobility Track',
          date: 'Feb 2025',
          description: 'Spatiotemporal GNN navigation for high-density aerial corridors.',
          projectUrl: 'https://devpost.com/software/graphfly',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.award).toContain('1st Place');
      newHackId = res.body.data.id;
    });

    it('should allow student to add portfolio project', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/projects')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          title: 'Autonomous Multi-Agent Flight Optimizer',
          role: 'Core Architect',
          description: 'Real-time distributed swarm collision avoidance simulator.',
          technologies: 'C++, ROS2, PyTorch, ZeroMQ',
          githubUrl: 'https://github.com/bobmiller-ai/flight-sim',
          isFeatured: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toContain('Autonomous Multi-Agent');
      newProjId = res.body.data.id;
    });

    it('should clean up and delete added items', async () => {
      const delSkill = await request(app)
        .delete(`/api/v1/users/me/skills/${newSkillId}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(delSkill.status).toBe(200);

      const delExp = await request(app)
        .delete(`/api/v1/users/me/experiences/${newExpId}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(delExp.status).toBe(200);

      const delHack = await request(app)
        .delete(`/api/v1/users/me/hackathons/${newHackId}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(delHack.status).toBe(200);

      const delProj = await request(app)
        .delete(`/api/v1/users/me/projects/${newProjId}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(delProj.status).toBe(200);
    });
  });

  describe('8. Complete Settings Suite (Account, Privacy, Appearance, Security & Support)', () => {
    it('should update and retrieve privacy settings (profile, college, portfolio, project defaults)', async () => {
      const updateRes = await request(app)
        .patch('/api/v1/users/me/privacy')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          profileVisibility: 'REGISTERED_ONLY',
          collegeVisibility: true,
          portfolioVisibility: true,
          defaultProjectPrivacy: 'PROGRESSIVE',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.profileVisibility).toBe('REGISTERED_ONLY');

      const getRes = await request(app)
        .get('/api/v1/users/me/privacy')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.profileVisibility).toBe('REGISTERED_ONLY');
      expect(getRes.body.data.defaultProjectPrivacy).toBe('PROGRESSIVE');
    });

    it('should update appearance theme preference', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me/appearance')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ themePreference: 'DARK' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.themePreference).toBe('DARK');
    });

    it('should allow user to change password verifying current password', async () => {
      // Wrong current password
      const badRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newsecurepassword123',
          confirmPassword: 'newsecurepassword123',
        });

      expect(badRes.status).toBe(400);

      // Correct current password
      const goodRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newsecurepassword123',
          confirmPassword: 'newsecurepassword123',
        });

      expect(goodRes.status).toBe(200);
      expect(goodRes.body.success).toBe(true);

      // Revert password back for idempotency
      await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          currentPassword: 'newsecurepassword123',
          newPassword: 'password123',
          confirmPassword: 'password123',
        });
    });

    it('should list active sessions and allow logout-all', async () => {
      const sessRes = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(sessRes.status).toBe(200);
      expect(sessRes.body.data.length).toBeGreaterThanOrEqual(1);

      const logoutAllRes = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(logoutAllRes.status).toBe(200);
      expect(logoutAllRes.body.success).toBe(true);
    });

    it('should retrieve Help Center FAQs and allow creating support tickets & reports', async () => {
      const faqsRes = await request(app)
        .get('/api/v1/support/faqs');

      expect(faqsRes.status).toBe(200);
      expect(faqsRes.body.data.length).toBeGreaterThan(0);

      // Submit bug report
      const ticketRes = await request(app)
        .post('/api/v1/support/tickets')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          category: 'PROBLEM',
          subject: 'UI alignment on high-DPI display',
          description: 'Observed minor padding discrepancy on 4k monitor in workspace view.',
          email: 'alice@stanford.edu',
        });

      expect(ticketRes.status).toBe(201);
      expect(ticketRes.body.success).toBe(true);
      expect(ticketRes.body.data.category).toBe('PROBLEM');
    });
  });

  describe('9. Support & Safety Suite (Reporting, Tickets, Email Dispatch & Admin Moderation)', () => {
    let createdTicketId: string;

    it('should create tickets across all support categories with optional attachments and dispatch email to SUPPORT_EMAIL', async () => {
      EmailService.sentInbox = [];

      const res = await request(app)
        .post('/api/v1/support/tickets')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          category: 'PRIVACY_CONCERN',
          targetId: aerorouteProjectId,
          subject: 'Confidential Algorithm Disclosure Check',
          description: 'Requesting safety audit on Level 4 code repository visibility to ensure no leaks.',
          attachmentUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
          email: 'bob@mit.edu',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('PRIVACY_CONCERN');
      expect(res.body.data.status).toBe('OPEN');
      expect(res.body.data.attachmentUrl).toBeDefined();
      createdTicketId = res.body.data.id;

      // Verify email dispatched to SUPPORT_EMAIL (env configured support address)
      const supportEmail = EmailService.sentInbox.find((e) => e.to === config.support.email);
      expect(supportEmail).toBeDefined();
      expect(supportEmail!.subject).toContain('PRIVACY_CONCERN');
    });

    it('should allow support staff/admin to view all tickets with status and category filters', async () => {
      const res = await request(app)
        .get('/api/v1/support/admin/tickets?status=OPEN')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.openCount).toBeGreaterThanOrEqual(1);

      const found = res.body.data.find((t: any) => t.id === createdTicketId);
      expect(found).toBeDefined();
    });

    it('should allow admin to change status to IN_PROGRESS and add an official response', async () => {
      EmailService.sentInbox = [];

      const res = await request(app)
        .patch(`/api/v1/support/admin/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          status: 'IN_PROGRESS',
          adminResponse: 'We have initiated a privacy audit with the project owner. All Level 4 items are safely sealed behind JWT authorization.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.adminResponse).toContain('privacy audit');

      // Verify response email sent to reporter (bob@mit.edu)
      const replyEmail = EmailService.sentInbox.find((e) => e.to === 'bob@mit.edu');
      expect(replyEmail).toBeDefined();
      expect(replyEmail!.subject).toContain('Support Update');
    });

    it('should allow admin to mark ticket as RESOLVED', async () => {
      const res = await request(app)
        .patch(`/api/v1/support/admin/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          status: 'RESOLVED',
          adminResponse: 'Audit complete. No unauthorized access identified. All safeguards verified.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESOLVED');
    });

    it('should allow admin to close ticket', async () => {
      const res = await request(app)
        .post(`/api/v1/support/admin/tickets/${createdTicketId}/close`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CLOSED');
    });
  });

  describe('10. Comprehensive Admin Dashboard Suite (RBAC, Moderation, User Suspension, Taxonomy & Settings)', () => {
    let adminToken: string;
    let testSkillId: string;
    let testCategoryId: string;

    beforeAll(async () => {
      // Create or promote Alice to role: ADMIN for admin suite
      const adminUser = await prisma.user.update({
        where: { email: 'alice@stanford.edu' },
        data: { role: 'ADMIN' },
      });
      expect(adminUser.role).toBe('ADMIN');

      // Re-login Alice to get refreshed token with ADMIN role
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'alice@stanford.edu', password: 'password123' });
      expect(res.status).toBe(200);
      adminToken = res.body.data.tokens.accessToken;
    });

    it('should strictly reject non-admin users with 403 Forbidden on admin endpoints', async () => {
      // Bob is role: STUDENT
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should allow verified admin to access platform dashboard metrics with all 7 top metrics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.totalUsers).toBeGreaterThanOrEqual(2);
      expect(res.body.data.metrics.activeProjects).toBeGreaterThanOrEqual(1);
      expect(res.body.data.metrics.totalColleges).toBeGreaterThanOrEqual(1);
      expect(res.body.data.metrics.totalApplications).toBeGreaterThanOrEqual(1);
      expect(res.body.data.metrics.openTickets).toBeDefined();
    });

    it('should allow admin to list users, suspend a user, and verify login block', async () => {
      // 1. List users
      const listRes = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);

      const bobUser = listRes.body.data.find((u: any) => u.email === 'bob@mit.edu');
      expect(bobUser).toBeDefined();

      // 2. Suspend Bob
      const suspendRes = await request(app)
        .patch(`/api/v1/admin/users/${bobUser.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Suspended temporarily for code review verification.' });

      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.isSuspended).toBe(true);

      // 3. Attempt login as Bob while suspended -> should be 403 Forbidden
      const loginAttempt = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'bob@mit.edu', password: 'password123' });

      expect(loginAttempt.status).toBe(403);
      expect(loginAttempt.body.message).toContain('Account suspended');

      // 4. Restore Bob
      const restoreRes = await request(app)
        .patch(`/api/v1/admin/users/${bobUser.id}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.isSuspended).toBe(false);

      // 5. Verify Bob can login again
      const loginAgain = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'bob@mit.edu', password: 'password123' });

      expect(loginAgain.status).toBe(200);
    });

    it('should allow admin to moderate projects (remove and restore)', async () => {
      // 1. Remove project
      const remRes = await request(app)
        .patch(`/api/v1/admin/projects/${aerorouteProjectId}/remove`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Flagged for content review' });

      expect(remRes.status).toBe(200);
      expect(remRes.body.data.isRemoved).toBe(true);

      // 2. Restore project
      const restRes = await request(app)
        .patch(`/api/v1/admin/projects/${aerorouteProjectId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(restRes.status).toBe(200);
      expect(restRes.body.data.isRemoved).toBe(false);
    });

    it('should allow admin to manage technical taxonomy (skills & categories)', async () => {
      // 1. Create skill
      const skillRes = await request(app)
        .post('/api/v1/admin/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'WebAssembly (Wasm)', category: 'Systems' });

      expect(skillRes.status).toBe(201);
      expect(skillRes.body.data.name).toBe('WebAssembly (Wasm)');
      testSkillId = skillRes.body.data.id;

      // 2. Create category
      const catRes = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Quantum & Cryptography', description: 'Quantum computing and applied cryptography' });

      expect(catRes.status).toBe(201);
      expect(catRes.body.data.name).toBe('Quantum & Cryptography');
      testCategoryId = catRes.body.data.id;

      // Clean up
      await request(app).delete(`/api/v1/admin/skills/${testSkillId}`).set('Authorization', `Bearer ${adminToken}`);
      await request(app).delete(`/api/v1/admin/categories/${testCategoryId}`).set('Authorization', `Bearer ${adminToken}`);
    });

    it('should allow admin to retrieve and update global system settings', async () => {
      const getRes = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(Array.isArray(getRes.body.data)).toBe(true);

      const putRes = await request(app)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'ENABLE_AI_DECOMPOSITION',
          value: 'true',
          description: 'Autonomous AI decomposition for cross-college project specs',
          category: 'AI',
        });

      expect(putRes.status).toBe(200);
      expect(putRes.body.data.key).toBe('ENABLE_AI_DECOMPOSITION');
      expect(putRes.body.data.value).toBe('true');
    });
  });

  describe('11. Multi-College Hierarchy & Visibility Suite', () => {
    let testUnivId: string;
    let testCollegeId: string;
    let testDeptId: string;
    let testCourseId: string;
    let sameCollegeProjectId: string;
    let selectedCollegesProjectId: string;

    it('should allow public/students to query universities, colleges, departments, and courses without hardcoded frontend data', async () => {
      // 1. List universities
      const univRes = await request(app).get('/api/v1/colleges/meta/universities');
      expect(univRes.status).toBe(200);
      expect(univRes.body.success).toBe(true);
      expect(Array.isArray(univRes.body.data)).toBe(true);
      expect(univRes.body.data.length).toBeGreaterThan(0);

      // 2. List colleges
      const colRes = await request(app).get('/api/v1/colleges');
      expect(colRes.status).toBe(200);
      expect(colRes.body.success).toBe(true);
      expect(Array.isArray(colRes.body.data)).toBe(true);
      const stanford = colRes.body.data.find((c: any) => c.domain === 'stanford.edu');
      expect(stanford).toBeDefined();

      // 3. Get single college with departments
      const stanfordDetails = await request(app).get(`/api/v1/colleges/${stanford.id}`);
      expect(stanfordDetails.status).toBe(200);
      expect(stanfordDetails.body.data.departments).toBeDefined();

      // 4. List departments under college
      const deptsRes = await request(app).get(`/api/v1/colleges/${stanford.id}/departments`);
      expect(deptsRes.status).toBe(200);
      expect(deptsRes.body.data.length).toBeGreaterThan(0);
      const csDept = deptsRes.body.data[0];

      // 5. List courses under department
      const coursesRes = await request(app).get(`/api/v1/colleges/departments/${csDept.id}/courses`);
      expect(coursesRes.status).toBe(200);
      expect(coursesRes.body.data.length).toBeGreaterThan(0);
    });

    it('should allow admin to manage the academic directory (University -> College -> Department -> Course)', async () => {
      const stamp = Date.now();
      // 1. Create University
      const univRes = await request(app)
        .post('/api/v1/colleges/admin/universities')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: `Oxford University System (${stamp})`,
          shortName: 'Oxford',
          website: 'https://ox.ac.uk',
          country: 'United Kingdom',
        });
      expect(univRes.status).toBe(201);
      testUnivId = univRes.body.data.id;

      // 2. Create College under University
      const colRes = await request(app)
        .post('/api/v1/colleges/admin/colleges')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: `Balliol College, Oxford (${stamp})`,
          domain: `balliol-${stamp}.ox.ac.uk`,
          city: 'Oxford',
          country: 'United Kingdom',
          universityId: testUnivId,
        });
      expect(colRes.status).toBe(201);
      testCollegeId = colRes.body.data.id;

      // 3. Create Department under College
      const deptRes = await request(app)
        .post('/api/v1/colleges/admin/departments')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: 'Department of Computer Science',
          code: 'OX-CS',
          collegeId: testCollegeId,
        });
      expect(deptRes.status).toBe(201);
      testDeptId = deptRes.body.data.id;

      // 4. Create Course under Department
      const courseRes = await request(app)
        .post('/api/v1/colleges/admin/courses')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          name: 'M.Sc. Advanced Computer Science',
          code: 'CS-MSC',
          degreeLevel: 'GRADUATE',
          departmentId: testDeptId,
        });
      expect(courseRes.status).toBe(201);
      testCourseId = courseRes.body.data.id;

      // 5. Verify student cannot manage directory (403 Forbidden)
      const studentAttempt = await request(app)
        .post('/api/v1/colleges/admin/universities')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ name: 'Unauthorized University' });
      expect(studentAttempt.status).toBe(403);
    });

    it('should enforce Project Visibility: Same college restriction', async () => {
      // Alice (Stanford) creates a SAME_COLLEGE restricted project
      const projRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${aliceToken}`) // Alice
        .send({
          title: 'Stanford Campus Solar Vehicle Telemetry',
          publicTeaser: 'Proprietary telemetry logging for Stanford Solar Car Project on campus.',
          domain: 'Hardware & IoT',
          difficulty: 'INTERMEDIATE',
          duration: '6 weeks',
          teamSize: 3,
          collegeVisibility: 'SAME_COLLEGE',
          roles: [
            {
              title: 'Firmware Telemetry Engineer',
              description: 'Embedded CAN-bus data logger',
              requiredSkills: [{ skillName: 'Embedded C++', category: 'Hardware & IoT', minLevel: 4, isCritical: true }],
            },
          ],
        });

      expect(projRes.status).toBe(201);
      sameCollegeProjectId = projRes.body.data.id;

      // 1. Another Stanford student listing projects -> can see it
      const stanfordPeerEmail = `stanford_peer_${Date.now()}@stanford.edu`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: stanfordPeerEmail,
          password: 'password123',
          name: 'Stanford Peer',
          collegeDomain: 'stanford.edu',
        });
      const stanfordPeerUser = await prisma.user.findUnique({ where: { email: stanfordPeerEmail } });
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ email: stanfordPeerEmail, code: stanfordPeerUser!.verificationCode });
      const stanfordPeerToken = verifyRes.body.data.tokens.accessToken;

      const stanfordPeerList = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${stanfordPeerToken}`);
      const stanfordPeerFound = stanfordPeerList.body.data.find((p: any) => p.id === sameCollegeProjectId);
      expect(stanfordPeerFound).toBeDefined();

      // Alice (creator) MUST NOT see her own project in Explore Projects (Strict separation)
      const aliceList = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${aliceToken}`);
      const aliceFound = aliceList.body.data.find((p: any) => p.id === sameCollegeProjectId);
      expect(aliceFound).toBeUndefined();

      // Alice (creator) DOES see her own project in My Projects (/projects/user/created)
      const aliceCreated = await request(app)
        .get('/api/v1/projects/user/created')
        .set('Authorization', `Bearer ${aliceToken}`);
      const aliceCreatedFound = aliceCreated.body.data.find((p: any) => p.id === sameCollegeProjectId);
      expect(aliceCreatedFound).toBeDefined();

      // 2. Bob (MIT) listing projects -> CANNOT see same-college restricted project from Stanford
      const bobList = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${bobToken}`);
      const bobFound = bobList.body.data.find((p: any) => p.id === sameCollegeProjectId);
      expect(bobFound).toBeUndefined();
    });

    it('should enforce Project Visibility: Selected colleges restriction', async () => {
      // Alice (Stanford) creates a project visible ONLY to MIT (Bob's college) and Stanford
      const colRes = await request(app).get('/api/v1/colleges');
      const mitCol = colRes.body.data.find((c: any) => c.domain === 'mit.edu');

      const projRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          title: 'Stanford-MIT Quantum Simulators',
          publicTeaser: 'Joint quantum Hamiltonian simulation benchmark across Stanford and MIT clusters.',
          domain: 'Distributed Systems',
          difficulty: 'ADVANCED',
          duration: '10 weeks',
          teamSize: 4,
          collegeVisibility: 'SELECTED_COLLEGES',
          selectedColleges: [mitCol.id],
          roles: [
            {
              title: 'Distributed Compute Engineer',
              description: 'MPI & OpenMP kernel distributor',
              requiredSkills: [{ skillName: 'Python', category: 'Backend', minLevel: 4, isCritical: true }],
            },
          ],
        });

      expect(projRes.status).toBe(201);
      selectedCollegesProjectId = projRes.body.data.id;

      // 1. Bob (MIT) -> IS in selected colleges list -> CAN see it
      const bobList = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${bobToken}`);
      const bobFound = bobList.body.data.find((p: any) => p.id === selectedCollegesProjectId);
      expect(bobFound).toBeDefined();

      // 2. Clean up test entities
      await request(app).delete(`/api/v1/colleges/admin/courses/${testCourseId}`).set('Authorization', `Bearer ${aliceToken}`);
      await request(app).delete(`/api/v1/colleges/admin/departments/${testDeptId}`).set('Authorization', `Bearer ${aliceToken}`);
      await request(app).delete(`/api/v1/colleges/admin/colleges/${testCollegeId}`).set('Authorization', `Bearer ${aliceToken}`);
      await request(app).delete(`/api/v1/colleges/admin/universities/${testUnivId}`).set('Authorization', `Bearer ${aliceToken}`);
    });
  });

  // =========================================================================
  // 12. OPTIONAL GITHUB INTEGRATION & EVIDENCE-CONFIDENCE SYSTEM SUITE
  // =========================================================================
  describe('12. Optional GitHub Integration & Evidence-Confidence System Suite', () => {
    it('should allow student to connect GitHub handle or profile URL and sync evidence', async () => {
      // 1. Connect GitHub
      const res = await request(app)
        .post('/api/v1/users/me/github')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          githubUrlOrUsername: 'https://github.com/alicechen-ai-engineer',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.username).toBe('alicechen-ai-engineer');
      expect(res.body.data.profileUrl).toContain('github.com/alicechen-ai-engineer');
    }, 15000);

    it('should retrieve public repositories, languages, and project links from GitHub endpoint', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${aliceUserId}/github`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('alicechen-ai-engineer');
      expect(res.body.data.profileUrl).toBe('https://github.com/alicechen-ai-engineer');
      expect(Array.isArray(res.body.data.repositories)).toBe(true);
      expect(Array.isArray(res.body.data.languages)).toBe(true);
    });

    it('should calculate Evidence Confidence score and NEVER automatically mark skill as Verified', async () => {
      // 1. Add PyTorch skill with GitHub repo evidence
      await request(app)
        .post('/api/v1/users/me/skills')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          skillName: 'PyTorch Deep Learning',
          category: 'AI/ML',
          proficiency: 5,
          evidenceType: 'GITHUB_PROJECT',
          evidenceTitle: 'Graph Transformer PyTorch Library',
          evidenceUrl: 'https://github.com/alicechen-ai-engineer/pytorch-gnn',
          evidenceSummary: 'Custom message passing CUDA kernel for molecular property prediction.',
        });

      // 2. Fetch Evidence Confidence Breakdown
      const confRes = await request(app)
        .get(`/api/v1/users/${aliceUserId}/evidence-confidence`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(confRes.status).toBe(200);
      expect(confRes.body.success).toBe(true);
      const pytorchSkill = confRes.body.data.find((s: any) => s.skillName.includes('PyTorch'));
      expect(pytorchSkill).toBeDefined();

      // Confidence score should be calculated (e.g. 65-90%)
      expect(pytorchSkill.evidenceConfidence).toBeGreaterThan(50);
      expect(pytorchSkill.verificationStatus).toBe('EVIDENCE_SUPPORTED');
      // STRICT REQUIREMENT: "Do not automatically label someone 'verified' simply because they have GitHub"
      expect(pytorchSkill.isVerified).toBe(false);
      expect(pytorchSkill.confidenceRationale).toContain('evidence');
    });

    it('should gracefully fall back to a profile URL when GitHub API is unavailable', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/github')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          githubUrlOrUsername: 'github.com/bob-mit-robotics-builder',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('bob-mit-robotics-builder');
      expect(res.body.data.profileUrl).toBe('https://github.com/bob-mit-robotics-builder');
      // Graceful fallback returns without failing
      expect(res.body.data.isLiveSync).toBeDefined();
    });

    it('should allow student to disconnect GitHub integration', async () => {
      const res = await request(app)
        .delete('/api/v1/users/me/github')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('disconnected');
    });
  });

  // =========================================================================
  // 13. COMPREHENSIVE SECURITY PASS & ACCESS CONTROL SUITE
  // =========================================================================
  describe('13. Comprehensive Security Pass & Access Control Suite', () => {
    let strangerToken: string;
    let strangerUserId: string;

    beforeAll(async () => {
      const email = `stranger_${Date.now()}@cmu.edu`;
      await prisma.user.deleteMany({ where: { email: { contains: 'stranger' } } });

      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Password123!',
          name: 'Stranger Builder',
          collegeDomain: 'cmu.edu',
          graduationYear: 2027,
          course: 'B.S. Robotics',
        });
      
      const user = await prisma.user.findUnique({ where: { email } });
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({
          email,
          code: user?.verificationCode || regRes.body.data?.devCode || '123456',
        });
      strangerToken = verifyRes.body.data.tokens.accessToken;
      strangerUserId = verifyRes.body.data.user.id;
    });

    it('SECURITY: should prevent unauthorized non-members from accessing workspace tasks, files, or milestones (403 Forbidden)', async () => {
      // Stranger tries to access Alice\'s private project workspace
      const overviewRes = await request(app)
        .get(`/api/v1/workspace/projects/${aerorouteProjectId}/overview`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(overviewRes.status).toBe(403);
      expect(overviewRes.body.success).toBe(false);
      expect(overviewRes.body.message).toContain('Forbidden');

      // Stranger tries to list tasks
      const tasksRes = await request(app)
        .get(`/api/v1/workspace/projects/${aerorouteProjectId}/tasks`)
        .set('Authorization', `Bearer ${strangerToken}`);
      expect(tasksRes.status).toBe(403);

      // Stranger tries to inject a task
      const createTaskRes = await request(app)
        .post(`/api/v1/workspace/projects/${aerorouteProjectId}/tasks`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({
          projectId: aerorouteProjectId,
          title: 'Unauthorized Injected Task',
          priority: 'URGENT',
        });
      expect(createTaskRes.status).toBe(403);

      // Stranger tries to list private files
      const filesRes = await request(app)
        .get(`/api/v1/workspace/projects/${aerorouteProjectId}/files`)
        .set('Authorization', `Bearer ${strangerToken}`);
      expect(filesRes.status).toBe(403);
    });

    it('SECURITY: should prevent unauthorized users from viewing internal project health diagnostics (403 Forbidden)', async () => {
      const healthRes = await request(app)
        .get(`/api/v1/health/projects/${aerorouteProjectId}/health`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(healthRes.status).toBe(403);
      expect(healthRes.body.success).toBe(false);
      expect(healthRes.body.message).toContain('Forbidden');
    });

    it('SECURITY: should enforce Progressive Disclosure Level 1 and never leak private IP/repo to non-members or applicants', async () => {
      // 1. Stranger queries project details -> Level 1 Public Safe Listing only
      const projRes = await request(app)
        .get(`/api/v1/projects/${aerorouteProjectId}`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(projRes.status).toBe(200);
      expect(projRes.body.data.disclosureLevel).toBe(1);
      expect(projRes.body.data.privateRepoUrl).toBeUndefined();
      expect(projRes.body.data.privateNotes).toBeUndefined();
      expect(projRes.body.data.architectureSpec).toBeUndefined();
      expect(projRes.body.data.technicalApproach).toBeUndefined();
      expect(projRes.body.data.problemStatement).toBeUndefined(); // Level 1 hides problem statement
    });

    it('SECURITY: should prevent unauthorized access to private direct conversations (403 Forbidden)', async () => {
      // 1. Alice & Bob conversation
      const convRes = await request(app)
        .post('/api/v1/messages/direct')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          recipientId: bobUserId,
          initialMessage: 'Confidential project discussion',
        });
      const convId = convRes.body.data.id;

      // 2. Stranger attempts to eavesdrop on conversation messages
      const eavesdropRes = await request(app)
        .get(`/api/v1/messages/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(eavesdropRes.status).toBe(403);
      expect(eavesdropRes.body.success).toBe(false);
      expect(eavesdropRes.body.message).toContain('Forbidden');
    });

    it('SECURITY: should strictly block malicious/executable file uploads and prevent path traversal', async () => {
      const { StorageService } = require('../src/services/storage.service');
      
      // 1. Dangerous executable extension check
      expect(() => {
        StorageService.validateFile('malware.exe', 1024);
      }).toThrow('blocked for security reasons');

      expect(() => {
        StorageService.validateFile('exploit.sh', 512);
      }).toThrow('blocked for security reasons');

      expect(() => {
        StorageService.validateFile('shell.php', 256);
      }).toThrow('blocked for security reasons');

      // 2. Size limit check (> 25MB)
      expect(() => {
        StorageService.validateFile('large_model.zip', 30 * 1024 * 1024);
      }).toThrow('exceeds the 25MB limit');

      // 3. Legitimate safe files allowed
      expect(() => {
        StorageService.validateFile('dataset_cleaned.csv', 1024 * 1024);
        StorageService.validateFile('architecture_diagram.png', 500 * 1024);
        StorageService.validateFile('whitepaper.pdf', 2 * 1024 * 1024);
      }).not.toThrow();
    });

    it('SECURITY: should never store or return passwords, reset tokens, or verification codes in plaintext', async () => {
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.password).toBeUndefined();
      expect(meRes.body.data.passwordHash).toBeUndefined();
      expect(meRes.body.data.verificationCode).toBeUndefined();
      expect(meRes.body.data.resetPasswordToken).toBeUndefined();
    });

    it('SECURITY: should reject suspended users from accessing authenticated endpoints (403 Forbidden)', async () => {
      // 1. Admin suspends stranger
      await request(app)
        .patch(`/api/v1/admin/users/${strangerUserId}/suspend`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          reason: 'Security violation test.',
        });

      // 2. Stranger attempts to make an authenticated call -> immediate 403 Forbidden
      const authAttempt = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(authAttempt.status).toBe(403);
      expect(authAttempt.body.message).toContain('suspended');

      // 3. Admin restores stranger
      await request(app)
        .patch(`/api/v1/admin/users/${strangerUserId}/restore`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({});
    });
  });

  describe('14. Role-Specific Application Counting & Member Requirements', () => {
    let testProjectId: string;
    let uiRoleId: string;
    let pythonRoleId: string;
    let htmlRoleId: string;

    it('should create a project with multi-member role requirements (UI/UX: 1, Python: 2, HTML: 1)', async () => {
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          title: 'Autonomous Farm Rover',
          pitch: 'Building a solar-powered agricultural rover with computer vision.',
          publicTeaser: 'Building a solar-powered agricultural rover with computer vision.',
          problemStatement: 'Building a solar-powered agricultural rover with computer vision.',
          domain: 'Robotics & Hardware',
          duration: '8 weeks',
          difficulty: 'INTERMEDIATE',
          teamSize: 5,
          collegeVisibility: 'ALL_COLLEGES',
          roles: [
            {
              title: 'UI/UX Designer',
              description: 'Design dashboard and rover telemetry interface.',
              requiredMembers: 1,
              requiredSkills: [{ skillName: 'Figma', minLevel: 3, category: 'Design', isCritical: true }],
            },
            {
              title: 'Python Developer',
              description: 'Implement computer vision detection and navigation pipelines.',
              requiredMembers: 2,
              requiredSkills: [{ skillName: 'Python', minLevel: 3, category: 'Backend', isCritical: true }],
            },
            {
              title: 'HTML Developer',
              description: 'Build responsive web telemetry views.',
              requiredMembers: 1,
              requiredSkills: [{ skillName: 'HTML', minLevel: 3, category: 'Frontend', isCritical: true }],
            },
          ],
        });

      expect(createRes.status).toBe(201);
      testProjectId = createRes.body.data.id;

      // Fetch project and verify initial counts: 0/1, 0/2, 0/1
      const getRes = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(getRes.status).toBe(200);
      const roles = getRes.body.data.requiredRoles;
      expect(roles).toHaveLength(3);

      const uiRole = roles.find((r: any) => r.title === 'UI/UX Designer');
      const pythonRole = roles.find((r: any) => r.title === 'Python Developer');
      const htmlRole = roles.find((r: any) => r.title === 'HTML Developer');

      expect(uiRole).toBeDefined();
      expect(uiRole.requiredMembers).toBe(1);
      expect(uiRole.applicationCount).toBe(0);

      expect(pythonRole).toBeDefined();
      expect(pythonRole.requiredMembers).toBe(2);
      expect(pythonRole.applicationCount).toBe(0);

      expect(htmlRole).toBeDefined();
      expect(htmlRole.requiredMembers).toBe(1);
      expect(htmlRole.applicationCount).toBe(0);

      uiRoleId = uiRole.id;
      pythonRoleId = pythonRole.id;
      htmlRoleId = htmlRole.id;
    });

    it('should increment role-specific application count when Bob applies for Python Developer (0/2 -> 1/2)', async () => {
      const applyRes = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          projectId: testProjectId,
          projectRoleId: pythonRoleId,
          pitch: 'I have 3 years of experience in Python and computer vision.',
          relevantLinks: ['https://github.com/bob/vision'],
        });

      expect(applyRes.status).toBe(201);

      // Verify counts: UI: 0/1, Python: 1/2, HTML: 0/1
      const getRes = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      const roles = getRes.body.data.requiredRoles;
      const uiRole = roles.find((r: any) => r.id === uiRoleId);
      const pythonRole = roles.find((r: any) => r.id === pythonRoleId);
      const htmlRole = roles.find((r: any) => r.id === htmlRoleId);

      expect(uiRole.applicationCount).toBe(0);
      expect(uiRole.requiredMembers).toBe(1);

      expect(pythonRole.applicationCount).toBe(1);
      expect(pythonRole.requiredMembers).toBe(2);

      expect(htmlRole.applicationCount).toBe(0);
      expect(htmlRole.requiredMembers).toBe(1);
    });

    it('should support uncapped application counts (e.g. 3/2 applications)', async () => {
      // Create student 3
      const e3 = `pydev3_${Date.now()}@berkeley.edu`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: e3,
          password: 'password123',
          name: 'Dev Three',
          collegeDomain: 'berkeley.edu',
        });
      const u3 = await prisma.user.findUnique({ where: { email: e3 } });
      const v3 = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ email: e3, code: u3!.verificationCode });
      const s3Token = v3.body.data.tokens.accessToken;

      // Create student 4
      const e4 = `pydev4_${Date.now()}@cmu.edu`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: e4,
          password: 'password123',
          name: 'Dev Four',
          collegeDomain: 'cmu.edu',
        });
      const u4 = await prisma.user.findUnique({ where: { email: e4 } });
      const v4 = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ email: e4, code: u4!.verificationCode });
      const s4Token = v4.body.data.tokens.accessToken;

      // Dev 3 applies for Python Developer -> 2/2
      await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${s3Token}`)
        .send({
          projectId: testProjectId,
          projectRoleId: pythonRoleId,
          pitch: 'Experienced in PyTorch and OpenCV.',
        });

      // Dev 4 applies for Python Developer -> 3/2 (uncapped!)
      await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${s4Token}`)
        .send({
          projectId: testProjectId,
          projectRoleId: pythonRoleId,
          pitch: 'Built autonomous drones in Python.',
        });

      // Verify uncapped count: Python Developer is 3/2
      const getRes = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      const pythonRole = getRes.body.data.requiredRoles.find((r: any) => r.id === pythonRoleId);
      expect(pythonRole.applicationCount).toBe(3);
      expect(pythonRole.requiredMembers).toBe(2);
    });
  });
});



