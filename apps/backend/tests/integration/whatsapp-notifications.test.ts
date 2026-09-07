import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '@projectx/db';
import {
  WhatsAppService,
  MockWhatsAppProvider,
  MetaWhatsAppProvider,
  NoopWhatsAppProvider,
  WhatsAppProviderFactory,
} from '../../src/services/whatsapp';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const app = createApp();

describe('WhatsApp Notifications Integration & Application System Test Suite', () => {
  let leadToken: string;
  let leadUserId: string;
  let student1Token: string;
  let student1UserId: string;
  let student2Token: string;
  let student2UserId: string;

  let testProjectId: string;
  let pythonRoleId: string;
  let uiuxRoleId: string;
  let htmlRoleId: string;

  beforeAll(async () => {
    // 1. Authenticate Lead (lead@test.com / Test@123)
    const leadRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lead@test.com', password: 'Test@123' });

    expect(leadRes.status).toBe(200);
    leadToken = leadRes.body.data.tokens.accessToken;
    leadUserId = leadRes.body.data.user.id;

    // 2. Authenticate Student 1 (student1@test.com / Test@123)
    const s1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@test.com', password: 'Test@123' });

    expect(s1Res.status).toBe(200);
    student1Token = s1Res.body.data.tokens.accessToken;
    student1UserId = s1Res.body.data.user.id;

    // 3. Authenticate Student 2 (student2@test.com / Test@123)
    const s2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student2@test.com', password: 'Test@123' });

    expect(s2Res.status).toBe(200);
    student2Token = s2Res.body.data.tokens.accessToken;
    student2UserId = s2Res.body.data.user.id;

    // 4. Ensure lead has verified WhatsApp number
    await prisma.user.update({
      where: { id: leadUserId },
      data: {
        whatsappPhoneNumber: '+919876543210',
        whatsappVerified: true,
      },
    });

    // 5. Find AI Student Assistant Project for test isolation
    const project = await prisma.project.findFirst({
      where: { title: 'AI Student Assistant', creatorId: leadUserId },
      include: { requiredRoles: true },
    });

    expect(project).toBeDefined();
    testProjectId = project!.id;

    const python = project!.requiredRoles.find((r) => r.title === 'Python Developer');
    const uiux = project!.requiredRoles.find((r) => r.title === 'UI/UX Designer');
    const html = project!.requiredRoles.find((r) => r.title === 'HTML Developer');

    expect(python).toBeDefined();
    expect(uiux).toBeDefined();
    expect(html).toBeDefined();

    pythonRoleId = python!.id;
    uiuxRoleId = uiux!.id;
    htmlRoleId = html!.id;
  });

  beforeEach(async () => {
    // Reset WhatsApp mocks and logs for clean test isolation
    MockWhatsAppProvider.clear();
    WhatsAppProviderFactory.setCustomProvider(null);

    // Clean prior applications and WhatsApp logs on the test project
    await prisma.whatsAppNotificationLog.deleteMany({
      where: { projectId: testProjectId },
    });
    await prisma.application.deleteMany({
      where: { projectId: testProjectId },
    });
  });

  afterAll(async () => {
    WhatsAppProviderFactory.setCustomProvider(null);
  });

  // =========================================================================
  // TEST 1: Student submits application -> application is saved in DB
  // =========================================================================
  it('1. Student submits application -> application is saved successfully in database', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        projectId: testProjectId,
        projectRoleId: pythonRoleId,
        pitch: 'I have 2 years of experience with Python and FastAPI.',
        relevantSkills: ['Python', 'FastAPI', 'PostgreSQL'],
        availability: '15 hrs/week',
        experience: '2 projects',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();

    // Verify database record
    const saved = await prisma.application.findUnique({
      where: { id: res.body.data.id },
    });
    expect(saved).not.toBeNull();
    expect(saved!.applicantId).toBe(student1UserId);
    expect(saved!.projectId).toBe(testProjectId);
    expect(saved!.projectRoleId).toBe(pythonRoleId);
    expect(saved!.status).toBe('PENDING');
  });

  // =========================================================================
  // TEST 2: Correct Project Lead is identified
  // =========================================================================
  it('2. Correct Project Lead is identified as the recipient of the notification', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        projectId: testProjectId,
        projectRoleId: pythonRoleId,
        pitch: 'Passionate Python student builder.',
      });

    expect(res.status).toBe(201);
    const appId = res.body.data.id;

    // Check delivery log
    const waLog = await prisma.whatsAppNotificationLog.findUnique({
      where: { applicationId: appId },
    });
    expect(waLog).not.toBeNull();
    expect(waLog!.recipientId).toBe(leadUserId);
    expect(waLog!.projectId).toBe(testProjectId);
  });

  // =========================================================================
  // TEST 3: Correct WhatsApp number is selected
  // =========================================================================
  it("3. Correct WhatsApp number is selected from the Project Lead's profile data", async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        projectId: testProjectId,
        projectRoleId: pythonRoleId,
        pitch: 'Python developer application.',
      });

    expect(res.status).toBe(201);
    const appId = res.body.data.id;

    const waLog = await prisma.whatsAppNotificationLog.findUnique({
      where: { applicationId: appId },
    });
    expect(waLog).not.toBeNull();
    expect(waLog!.phoneNumber).toBe('+919876543210');

    const sent = MockWhatsAppProvider.getLastMessage();
    expect(sent).toBeDefined();
    expect(sent!.to).toBe('+919876543210');
  });

  // =========================================================================
  // TEST 4: WhatsApp notification is triggered with required template format
  // =========================================================================
  it('4. WhatsApp notification is triggered with the exact requested message format and basic details', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        projectId: testProjectId,
        projectRoleId: pythonRoleId,
        pitch: 'Excited to contribute to AI Student Assistant.',
      });

    expect(res.status).toBe(201);

    const sent = MockWhatsAppProvider.getLastMessage();
    expect(sent).toBeDefined();
    expect(sent!.to).toBe('+919876543210');

    // Verify format and non-exposure of private keys
    const body = sent!.bodyText;
    expect(body).toContain('New Project Application');
    expect(body).toContain('Vivek Jadhav has applied to your project:');
    expect(body).toContain('AI Student Assistant');
    expect(body).toContain('Role: Python Developer');
    expect(body).toContain('College: Sanjivani University');
    expect(body).toContain('Open ProjectX to view the complete application.');

    // Ensure private/sensitive credentials or tokens are NOT included
    expect(body).not.toContain('password');
    expect(body).not.toContain('secret');
    expect(body).not.toContain('token');
  });

  // =========================================================================
  // TEST 5: WhatsApp failure does NOT fail the application submission
  // =========================================================================
  it('5. WhatsApp failure does NOT fail the student application submission (error resilience)', async () => {
    // Simulate WhatsApp provider network crash
    MockWhatsAppProvider.setSimulateFailure(true, 'Meta WhatsApp Gateway 503 Service Unavailable');

    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        projectId: testProjectId,
        projectRoleId: pythonRoleId,
        pitch: 'Applying during simulated WhatsApp outage.',
      });

    // Application MUST still succeed with 201 Created!
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const appId = res.body.data.id;

    // Verify application is still saved in DB
    const saved = await prisma.application.findUnique({
      where: { id: appId },
    });
    expect(saved).not.toBeNull();
    expect(saved!.status).toBe('PENDING');

    // Verify failure is captured in WhatsApp delivery log
    const waLog = await prisma.whatsAppNotificationLog.findUnique({
      where: { applicationId: appId },
    });
    expect(waLog).not.toBeNull();
    expect(waLog!.status).toBe('FAILED');
    expect(waLog!.errorMessage).toContain('Meta WhatsApp Gateway 503');
  });

  // =========================================================================
  // TEST 6: Missing WhatsApp number does NOT fail the application
  // =========================================================================
  it('6. Missing WhatsApp number on Project Lead does NOT fail the application', async () => {
    // Temporarily clear lead WhatsApp phone number
    await prisma.user.update({
      where: { id: leadUserId },
      data: { whatsappPhoneNumber: null, whatsappVerified: false },
    });

    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        projectId: testProjectId,
        projectRoleId: pythonRoleId,
        pitch: 'Applying when lead has no phone configured.',
      });

    // Restore lead phone number for subsequent tests
    await prisma.user.update({
      where: { id: leadUserId },
      data: { whatsappPhoneNumber: '+919876543210', whatsappVerified: true },
    });

    // Application MUST still succeed
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const appId = res.body.data.id;
    const waLog = await prisma.whatsAppNotificationLog.findUnique({
      where: { applicationId: appId },
    });
    expect(waLog).not.toBeNull();
    expect(waLog!.status).toBe('NO_PHONE');
  });

  // =========================================================================
  // TEST 7: Missing WhatsApp configuration does NOT fail the application
  // =========================================================================
  it('7. Missing WhatsApp provider configuration does NOT fail the application', async () => {
    // Inject unconfigured Noop provider
    WhatsAppProviderFactory.setCustomProvider(new NoopWhatsAppProvider());

    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        projectId: testProjectId,
        projectRoleId: pythonRoleId,
        pitch: 'Applying when provider is unconfigured.',
      });

    WhatsAppProviderFactory.setCustomProvider(null);

    // Application MUST still succeed
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const appId = res.body.data.id;
    const waLog = await prisma.whatsAppNotificationLog.findUnique({
      where: { applicationId: appId },
    });
    expect(waLog).not.toBeNull();
    expect(waLog!.status).toBe('NOT_CONFIGURED');
  });

  // =========================================================================
  // TEST 8: Duplicate request / Idempotency prevents duplicate notifications
  // =========================================================================
  it('8. Duplicate notification trigger for the same application ID is idempotent and does not resend', async () => {
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        projectId: testProjectId,
        projectRoleId: pythonRoleId,
        pitch: 'First application submission.',
      });

    expect(res.status).toBe(201);
    const appId = res.body.data.id;

    // Verify 1 notification sent
    expect(MockWhatsAppProvider.getSentMessages().length).toBe(1);

    // Directly re-trigger notification service with same application ID (simulating background retry / webhook)
    const retryResult = await WhatsAppService.sendApplicationNotification({
      applicationId: appId,
      projectId: testProjectId,
      projectTitle: 'AI Student Assistant',
      projectCreatorId: leadUserId,
      roleTitle: 'Python Developer',
      applicant: {
        id: student1UserId,
        name: 'Student 1',
        collegeName: 'MIT',
      },
    });

    expect(retryResult.status).toBe('ALREADY_SENT');
    // Ensure no second WhatsApp message was dispatched
    expect(MockWhatsAppProvider.getSentMessages().length).toBe(1);
  });

  // =========================================================================
  // TEST 9: Security - A student cannot cause WhatsApp message to be sent to arbitrary number
  // =========================================================================
  it('9. Security: Recipient is derived strictly from project ownership; client cannot override destination number', async () => {
    // Attempt to inject an arbitrary recipient phone number in the application payload
    const res = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        projectId: testProjectId,
        projectRoleId: pythonRoleId,
        pitch: 'Trying to inject arbitrary phone.',
        recipientPhoneNumber: '+19998887777', // Malicious attempt to spoof recipient
        targetPhone: '+19998887777',
      });

    expect(res.status).toBe(201);
    const appId = res.body.data.id;

    // Verify that the notification was delivered ONLY to the verified Project Lead (+919876543210)
    const sent = MockWhatsAppProvider.getLastMessage();
    expect(sent).toBeDefined();
    expect(sent!.to).toBe('+919876543210');
    expect(sent!.to).not.toBe('+19998887777');

    const waLog = await prisma.whatsAppNotificationLog.findUnique({
      where: { applicationId: appId },
    });
    expect(waLog!.phoneNumber).toBe('+919876543210');
  });

  // =========================================================================
  // TEST 10: Meta Cloud API Provider implementation unit verification
  // =========================================================================
  it('10. MetaWhatsAppProvider constructs official Cloud API payload, headers, and cleans phone format', async () => {
    const metaProvider = new MetaWhatsAppProvider({
      accessToken: 'test-meta-cloud-token-12345',
      phoneNumberId: '109876543210',
    });

    // Mock successful Meta Graph API response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        messaging_product: 'whatsapp',
        contacts: [{ input: '919876543210', wa_id: '919876543210' }],
        messages: [{ id: 'wamid.HBgNNzk4NzY1NDMyMTAVAgARGBI0MTU3...' }],
      },
    });

    const result = await metaProvider.sendMessage({
      to: '+91 (987) 654-3210', // Raw formatted international string
      bodyText: 'Test message for Meta Cloud API',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('SENT');
    expect(result.provider).toBe('meta');
    expect(result.messageId).toContain('wamid.');

    // Verify axios call structure
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/messages'),
      expect.objectContaining({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '919876543210', // Clean digits without + or symbols
        type: 'text',
        text: {
          preview_url: false,
          body: 'Test message for Meta Cloud API',
        },
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer '),
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});
