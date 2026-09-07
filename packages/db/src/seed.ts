import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEMO_PROJECTS } from './demoProjectsData';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ProjectX database seed...');

  // 1. Clear existing data
  await prisma.systemSetting.deleteMany();
  await prisma.skillCategory.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.report.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.whatsAppNotificationLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.application.deleteMany();
  await prisma.projectRequiredSkill.deleteMany();
  await prisma.projectRole.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.projectSelectedCollege.deleteMany();
  await prisma.projectFile.deleteMany();
  await prisma.project.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.studentExperience.deleteMany();
  await prisma.studentHackathon.deleteMany();
  await prisma.studentPastProject.deleteMany();
  await prisma.user.deleteMany();
  await prisma.course.deleteMany();
  await prisma.department.deleteMany();
  await prisma.college.deleteMany();
  await prisma.university.deleteMany();
  await prisma.skill.deleteMany();

  // 2. Seed Universities (Parent Educational Institutions / Systems)
  const sanjivaniUniv = await prisma.university.create({
    data: {
      name: 'Sanjivani University System',
      shortName: 'Sanjivani',
      website: 'https://sanjivani.edu.in',
      country: 'India',
      logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&auto=format&fit=crop&q=80',
    },
  });

  const stanfordUniv = await prisma.university.create({
    data: {
      name: 'Stanford University System',
      shortName: 'Stanford',
      website: 'https://stanford.edu',
      country: 'United States',
      logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&auto=format&fit=crop&q=80',
    },
  });

  const mitUniv = await prisma.university.create({
    data: {
      name: 'Massachusetts Institute of Technology System',
      shortName: 'MIT',
      website: 'https://mit.edu',
      country: 'United States',
      logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&auto=format&fit=crop&q=80',
    },
  });

  const iitUniv = await prisma.university.create({
    data: {
      name: 'Indian Institutes of Technology System',
      shortName: 'IIT System',
      website: 'https://iitb.ac.in',
      country: 'India',
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&auto=format&fit=crop&q=80',
    },
  });

  const ucUniv = await prisma.university.create({
    data: {
      name: 'University of California System',
      shortName: 'UC System',
      website: 'https://universityofcalifornia.edu',
      country: 'United States',
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=128&auto=format&fit=crop&q=80',
    },
  });

  const cmuUniv = await prisma.university.create({
    data: {
      name: 'Carnegie Mellon University System',
      shortName: 'CMU',
      website: 'https://cmu.edu',
      country: 'United States',
      logoUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=128&auto=format&fit=crop&q=80',
    },
  });

  const waterlooUniv = await prisma.university.create({
    data: {
      name: 'University of Waterloo System',
      shortName: 'Waterloo',
      website: 'https://uwaterloo.ca',
      country: 'Canada',
      logoUrl: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=128&auto=format&fit=crop&q=80',
    },
  });

  // 3. Seed Colleges (Campuses / Constituent Schools)
  const sanjivani = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'sanjivani.edu.in',
      city: 'Kopargaon, MH',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&auto=format&fit=crop&q=80',
    },
  });

  const stanford = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'stanford.edu',
      city: 'Stanford, CA',
      country: 'United States',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&auto=format&fit=crop&q=80',
    },
  });

  const mit = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'mit.edu',
      city: 'Cambridge, MA',
      country: 'United States',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&auto=format&fit=crop&q=80',
    },
  });

  const iitb = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'iitb.ac.in',
      city: 'Mumbai',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&auto=format&fit=crop&q=80',
    },
  });

  const berkeley = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'berkeley.edu',
      city: 'Berkeley, CA',
      country: 'United States',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=128&auto=format&fit=crop&q=80',
    },
  });

  const cmu = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'cmu.edu',
      city: 'Pittsburgh, PA',
      country: 'United States',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=128&auto=format&fit=crop&q=80',
    },
  });

  const waterloo = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'uwaterloo.ca',
      city: 'Waterloo, ON',
      country: 'Canada',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=128&auto=format&fit=crop&q=80',
    },
  });

  const iitDelhi = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'iitd.ac.in',
      city: 'New Delhi',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&auto=format&fit=crop&q=80',
    },
  });

  const nitTrichy = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'nitt.edu',
      city: 'Tiruchirappalli',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&auto=format&fit=crop&q=80',
    },
  });

  const nitWarangal = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'nitw.ac.in',
      city: 'Warangal',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&auto=format&fit=crop&q=80',
    },
  });

  const bitsPilani = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'pilani.bits-pilani.ac.in',
      city: 'Pilani',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=128&auto=format&fit=crop&q=80',
    },
  });

  const vitVellore = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'vit.ac.in',
      city: 'Vellore',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=128&auto=format&fit=crop&q=80',
    },
  });

  const dtu = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'dtu.ac.in',
      city: 'Delhi',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=128&auto=format&fit=crop&q=80',
    },
  });

  const pesUniv = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'pes.edu',
      city: 'Bengaluru',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&auto=format&fit=crop&q=80',
    },
  });

  const manipal = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'manipal.edu',
      city: 'Manipal',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&auto=format&fit=crop&q=80',
    },
  });

  const annaUniv = await prisma.college.create({
    data: {
      name: 'Sanjivani University',
      domain: 'annauniv.edu',
      city: 'Chennai',
      country: 'India',
      universityId: sanjivaniUniv.id,
      logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=128&auto=format&fit=crop&q=80',
    },
  });

  // 4. Seed Departments under Colleges
  const sanjivaniCS = await prisma.department.create({
    data: {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      collegeId: sanjivani.id,
    },
  });

  const stanfordCS = await prisma.department.create({
    data: {
      name: 'Computer Science',
      code: 'CS',
      collegeId: stanford.id,
    },
  });

  const mitEECS = await prisma.department.create({
    data: {
      name: 'Electrical Engineering & Computer Science',
      code: 'EECS',
      collegeId: mit.id,
    },
  });

  const iitbEE = await prisma.department.create({
    data: {
      name: 'Electrical Engineering & Robotics',
      code: 'EE',
      collegeId: iitb.id,
    },
  });

  const berkeleyEECS = await prisma.department.create({
    data: {
      name: 'Electrical Engineering & Computer Sciences',
      code: 'EECS',
      collegeId: berkeley.id,
    },
  });

  // 5. Seed Courses under Departments
  const sanjivaniBTech = await prisma.course.create({
    data: {
      name: 'B.Tech Computer Science & AI',
      code: 'CSE-AI',
      degreeLevel: 'UNDERGRADUATE',
      departmentId: sanjivaniCS.id,
    },
  });

  const stanfordBSCS = await prisma.course.create({
    data: {
      name: 'B.S. Computer Science (AI & HCI)',
      code: 'CS-BS',
      degreeLevel: 'UNDERGRADUATE',
      departmentId: stanfordCS.id,
    },
  });

  const mitMSEECS = await prisma.course.create({
    data: {
      name: 'M.S. EECS (AI & Optimization)',
      code: 'EECS-MS',
      degreeLevel: 'GRADUATE',
      departmentId: mitEECS.id,
    },
  });

  const iitbBTech = await prisma.course.create({
    data: {
      name: 'B.Tech Electrical Engineering & Minor in CS',
      code: 'EE-BTECH',
      degreeLevel: 'UNDERGRADUATE',
      departmentId: iitbEE.id,
    },
  });

  console.log('✅ Seeded Multi-College Hierarchy: Universities, Colleges, Departments, and Courses.');

  // 3. Seed Skills
  const skillsData = [
    { name: 'React', category: 'Frontend' },
    { name: 'TypeScript', category: 'Frontend' },
    { name: 'Tailwind CSS', category: 'Frontend' },
    { name: 'Next.js', category: 'Frontend' },
    { name: 'Vue.js', category: 'Frontend' },
    { name: 'HTML & CSS', category: 'Frontend' },
    { name: 'Flutter', category: 'Mobile' },
    { name: 'React Native', category: 'Mobile' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Python', category: 'Backend' },
    { name: 'FastAPI', category: 'Backend' },
    { name: 'Go', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Backend' },
    { name: 'MongoDB', category: 'Backend' },
    { name: 'Socket.IO', category: 'Backend' },
    { name: 'PyTorch', category: 'AI/ML' },
    { name: 'Machine Learning', category: 'AI/ML' },
    { name: 'NLP & Transformers', category: 'AI/ML' },
    { name: 'Computer Vision', category: 'AI/ML' },
    { name: 'OpenCV', category: 'AI/ML' },
    { name: 'Graph Neural Networks', category: 'AI/ML' },
    { name: 'Data Science', category: 'AI/ML' },
    { name: 'LLMs & Prompt Engineering', category: 'AI/ML' },
    { name: 'ROS / Robotics', category: 'Hardware & IoT' },
    { name: 'Embedded C++', category: 'Hardware & IoT' },
    { name: 'Arduino & IoT', category: 'Hardware & IoT' },
    { name: 'Docker & Kubernetes', category: 'DevOps & Cloud' },
    { name: 'AWS / Cloud Architecture', category: 'DevOps & Cloud' },
    { name: 'Firebase', category: 'DevOps & Cloud' },
    { name: 'Cybersecurity & Cryptography', category: 'Security' },
    { name: 'Solidity', category: 'Blockchain' },
    { name: 'Web3.js', category: 'Blockchain' },
    { name: 'Maps API & Geolocation', category: 'Mobile & Web' },
    { name: 'UI/UX Design & Figma', category: 'UI/UX & Design' },
    { name: 'Product Management', category: 'Domain & Research' },
  ];

  const skillMap: Record<string, any> = {};
  for (const s of skillsData) {
    const created = await prisma.skill.create({ data: s });
    skillMap[s.name] = created;
  }
  console.log(`✅ Seeded ${skillsData.length} industry skills.`);

  // 4. Seed Users with passwords ('password123' and 'Test@123')
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const testPasswordHash = await bcrypt.hash('Test@123', 10);

  // Demo Account 1: Project Lead (kapileom27@gmail.com / Test@123)
  const leadUser = await prisma.user.create({
    data: {
      email: 'kapileom27@gmail.com',
      passwordHash: testPasswordHash,
      name: 'Om Kapile',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
      bio: 'Lead Engineer & Project Architect @ Sanjivani University. Passionate about AI-powered productivity platforms, multi-agent systems, and student collaboration.',
      role: 'STUDENT',
      collegeId: sanjivani.id,
      departmentId: sanjivaniCS.id,
      courseId: sanjivaniBTech.id,
      graduationYear: 2026,
      major: 'Computer Science & AI',
      course: 'B.Tech Computer Science & AI',
      weeklyAvailability: '15-20h',
      interests: 'Artificial Intelligence, Web Development, UI/UX, Multi-Agent Systems',
      githubUrl: 'https://github.com/omkapile',
      portfolioUrl: 'https://omkapile.dev',
      linkedinUrl: 'https://linkedin.com/in/omkapile',
      whatsappPhoneNumber: '+919876543210',
      whatsappVerified: true,
      isVerified: true,
    },
  });

  // Demo Account 2: Student 1 (student1@test.com / Test@123)
  const student1 = await prisma.user.create({
    data: {
      email: 'student1@test.com',
      passwordHash: testPasswordHash,
      name: 'Vivek Jadhav',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80',
      bio: 'CS Student @ Sanjivani University focusing on Python, backend development, and fast APIs.',
      role: 'STUDENT',
      collegeId: sanjivani.id,
      departmentId: sanjivaniCS.id,
      courseId: sanjivaniBTech.id,
      graduationYear: 2027,
      major: 'Computer Science & AI',
      course: 'B.Tech Computer Science & AI',
      weeklyAvailability: '15-20h',
      interests: 'Python, Backend APIs, Machine Learning, Fast Data Processing',
      githubUrl: 'https://github.com/vivekjadhav-dev',
      portfolioUrl: 'https://vivekjadhav.dev',
      linkedinUrl: 'https://linkedin.com/in/vivekjadhav',
      whatsappPhoneNumber: '+919876543211',
      whatsappVerified: true,
      isVerified: true,
    },
  });

  // Demo Account 3: Student 2 (student2@test.com / Test@123)
  const student2 = await prisma.user.create({
    data: {
      email: 'student2@test.com',
      passwordHash: testPasswordHash,
      name: 'Student 2',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&auto=format&fit=crop&q=80',
      bio: 'EECS Junior @ Sanjivani University specializing in Python services, cloud deployment, and system architecture.',
      role: 'STUDENT',
      collegeId: berkeley.id,
      departmentId: berkeleyEECS.id,
      graduationYear: 2027,
      major: 'Computer Science',
      course: 'B.S. EECS',
      weeklyAvailability: '10-15h',
      interests: 'Python, Distributed Systems, Cloud Architecture, Databases',
      githubUrl: 'https://github.com/student2-cal',
      portfolioUrl: 'https://student2.dev',
      linkedinUrl: 'https://linkedin.com/in/student2-cal',
      whatsappPhoneNumber: '+919876543212',
      whatsappVerified: true,
      isVerified: true,
    },
  });

  // User 1: Alice Chen (Stanford - Project Creator / Frontend Lead)
  const alice = await prisma.user.create({
    data: {
      email: 'alice@stanford.edu',
      passwordHash: defaultPasswordHash,
      name: 'Alice Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
      bio: 'CS Senior @ Sanjivani University. Building AI-augmented systems and intuitive modern interfaces. Hackathon enthusiast and open-source design engineer.',
      role: 'ADMIN',
      collegeId: stanford.id,
      departmentId: stanfordCS.id,
      courseId: stanfordBSCS.id,
      graduationYear: 2027,
      major: 'Computer Science',
      course: 'B.S. Computer Science (AI & HCI)',
      weeklyAvailability: '15-20h',
      interests: 'UI/UX Design, Multi-Agent Systems, Web3, Creative Coding, Graph Algorithms',
      githubUrl: 'https://github.com/alicechen',
      portfolioUrl: 'https://alicechen.design',
      linkedinUrl: 'https://linkedin.com/in/alicechen-cs',
      isVerified: true,
    },
  });

  // User 2: Bob Miller (MIT - AI & GNN Specialist)
  const bob = await prisma.user.create({
    data: {
      email: 'bob@mit.edu',
      passwordHash: defaultPasswordHash,
      name: 'Bob Miller',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80',
      bio: 'AI Master student @ Sanjivani University. Researching Graph Neural Networks, combinatorial routing optimization, and PyTorch Geometric.',
      role: 'STUDENT',
      collegeId: mit.id,
      departmentId: mitEECS.id,
      courseId: mitMSEECS.id,
      graduationYear: 2026,
      major: 'Artificial Intelligence & Robotics',
      course: 'M.S. EECS (AI & Optimization)',
      weeklyAvailability: '10-15h',
      interests: 'Graph Neural Networks, Combinatorial Optimization, Deep Learning, PyTorch, Autonomous Systems',
      githubUrl: 'https://github.com/bobmiller-ai',
      portfolioUrl: 'https://bobmiller.mit.edu',
      linkedinUrl: 'https://linkedin.com/in/bobmiller-mit',
      isVerified: true,
    },
  });

  // User 3: Rohan Sharma (IIT Bombay - Systems & Embedded)
  const rohan = await prisma.user.create({
    data: {
      email: 'rohan@iitb.ac.in',
      passwordHash: defaultPasswordHash,
      name: 'Rohan Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80',
      bio: 'Electrical & CS Junior @ Sanjivani University. Robotics team hardware lead. C++, ROS2, PX4 flight controllers, low-power telemetry.',
      role: 'STUDENT',
      collegeId: iitb.id,
      departmentId: iitbEE.id,
      courseId: iitbBTech.id,
      graduationYear: 2027,
      major: 'Electrical Engineering & CS',
      course: 'B.Tech Electrical Engineering & Minor in CS',
      weeklyAvailability: '15-20h',
      interests: 'Autonomous Flight, Embedded Systems, ROS2, Robotics Telemetry, Edge Computing',
      githubUrl: 'https://github.com/rohansharma-iitb',
      portfolioUrl: 'https://rohansharma.tech',
      linkedinUrl: 'https://linkedin.com/in/rohan-sharma-iitb',
      isVerified: true,
    },
  });

  // User 4: Clara Rossi (UC Berkeley - Distributed Systems & Backend)
  const clara = await prisma.user.create({
    data: {
      email: 'clara@berkeley.edu',
      passwordHash: defaultPasswordHash,
      name: 'Clara Rossi',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&auto=format&fit=crop&q=80',
      bio: 'CS Junior @ Sanjivani University. Passionate about high-throughput Go backend services, Postgres query optimization, and Raft consensus.',
      role: 'STUDENT',
      collegeId: berkeley.id,
      graduationYear: 2027,
      major: 'Computer Science',
      course: 'B.S. EECS (Distributed Systems)',
      weeklyAvailability: '10-15h',
      interests: 'Distributed Consensus, Raft, High-Throughput Go, Postgres Optimization, Cloud Native',
      githubUrl: 'https://github.com/clararossi',
      portfolioUrl: 'https://clarabuilds.dev',
      linkedinUrl: 'https://linkedin.com/in/clara-rossi-cal',
      isVerified: true,
    },
  });

  // User 5: David Zhang (CMU - Computer Vision & SLAM)
  const david = await prisma.user.create({
    data: {
      email: 'david@cmu.edu',
      passwordHash: defaultPasswordHash,
      name: 'David Zhang',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&auto=format&fit=crop&q=80',
      bio: 'Robotics Institute @ Sanjivani University. Real-time LiDAR odometry, NeRFs, 3D perception for autonomous systems.',
      role: 'STUDENT',
      collegeId: cmu.id,
      graduationYear: 2026,
      major: 'Robotics & Computer Science',
      course: 'M.S. Robotics Perception',
      weeklyAvailability: '10-20h',
      interests: 'Computer Vision, NeRFs, 3D SLAM, Autonomous Perception, Sensor Fusion',
      githubUrl: 'https://github.com/davidzhang-cmu',
      portfolioUrl: 'https://davidzhang.cmu.edu',
      linkedinUrl: 'https://linkedin.com/in/david-zhang-cmu',
      isVerified: true,
    },
  });

  // User 6: Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@projectx.edu',
      passwordHash: defaultPasswordHash,
      name: 'ProjectX Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&auto=format&fit=crop&q=80',
      bio: 'Cross-College Innovation Platform Administrator',
      role: 'ADMIN',
      collegeId: stanford.id,
      isVerified: true,
    },
  });

  console.log('✅ Seeded 9 verified users with profiles (including Demo Accounts: lead@test.com, student1@test.com, student2@test.com).');

  // 5. Attach Skills & Evidence to Users
  // Alice skills (Frontend, UI/UX, TypeScript)
  await prisma.userSkill.createMany({
    data: [
      {
        userId: alice.id,
        skillId: skillMap['React'].id,
        proficiency: 5,
        verificationStatus: 'VERIFIED',
        evidenceType: 'COMPLETED_PROJECT',
        evidenceTitle: 'Stanford HCI Interactive Toolkit',
        evidenceUrl: 'https://github.com/alicechen/react-design-system',
        evidenceSummary: 'Built production UI library with 1.2k GitHub stars, verified via Stanford course capstone.',
        isVerified: true,
      },
      {
        userId: alice.id,
        skillId: skillMap['TypeScript'].id,
        proficiency: 5,
        verificationStatus: 'EVIDENCE_SUPPORTED',
        evidenceType: 'GITHUB_PROJECT',
        evidenceTitle: 'ts-flow State Machine',
        evidenceUrl: 'https://github.com/alicechen/ts-flow',
        evidenceSummary: 'Maintained strict type-safe state machine library with 100% test coverage.',
        isVerified: false,
      },
      {
        userId: alice.id,
        skillId: skillMap['UI/UX Design & Figma'].id,
        proficiency: 4,
        verificationStatus: 'EVIDENCE_SUPPORTED',
        evidenceType: 'PORTFOLIO',
        evidenceTitle: 'TreeHacks 2026 Winner Design System',
        evidenceUrl: 'https://figma.com/@alicechen',
        evidenceSummary: 'Won Best Design at TreeHacks 2026 for healthcare dispatch app.',
        isVerified: false,
      },
      {
        userId: alice.id,
        skillId: skillMap['Tailwind CSS'].id,
        proficiency: 5,
        verificationStatus: 'SELF_DECLARED',
        evidenceSummary: 'Designed clean responsive dark/light interfaces across 8+ projects.',
        isVerified: false,
      },
    ],
  });

  // Bob skills (GNN, PyTorch, Python, FastAPI)
  await prisma.userSkill.createMany({
    data: [
      {
        userId: bob.id,
        skillId: skillMap['PyTorch'].id,
        proficiency: 5,
        verificationStatus: 'VERIFIED',
        evidenceType: 'COMPLETED_PROJECT',
        evidenceTitle: 'MIT CSAIL NeurIPS Workshop Paper',
        evidenceUrl: 'https://github.com/bobmiller-ai/gnn-routing',
        evidenceSummary: 'Authored NeurIPS workshop paper on topological graph embeddings and published PyTorch benchmarks.',
        isVerified: true,
      },
      {
        userId: bob.id,
        skillId: skillMap['Graph Neural Networks'].id,
        proficiency: 5,
        verificationStatus: 'EVIDENCE_SUPPORTED',
        evidenceType: 'GITHUB_PROJECT',
        evidenceTitle: 'PyG Dynamic Routing Dispatcher',
        evidenceUrl: 'https://github.com/bobmiller-ai/pyg-dynamic-dispatch',
        evidenceSummary: 'Benchmark library for dynamic vehicle routing with GNNs and spatial-temporal graphs.',
        isVerified: false,
      },
      {
        userId: bob.id,
        skillId: skillMap['Python'].id,
        proficiency: 5,
        verificationStatus: 'CERTIFICATE',
        evidenceType: 'CERTIFICATE',
        evidenceTitle: 'Advanced Deep Learning Specialization',
        evidenceUrl: 'https://coursera.org/verify/deeplearning-mit',
        evidenceSummary: '8+ years Python developer, NumPy/SciPy contributor with verified certificate.',
        isVerified: false,
      },
      {
        userId: bob.id,
        skillId: skillMap['FastAPI'].id,
        proficiency: 4,
        verificationStatus: 'SELF_DECLARED',
        evidenceSummary: 'Built low-latency model inference pipelines and REST microservices.',
        isVerified: false,
      },
    ],
  });

  // Rohan skills (Embedded & Systems)
  await prisma.userSkill.createMany({
    data: [
      {
        userId: rohan.id,
        skillId: skillMap['ROS / Robotics'].id,
        proficiency: 5,
        verificationStatus: 'VERIFIED',
        evidenceType: 'COMPLETED_PROJECT',
        evidenceTitle: 'IIT Bombay Mars Rover Autonomy Stack',
        evidenceUrl: 'https://github.com/rohansharma-iitb/ros2-quadrotor-driver',
        evidenceSummary: 'Hardware-in-the-loop autonomous quadrotor ROS2 controller validated in lab field trials.',
        isVerified: true,
      },
      {
        userId: rohan.id,
        skillId: skillMap['Embedded C++'].id,
        proficiency: 5,
        verificationStatus: 'EVIDENCE_SUPPORTED',
        evidenceType: 'GITHUB_PROJECT',
        evidenceTitle: 'STM32 Telemetry Firmware',
        evidenceUrl: 'https://github.com/rohansharma-iitb/stm32-telemetry-firmware',
        evidenceSummary: 'Real-time telemetry firmware on STM32 microcontrollers with DMA and SPI.',
        isVerified: false,
      },
      {
        userId: rohan.id,
        skillId: skillMap['Python'].id,
        proficiency: 4,
        verificationStatus: 'SELF_DECLARED',
        evidenceSummary: 'Telemetry processing scripts and ROS nodes.',
        isVerified: false,
      },
    ],
  });

  // Clara skills (Backend & Go)
  await prisma.userSkill.createMany({
    data: [
      {
        userId: clara.id,
        skillId: skillMap['Go'].id,
        proficiency: 5,
        verificationStatus: 'VERIFIED',
        evidenceType: 'COMPLETED_PROJECT',
        evidenceTitle: 'UC Berkeley CS162 Distributed Raft',
        evidenceUrl: 'https://github.com/clararossi/raft-kv-engine',
        evidenceSummary: 'Built distributed key-value store in pure Go with Raft consensus verified by grading harness.',
        isVerified: true,
      },
      {
        userId: clara.id,
        skillId: skillMap['PostgreSQL'].id,
        proficiency: 5,
        verificationStatus: 'EVIDENCE_SUPPORTED',
        evidenceType: 'GITHUB_PROJECT',
        evidenceTitle: 'Timeseries Spatial Indexer',
        evidenceUrl: 'https://github.com/clararossi/pg-timeseries-indexer',
        evidenceSummary: 'Optimized high-throughput spatial indexing on Postgres handling 50k writes/sec.',
        isVerified: false,
      },
      {
        userId: clara.id,
        skillId: skillMap['Docker & Kubernetes'].id,
        proficiency: 4,
        verificationStatus: 'SELF_DECLARED',
        evidenceSummary: 'Maintained cluster deployments at Cal Hacks.',
        isVerified: false,
      },
    ],
  });

  // David skills (CV & SLAM)
  await prisma.userSkill.createMany({
    data: [
      {
        userId: david.id,
        skillId: skillMap['Computer Vision'].id,
        proficiency: 5,
        verificationStatus: 'VERIFIED',
        evidenceType: 'COMPLETED_PROJECT',
        evidenceTitle: 'CMU Robotics 3D NeRF SLAM',
        evidenceUrl: 'https://github.com/davidzhang-cmu/nerf-slam-depth',
        evidenceSummary: 'Real-time dense 3D reconstruction using neural radiance fields on mobile GPU.',
        isVerified: true,
      },
    ],
  });

  // Attach skills to Demo Accounts (leadUser, student1, student2)
  await prisma.userSkill.createMany({
    data: [
      {
        userId: leadUser.id,
        skillId: skillMap['React'].id,
        proficiency: 5,
        verificationStatus: 'VERIFIED',
        evidenceType: 'COMPLETED_PROJECT',
        evidenceTitle: 'AI Student Platform Lead Architect',
        evidenceUrl: 'https://github.com/project-lead/ai-assistant',
        evidenceSummary: 'Experienced lead developer and architect across React and TypeScript ecosystems.',
        isVerified: true,
      },
      {
        userId: leadUser.id,
        skillId: skillMap['Python'].id,
        proficiency: 4,
        verificationStatus: 'EVIDENCE_SUPPORTED',
        evidenceSummary: 'Backend integration and multi-agent workflow coordination.',
        isVerified: false,
      },
      {
        userId: leadUser.id,
        skillId: skillMap['UI/UX Design & Figma'].id,
        proficiency: 4,
        verificationStatus: 'EVIDENCE_SUPPORTED',
        evidenceSummary: 'Designed student dashboards and interactive workspace systems.',
        isVerified: false,
      },
      // Student 1 skills (Python, PyTorch, FastAPI)
      {
        userId: student1.id,
        skillId: skillMap['Python'].id,
        proficiency: 5,
        verificationStatus: 'VERIFIED',
        evidenceType: 'COMPLETED_PROJECT',
        evidenceTitle: 'MIT Python Automation Suite',
        evidenceUrl: 'https://github.com/student1-mit/python-core',
        evidenceSummary: 'Built high-performance async Python backend pipelines and task schedulers.',
        isVerified: true,
      },
      {
        userId: student1.id,
        skillId: skillMap['FastAPI'].id,
        proficiency: 5,
        verificationStatus: 'EVIDENCE_SUPPORTED',
        evidenceType: 'GITHUB_PROJECT',
        evidenceTitle: 'FastAPI Microservice Toolkit',
        evidenceUrl: 'https://github.com/student1-mit/fastapi-tools',
        evidenceSummary: 'Designed REST endpoints, JWT auth middleware, and async worker pipelines.',
        isVerified: false,
      },
      {
        userId: student1.id,
        skillId: skillMap['PyTorch'].id,
        proficiency: 4,
        verificationStatus: 'SELF_DECLARED',
        evidenceSummary: 'Deep learning model training and inference pipelines in Python.',
        isVerified: false,
      },
      // Student 2 skills (Python, Docker, PostgreSQL)
      {
        userId: student2.id,
        skillId: skillMap['Python'].id,
        proficiency: 5,
        verificationStatus: 'VERIFIED',
        evidenceType: 'COMPLETED_PROJECT',
        evidenceTitle: 'Berkeley Distributed Services',
        evidenceUrl: 'https://github.com/student2-cal/py-services',
        evidenceSummary: 'Developed scalable Python microservices and automated deployment pipelines.',
        isVerified: true,
      },
      {
        userId: student2.id,
        skillId: skillMap['Docker & Kubernetes'].id,
        proficiency: 4,
        verificationStatus: 'EVIDENCE_SUPPORTED',
        evidenceType: 'GITHUB_PROJECT',
        evidenceTitle: 'Cloud Native Cluster Orchestration',
        evidenceUrl: 'https://github.com/student2-cal/k8s-configs',
        evidenceSummary: 'Containerized multi-tier web applications with Docker Compose and Kubernetes.',
        isVerified: false,
      },
      {
        userId: student2.id,
        skillId: skillMap['PostgreSQL'].id,
        proficiency: 4,
        verificationStatus: 'SELF_DECLARED',
        evidenceSummary: 'Relational database schema design and query optimization.',
        isVerified: false,
      },
    ],
  });

  // Demo Experiences
  await prisma.studentExperience.createMany({
    data: [
      {
        userId: leadUser.id,
        title: 'Software Engineering Lead',
        company: 'Stanford Tech Incubator',
        location: 'Stanford, CA',
        startDate: 'Jan 2025',
        endDate: 'Present',
        isCurrent: true,
        description: 'Leading cross-functional student engineering teams building AI-powered education applications.',
      },
      {
        userId: student1.id,
        title: 'Backend Engineering Intern',
        company: 'Boston AI Labs',
        location: 'Cambridge, MA',
        startDate: 'May 2025',
        endDate: 'Aug 2025',
        isCurrent: false,
        description: 'Engineered Python FastAPI microservices and database query optimization pipelines.',
      },
      {
        userId: student2.id,
        title: 'Cloud Infrastructure Intern',
        company: 'Scale Ops',
        location: 'San Francisco, CA',
        startDate: 'Jun 2025',
        endDate: 'Sep 2025',
        isCurrent: false,
        description: 'Automated container deployments and Python background worker queues.',
      },
    ],
  });

  // 5.1 Seed Experiences
  await prisma.studentExperience.createMany({
    data: [
      {
        userId: alice.id,
        title: 'Frontend Engineering Intern',
        company: 'Stripe',
        location: 'San Francisco, CA',
        startDate: 'Jun 2025',
        endDate: 'Sep 2025',
        isCurrent: false,
        description: 'Engineered dashboard analytics components in React & TypeScript. Reduced bundle load time by 28%.',
      },
      {
        userId: alice.id,
        title: 'Undergraduate HCI Researcher',
        company: 'Stanford HCI Group',
        location: 'Stanford, CA',
        startDate: 'Jan 2025',
        endDate: 'Present',
        isCurrent: true,
        description: 'Designing multimodal interfaces for collaborative AI multi-agent teaming systems.',
      },
      {
        userId: bob.id,
        title: 'Graduate Research Assistant',
        company: 'MIT CSAIL (Learning & Intelligent Systems)',
        location: 'Cambridge, MA',
        startDate: 'Sep 2024',
        endDate: 'Present',
        isCurrent: true,
        description: 'Developing graph neural networks for vehicle routing and combinatorial dynamic fleet assignment.',
      },
      {
        userId: rohan.id,
        title: 'Flight Hardware Subsystem Lead',
        company: 'IIT Bombay Mars Rover Team',
        location: 'Mumbai, India',
        startDate: 'Aug 2024',
        endDate: 'Present',
        isCurrent: true,
        description: 'Designed dual-redundant STM32 flight controller boards and MAVLink telemetry stack.',
      },
      {
        userId: clara.id,
        title: 'Systems & Infrastructure Intern',
        company: 'Cloudflare',
        location: 'San Francisco, CA',
        startDate: 'May 2025',
        endDate: 'Aug 2025',
        isCurrent: false,
        description: 'Worked on edge routing proxy optimizations and high-concurrency Go microservices.',
      },
    ],
  });

  // 5.2 Seed Hackathons
  await prisma.studentHackathon.createMany({
    data: [
      {
        userId: alice.id,
        title: 'TreeHacks 2026',
        projectName: 'MedFlow Collaborative AI',
        award: '🏆 1st Place - Healthcare & Best UX Track',
        date: 'Feb 2026',
        description: 'Built cross-hospital patient transfer coordinator with real-time WebSocket dashboard.',
        projectUrl: 'https://devpost.com/software/medflow-treehacks',
      },
      {
        userId: bob.id,
        title: 'HackMIT 2025',
        projectName: 'NeuroRoute Dynamic Dispatch',
        award: '🏆 Grand Prize Winner - AI & Optimization',
        date: 'Oct 2025',
        description: 'Implemented real-time GNN routing model that beat standard Dijkstra heuristics by 34%.',
        projectUrl: 'https://devpost.com/software/neuroroute-hackmit',
      },
      {
        userId: rohan.id,
        title: 'RoboSub International Competition 2025',
        projectName: 'HydroNav Sub Autonomous Pilot',
        award: '🥇 1st Place - Autonomous Acoustic Navigation',
        date: 'Jul 2025',
        description: 'Built embedded acoustic triangulation and PX4 hydro-propulsion control stack.',
        projectUrl: 'https://github.com/rohansharma-iitb/hydronav',
      },
      {
        userId: clara.id,
        title: 'CalHacks 10.0',
        projectName: 'StreamSync Distributed Consensus',
        award: '🥇 Best Distributed Systems Architecture',
        date: 'Oct 2024',
        description: 'Zero-downtime distributed log replicator in Go with linearizable reads.',
        projectUrl: 'https://devpost.com/software/streamsync-calhacks',
      },
    ],
  });

  // 5.3 Seed Past Projects
  await prisma.studentPastProject.createMany({
    data: [
      {
        userId: alice.id,
        title: 'Spatial UI Component Library',
        role: 'Creator & Lead Architect',
        description: 'Open-source accessible UI component library for complex spatial and 3D data visualization.',
        technologies: 'React, TypeScript, Tailwind CSS, WebGL, Canvas',
        projectUrl: 'https://spatial-ui.dev',
        githubUrl: 'https://github.com/alicechen/react-design-system',
        isFeatured: true,
      },
      {
        userId: bob.id,
        title: 'PyG Dynamic Vehicle Routing Engine',
        role: 'Primary Author',
        description: 'Fast spatial-temporal graph neural network library for combinatorial routing and dynamic dispatching.',
        technologies: 'PyTorch, PyTorch Geometric, NetworkX, FastAPI, Docker',
        projectUrl: 'https://pyg-dynamic.mit.edu',
        githubUrl: 'https://github.com/bobmiller-ai/pyg-dynamic-dispatch',
        isFeatured: true,
      },
      {
        userId: rohan.id,
        title: 'PX4 Telemetry Microcontroller Shield',
        role: 'Hardware & Firmware Lead',
        description: 'Custom STM32 breakout shield with high-speed SPI logging and optical flow sensor fusion.',
        technologies: 'Embedded C++, STM32CubeIDE, KiCad, ROS2, MAVLink',
        projectUrl: 'https://rohansharma.tech/px4-shield',
        githubUrl: 'https://github.com/rohansharma-iitb/stm32-telemetry-firmware',
        isFeatured: true,
      },
      {
        userId: clara.id,
        title: 'Raft Key-Value Distributed Store',
        role: 'Systems Engineer',
        description: 'High-throughput fault-tolerant distributed key-value store in Go implementing Raft consensus and snapshotting.',
        technologies: 'Go, Raft Protocol, gRPC, Protobuf, PostgreSQL',
        projectUrl: 'https://clarabuilds.dev/raft-kv',
        githubUrl: 'https://github.com/clararossi/raft-kv-engine',
        isFeatured: true,
      },
    ],
  });

  console.log('✅ Attached verified skills, experiences, hackathons, and past projects.');

  // 6. Seed Projects
  // Project 1: AeroRoute AI (Flagship multi-college project)
  const aeroroute = await prisma.project.create({
    data: {
      title: 'AeroRoute AI',
      pitch: 'An intelligent multi-college autonomous drone delivery dispatcher that optimizes battery consumption, dynamic obstacle avoidance, and decentralized fleet coordination using Graph Neural Networks and real-time ROS flight control.',
      publicTeaser: 'Next-generation autonomous aerial logistics platform utilizing Graph Neural Networks for dynamic fleet trajectory planning and sub-second collision avoidance across complex urban corridors.',
      problemStatement: 'Current commercial drone routing algorithms rely on static Euclidean graphs and fail to adapt dynamically to micro-weather shifts, sudden airspace restrictions, and fleet battery degradation.',
      domain: 'Robotics & Applied AI',
      status: 'RECRUITING',
      healthStatus: 'HEALTHY',
      healthScore: 92,
      healthSuggestions: JSON.stringify([
        'Backend telemetry schema is finalized. GNN model training on synthetic wind vector datasets is in progress.',
        'Urgent: Need to onboard an Embedded C++ engineer from partner institute to test PX4 firmware interface on hardware testbed.',
      ]),
      creatorId: alice.id,
      isPublic: true,
      targetCompletionDate: new Date('2026-11-30'),
      // Private Workspace Information (Progressive Disclosure)
      privateRepoUrl: 'https://github.com/aeroroute-internal/flight-core',
      privateNotes: 'Targeting presentation at IEEE IROS 2026. Hardware testing slots secured at Stanford Flight Dome and IIT Bombay Aeromodelling lab.',
      architectureSpec: 'GNN Inference Engine (Python/PyTorch) <-> IPC Bridge (ZeroMQ) <-> STM32 Flight Controller (Embedded C++) <-> Real-time Operator Dashboard (React + WebSockets).',
    },
  });

  // Attach Creator as Project Member
  await prisma.projectMember.create({
    data: {
      projectId: aeroroute.id,
      userId: alice.id,
      roleTitle: 'Project Lead & Frontend Engineer',
    },
  });

  // Project 1 Roles
  const aerorouteLeadRole = await prisma.projectRole.create({
    data: {
      projectId: aeroroute.id,
      title: 'Project Lead & Web Interface',
      description: 'Lead platform architecture and develop real-time aerial dispatch visualization.',
      isFilled: true,
    },
  });

  const aerorouteGnnRole = await prisma.projectRole.create({
    data: {
      projectId: aeroroute.id,
      title: 'GNN & Optimization Specialist',
      description: 'Train spatio-temporal graph models in PyTorch Geometric for real-time multi-agent routing.',
      isFilled: false,
    },
  });

  const aerorouteEmbeddedRole = await prisma.projectRole.create({
    data: {
      projectId: aeroroute.id,
      title: 'Embedded Systems & ROS2 Engineer',
      description: 'Bridge trajectory waypoints with PX4 autopilot hardware, low-latency telemetry over MAVLink.',
      isFilled: false,
    },
  });

  // Attach Required Skills to Roles
  await prisma.projectRequiredSkill.createMany({
    data: [
      {
        projectRoleId: aerorouteLeadRole.id,
        skillId: skillMap['React'].id,
        minLevel: 4,
        isCritical: true,
      },
      {
        projectRoleId: aerorouteLeadRole.id,
        skillId: skillMap['TypeScript'].id,
        minLevel: 4,
        isCritical: true,
      },
      {
        projectRoleId: aerorouteGnnRole.id,
        skillId: skillMap['Graph Neural Networks'].id,
        minLevel: 4,
        isCritical: true,
      },
      {
        projectRoleId: aerorouteGnnRole.id,
        skillId: skillMap['PyTorch'].id,
        minLevel: 4,
        isCritical: true,
      },
      {
        projectRoleId: aerorouteEmbeddedRole.id,
        skillId: skillMap['ROS / Robotics'].id,
        minLevel: 4,
        isCritical: true,
      },
      {
        projectRoleId: aerorouteEmbeddedRole.id,
        skillId: skillMap['Embedded C++'].id,
        minLevel: 4,
        isCritical: true,
      },
    ],
  });

  // Seed Milestones for Project 1
  const m1 = await prisma.milestone.create({
    data: {
      projectId: aeroroute.id,
      title: 'Phase 1: Architecture & Synthetic Simulation',
      description: 'Setup Gazebo drone simulation, GNN benchmark suite, and telemetry WebSocket bridge.',
      dueDate: new Date('2026-09-30'),
      isCompleted: false,
    },
  });

  const m2 = await prisma.milestone.create({
    data: {
      projectId: aeroroute.id,
      title: 'Phase 2: Hardware-in-the-Loop Testing',
      description: 'Deploy firmware to STM32 and validate 100-waypoint route execution on physical testbed.',
      dueDate: new Date('2026-10-31'),
      isCompleted: false,
    },
  });

  // Seed Tasks for Project 1
  await prisma.task.createMany({
    data: [
      {
        projectId: aeroroute.id,
        title: 'Design Dispatcher HUD & 3D Flight Path View',
        description: 'Implement Mapbox GL camera controls and real-time altitude telemetry chart.',
        status: 'DONE',
        priority: 'HIGH',
        weight: 25,
        progress: 100,
        assigneeId: alice.id,
        milestoneId: m1.id,
        orderIndex: 0,
      },
      {
        projectId: aeroroute.id,
        title: 'Construct Graph Neural Network Trajectory Model',
        description: 'Implement spatial edge weighting based on wind vector grid and dynamic obstacle velocity.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        weight: 25,
        progress: 50,
        milestoneId: m1.id,
        orderIndex: 1,
      },
      {
        projectId: aeroroute.id,
        title: 'PX4 MAVLink Serial Bridge Node in C++',
        description: 'Listen on /dev/ttyACM0 and translate ROS2 pose goals into PX4 offboard waypoints.',
        status: 'TODO',
        priority: 'HIGH',
        weight: 25,
        progress: 0,
        milestoneId: m2.id,
        orderIndex: 2,
      },
      {
        projectId: aeroroute.id,
        title: 'Setup Cross-College Simulation CI/CD Pipeline',
        description: 'Automate Gazebo headless integration tests on GitHub Actions.',
        status: 'TODO',
        priority: 'MEDIUM',
        weight: 25,
        progress: 0,
        milestoneId: m1.id,
        orderIndex: 3,
      },
    ],
  });

  // Seed Chat Messages in Project 1 Workspace
  await prisma.chatMessage.createMany({
    data: [
      {
        projectId: aeroroute.id,
        senderId: alice.id,
        content: 'Welcome to the AeroRoute workspace! I have posted our simulation architecture and initial HUD components.',
        createdAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        projectId: aeroroute.id,
        senderId: alice.id,
        content: 'We need to pair the GNN model output directly with the PX4 waypoint queue next.',
        createdAt: new Date(Date.now() - 3600000 * 12),
      },
    ],
  });

  // Seed an Application from Bob to AeroRoute AI
  await prisma.application.create({
    data: {
      projectId: aeroroute.id,
      projectRoleId: aerorouteGnnRole.id,
      applicantId: bob.id,
      pitch: 'Hi Alice! I have built dynamic graph neural networks for vehicle routing at MIT CSAIL. I can implement the GNN trajectory planner in PyTorch Geometric and integrate it with your WebSocket dispatch stream.',
      relevantLinks: JSON.stringify([
        'https://github.com/bobmiller-ai/gnn-routing',
        'https://bobmiller.mit.edu/papers/dynamic-dispatch.pdf',
      ]),
      status: 'PENDING',
      matchScore: 96,
      matchAnalysis: 'Outstanding 96% match. Bob possesses verified expertise in Graph Neural Networks and PyTorch. High cross-institutional synergy (MIT & Stanford collaboration).',
    },
  });

  // Project 2: NeuroScan Web (Clara - UC Berkeley)
  const neuroscan = await prisma.project.create({
    data: {
      title: 'NeuroScan Web',
      pitch: 'A privacy-preserving federated edge healthcare platform allowing hospital researchers across universities to collaboratively train MRI segmentation models without centralizing patient scans.',
      publicTeaser: 'Decentralized federated medical imaging infrastructure ensuring zero data leakage while training high-accuracy neural MRI diagnostics.',
      problemStatement: 'Strict HIPAA and multi-institution compliance laws prevent pooling MRI datasets across hospitals, severely limiting rare pathology training data.',
      domain: 'Healthcare & AI',
      status: 'RECRUITING',
      healthStatus: 'EXCELLENT',
      healthScore: 95,
      healthSuggestions: JSON.stringify([
        'Federated gradient aggregation protocol verified with differential privacy guarantees.',
      ]),
      creatorId: clara.id,
      isPublic: true,
      targetCompletionDate: new Date('2026-12-15'),
      privateRepoUrl: 'https://github.com/berkeley-health/neuroscan-core',
      privateNotes: 'Partnering with UCSF and Stanford Medical School researchers for pilot dataset validation.',
      architectureSpec: 'Go Federated Server (gRPC) + PyTorch Differential Privacy Worker + React Healthcare Dashboard.',
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: neuroscan.id,
      userId: clara.id,
      roleTitle: 'Systems Lead & Distributed Architect',
    },
  });

  const neuroscanLeadRole = await prisma.projectRole.create({
    data: {
      projectId: neuroscan.id,
      title: 'Distributed Systems & Go Lead',
      description: 'Design zero-trust gRPC federated aggregator and differential privacy coordinator.',
      isFilled: true,
    },
  });

  const neuroscanCvRole = await prisma.projectRole.create({
    data: {
      projectId: neuroscan.id,
      title: 'Medical Computer Vision Specialist',
      description: 'Develop 3D U-Net and Vision Transformer segmentation models for DICOM scans.',
      isFilled: false,
    },
  });

  await prisma.projectRequiredSkill.createMany({
    data: [
      {
        projectRoleId: neuroscanLeadRole.id,
        skillId: skillMap['Go'].id,
        minLevel: 5,
        isCritical: true,
      },
      {
        projectRoleId: neuroscanLeadRole.id,
        skillId: skillMap['PostgreSQL'].id,
        minLevel: 4,
        isCritical: true,
      },
      {
        projectRoleId: neuroscanCvRole.id,
        skillId: skillMap['Computer Vision'].id,
        minLevel: 5,
        isCritical: true,
      },
      {
        projectRoleId: neuroscanCvRole.id,
        skillId: skillMap['PyTorch'].id,
        minLevel: 4,
        isCritical: true,
      },
    ],
  });

  // User Map for Project Creator Lookup
  const userMap: Record<string, any> = {
    'kapileom27@gmail.com': leadUser,
    'lead@test.com': leadUser,
    'student1@test.com': student1,
    'student2@test.com': student2,
    'alice@stanford.edu': alice,
    'bob@mit.edu': bob,
    'rohan@iitb.ac.in': rohan,
    'clara@berkeley.edu': clara,
    'david@cmu.edu': david,
    'admin@projectx.edu': adminUser,
  };

  console.log(`🌱 Seeding ${DEMO_PROJECTS.length} realistic demo projects across diverse technical domains...`);

  const projectBySlugMap: Record<string, { project: any; rolesByTitle: Record<string, any> }> = {};

  for (const p of DEMO_PROJECTS) {
    const creator = userMap[p.creatorEmail] || leadUser;

    const project = await prisma.project.create({
      data: {
        title: p.title,
        pitch: p.pitch,
        publicTeaser: p.publicTeaser,
        problemStatement: p.problemStatement,
        domain: p.domain,
        status: 'RECRUITING',
        healthStatus: p.healthStatus,
        healthScore: p.healthScore,
        healthSuggestions: JSON.stringify(p.healthSuggestions),
        difficulty: p.difficulty,
        duration: p.duration,
        teamSize: p.teamSize,
        workMode: p.workMode,
        collegeVisibility: p.collegeVisibility,
        creatorId: creator.id,
        isPublic: true,
        targetCompletionDate: new Date('2026-12-15'),
        privateRepoUrl: p.privateRepoUrl || `https://github.com/projectx-demo/${p.slug}`,
        privateNotes: p.privateNotes || 'Initial milestone and team recruitment underway.',
        architectureSpec: p.architectureSpec || 'Modern modular architecture with clean API contracts.',
      },
    });

    // Attach creator as Project Lead member
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: creator.id,
        roleTitle: 'Project Lead',
      },
    });

    const rolesByTitle: Record<string, any> = {};

    // Create required roles and link skills
    for (const role of p.roles) {
      const createdRole = await prisma.projectRole.create({
        data: {
          projectId: project.id,
          title: role.title,
          description: role.description,
          requiredMembers: role.requiredMembers,
          isFilled: false,
        },
      });

      rolesByTitle[role.title] = createdRole;

      for (const skillReq of role.skills) {
        let skillRecord = skillMap[skillReq.name];
        if (!skillRecord) {
          skillRecord = await prisma.skill.create({
            data: {
              name: skillReq.name,
              category: 'General',
            },
          });
          skillMap[skillReq.name] = skillRecord;
        }

        await prisma.projectRequiredSkill.create({
          data: {
            projectRoleId: createdRole.id,
            skillId: skillRecord.id,
            minLevel: skillReq.minLevel,
            isCritical: skillReq.isCritical,
          },
        });
      }
    }

    projectBySlugMap[p.slug] = { project, rolesByTitle };

    // Create milestones
    const createdMilestones: any[] = [];
    for (const ms of p.milestones) {
      const milestone = await prisma.milestone.create({
        data: {
          projectId: project.id,
          title: ms.title,
          description: ms.description,
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * ms.dueDateOffsetDays),
          isCompleted: false,
        },
      });
      createdMilestones.push(milestone);
    }

    // Create initial tasks
    for (let i = 0; i < p.tasks.length; i++) {
      const t = p.tasks[i];
      const taskAssigneeId = (t.assigneeEmail && userMap[t.assigneeEmail]?.id)
        ? userMap[t.assigneeEmail].id
        : creator.id;

      await prisma.task.create({
        data: {
          projectId: project.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          weight: t.weight ?? Math.round(100 / p.tasks.length),
          progress: t.progress ?? (t.status === 'DONE' ? 100 : t.status === 'IN_PROGRESS' ? 50 : 0),
          assigneeId: taskAssigneeId,
          milestoneId: createdMilestones[0]?.id || null,
          orderIndex: i,
        },
      });
    }
  }

  // -------------------------------------------------------------
  // Seed Vivek Jadhav (student1) as an accepted member on AI Student Assistant
  // -------------------------------------------------------------
  const aiAssistant = projectBySlugMap['ai-student-assistant'];
  if (aiAssistant) {
    await prisma.projectMember.create({
      data: {
        projectId: aiAssistant.project.id,
        userId: student1.id,
        roleTitle: 'Python Backend Developer',
      },
    });

    const pythonRole = aiAssistant.rolesByTitle['Python Developer'];
    if (pythonRole) {
      await prisma.application.create({
        data: {
          projectId: aiAssistant.project.id,
          projectRoleId: pythonRole.id,
          applicantId: student1.id,
          pitch: 'I have extensive experience with FastAPI, Python, and async pipeline architecture. Excited to build the AI matching endpoints.',
          status: 'ACCEPTED',
          matchScore: 95,
          matchAnalysis: 'Strong alignment with Python, FastAPI, and async system design requirements.',
          relevantLinks: JSON.stringify(['https://github.com/vivekjadhav-dev/fastapi-agents']),
        },
      });
    }
  }

  // -------------------------------------------------------------
  // Seed Joined Project Memberships for leadUser (Projects I Joined)
  // -------------------------------------------------------------
  await prisma.projectMember.createMany({
    data: [
      {
        projectId: aeroroute.id,
        userId: leadUser.id,
        roleTitle: 'Lead AI Architect & Strategist',
      },
      {
        projectId: neuroscan.id,
        userId: leadUser.id,
        roleTitle: 'Distributed Systems & Cache Engineer',
      },
      {
        projectId: projectBySlugMap['crop-disease-detection']?.project.id || aeroroute.id,
        userId: leadUser.id,
        roleTitle: 'Mobile ML Optimization Lead',
      },
      {
        projectId: projectBySlugMap['smart-campus-navigation']?.project.id || aeroroute.id,
        userId: leadUser.id,
        roleTitle: 'Backend Spatial Routing Lead',
      },
    ],
  });

  // -------------------------------------------------------------
  // Seed Sent Applications from leadUser (Applications I Sent)
  // -------------------------------------------------------------
  const eventProj = projectBySlugMap['college-event-management-platform'];
  if (eventProj) {
    const roleId = Object.values(eventProj.rolesByTitle)[0]?.id;
    if (roleId) {
      await prisma.application.create({
        data: {
          projectId: eventProj.project.id,
          projectRoleId: roleId,
          applicantId: leadUser.id,
          pitch: 'I have extensive experience building scalable event booking workflows and QR code scanning engines with React and Node.js.',
          status: 'ACCEPTED',
          matchScore: 94,
          matchAnalysis: 'Strong match in React, TypeScript, and database optimization.',
          relevantLinks: JSON.stringify(['https://github.com/project-lead/event-hub-demo']),
        },
      });
    }
  }

  const attendanceProj = projectBySlugMap['smart-attendance-system'];
  if (attendanceProj) {
    const roleId = Object.values(attendanceProj.rolesByTitle)[0]?.id;
    if (roleId) {
      await prisma.application.create({
        data: {
          projectId: attendanceProj.project.id,
          projectRoleId: roleId,
          applicantId: leadUser.id,
          pitch: 'Built IoT facial verification and BLE proximity beacons for campus lab check-ins.',
          status: 'SHORTLISTED',
          matchScore: 89,
          matchAnalysis: 'Strong IoT integration background and cross-college engineering collaboration history.',
          relevantLinks: JSON.stringify(['https://github.com/project-lead/attendance-ble']),
        },
      });
    }
  }

  const plagProj = projectBySlugMap['ai-based-plagiarism-detection'];
  if (plagProj) {
    const roleId = Object.values(plagProj.rolesByTitle)[0]?.id;
    if (roleId) {
      await prisma.application.create({
        data: {
          projectId: plagProj.project.id,
          projectRoleId: roleId,
          applicantId: leadUser.id,
          pitch: 'I specialize in AST vector embeddings and semantic sentence transformer pipelines in PyTorch.',
          status: 'PENDING',
          matchScore: 91,
          matchAnalysis: 'Exceptional deep learning and NLP portfolio with multiple GitHub publications.',
          relevantLinks: JSON.stringify(['https://github.com/project-lead/ast-transformer-plag']),
        },
      });
    }
  }

  // -------------------------------------------------------------
  // Seed Incoming Role Applications to Projects Led by leadUser
  // -------------------------------------------------------------
  const shuttleProj = projectBySlugMap['autonomous-campus-shuttle'];
  if (shuttleProj) {
    const rosRole = shuttleProj.rolesByTitle['Embedded ROS2 Engineer'];
    const cvRole = shuttleProj.rolesByTitle['Computer Vision & SLAM Specialist'];

    if (rosRole) {
      await prisma.application.create({
        data: {
          projectId: shuttleProj.project.id,
          projectRoleId: rosRole.id,
          applicantId: rohan.id,
          pitch: 'Hi! I lead the IIT Bombay autonomous robotics team. I have written ROS2 Humble nodes for CAN bus motor controllers and STM32 telemetry shields.',
          status: 'PENDING',
          matchScore: 96,
          matchAnalysis: 'Outstanding 96% match. Rohan has verified hardware expertise in ROS2 and Embedded C++.',
          relevantLinks: JSON.stringify(['https://github.com/rohansharma-iitb/stm32-telemetry-firmware']),
        },
      });
    }

    if (cvRole) {
      await prisma.application.create({
        data: {
          projectId: shuttleProj.project.id,
          projectRoleId: cvRole.id,
          applicantId: david.id,
          pitch: 'I have trained 3D bounding box detection models using PointPillars and TensorRT on Jetson AGX Orin for CMU autonomous rover.',
          status: 'SHORTLISTED',
          matchScore: 93,
          matchAnalysis: 'High proficiency in Computer Vision, PointPillars, and Jetson hardware deployment.',
          relevantLinks: JSON.stringify(['https://github.com/davidchen-cmu/pointpillars-ros2']),
        },
      });
    }
  }

  const zkProj = projectBySlugMap['decentralized-student-credentials'];
  if (zkProj) {
    const solidityRole = zkProj.rolesByTitle['Solidity Smart Contract Engineer'];
    const web3Role = zkProj.rolesByTitle['Full-Stack Web3 Developer'];

    if (solidityRole) {
      await prisma.application.create({
        data: {
          projectId: zkProj.project.id,
          projectRoleId: solidityRole.id,
          applicantId: clara.id,
          pitch: 'I built Raft distributed stores and gas-optimized Solidity contracts at UC Berkeley Blockchain Lab. Ready to build the Soulbound Token registry.',
          status: 'PENDING',
          matchScore: 95,
          matchAnalysis: 'Expert in Solidity, cryptography, and Ethereum Layer 2 architecture.',
          relevantLinks: JSON.stringify(['https://github.com/clararossi/zk-credentials-vault']),
        },
      });
    }

    if (web3Role) {
      await prisma.application.create({
        data: {
          projectId: zkProj.project.id,
          projectRoleId: web3Role.id,
          applicantId: student2.id,
          pitch: 'Frontend engineer with experience in Wagmi, Ethers.js, and Tailwind CSS. Built web3 wallets for campus club events.',
          status: 'PENDING',
          matchScore: 88,
          matchAnalysis: 'Strong skills in React, TypeScript, and modern wallet connector libraries.',
          relevantLinks: JSON.stringify(['https://github.com/student2-cal/web3-connect-suite']),
        },
      });
    }
  }

  const medProj = projectBySlugMap['ai-medical-diagnosis-assistant'];
  if (medProj) {
    const dlRole = medProj.rolesByTitle['Deep Learning Medical Vision Specialist'];
    const uiRole = medProj.rolesByTitle['Healthcare UI/UX Specialist'];

    if (dlRole) {
      await prisma.application.create({
        data: {
          projectId: medProj.project.id,
          projectRoleId: dlRole.id,
          applicantId: bob.id,
          pitch: 'MIT AI graduate student with research in Vision Transformers and medical imaging segmentation. Published at MICCAI 2025.',
          status: 'PENDING',
          matchScore: 97,
          matchAnalysis: 'World-class match in PyTorch, Vision Transformers, and biomedical imaging benchmarks.',
          relevantLinks: JSON.stringify(['https://github.com/bobmiller-ai/medical-vit-segmentation']),
        },
      });
    }

    if (uiRole) {
      await prisma.application.create({
        data: {
          projectId: medProj.project.id,
          projectRoleId: uiRole.id,
          applicantId: student2.id,
          pitch: 'Passionate about accessible healthcare user journeys. Designed Figma prototypes for clinical triage and HIPAA privacy workflows.',
          status: 'PENDING',
          matchScore: 89,
          matchAnalysis: 'Strong UX design track record and Figma component system mastery.',
          relevantLinks: JSON.stringify(['https://figma.com/@student2/health-triage-system']),
        },
      });
    }
  }

  const codeReviewProj = projectBySlugMap['collaborative-peer-code-review-hub'];
  if (codeReviewProj) {
    const tsRole = codeReviewProj.rolesByTitle['TypeScript & LSP Specialist'];
    if (tsRole) {
      await prisma.application.create({
        data: {
          projectId: codeReviewProj.project.id,
          projectRoleId: tsRole.id,
          applicantId: alice.id,
          pitch: 'Stanford lead frontend architect with extensive experience integrating Monaco editor, web workers, and real-time Socket.IO multi-cursor synchronization.',
          status: 'PENDING',
          matchScore: 98,
          matchAnalysis: 'Top tier match in React, TypeScript, and Monaco code editor architecture.',
          relevantLinks: JSON.stringify(['https://github.com/alicechen-ai/monaco-multi-cursor']),
        },
      });
    }
  }

  // Seed Notifications for Lead
  await prisma.notification.createMany({
    data: [
      {
        userId: leadUser.id,
        type: 'APPLICATION_RECEIVED',
        title: 'New High Match Application!',
        message: 'Rohan Sharma (Sanjivani University) applied for "Embedded ROS2 Engineer" on Autonomous Campus Shuttle System (96% Match).',
        link: `/my-projects?tab=lead`,
        isRead: false,
      },
      {
        userId: leadUser.id,
        type: 'APPLICATION_RECEIVED',
        title: 'New Candidate Review',
        message: 'Clara Rossi (Sanjivani University) applied for "Solidity Smart Contract Engineer" on Decentralized Student Credential Network (95% Match).',
        link: `/my-projects?tab=lead`,
        isRead: false,
      },
      {
        userId: leadUser.id,
        type: 'APPLICATION_ACCEPTED',
        title: 'Application Accepted! 🎉',
        message: 'Alice Chen accepted your application for "Full-Stack Web Architect" on College Event Management Platform.',
        link: `/workspace/${eventProj?.project.id || aeroroute.id}`,
        isRead: false,
      },
    ],
  });

  // Seed Notifications for Alice
  await prisma.notification.create({
    data: {
      userId: alice.id,
      type: 'APPLICATION_RECEIVED',
      title: 'New High Match Application!',
      message: 'Bob Miller (Sanjivani University) applied for "GNN & Optimization Specialist" on AeroRoute AI (96% Match).',
      link: `/projects/${aeroroute.id}?tab=applications`,
      isRead: false,
    },
  });

  console.log('✅ Successfully seeded Projects, Roles, Milestones, Tasks, and Applications!');
  console.log('🚀 ProjectX database is primed and ready.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
