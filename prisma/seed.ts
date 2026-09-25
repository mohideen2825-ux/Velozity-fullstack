import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.notification.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Users
  const admin = await prisma.user.create({
    data: { email: 'admin@dashboard.com', password: passwordHash, name: 'Alice Admin', role: 'ADMIN' },
  });

  const pm1 = await prisma.user.create({
    data: { email: 'pm1@dashboard.com', password: passwordHash, name: 'Bob Manager', role: 'PROJECT_MANAGER' },
  });

  const pm2 = await prisma.user.create({
    data: { email: 'pm2@dashboard.com', password: passwordHash, name: 'Carol Manager', role: 'PROJECT_MANAGER' },
  });

  const devs = [];
  for (let i = 1; i <= 4; i++) {
    devs.push(
      await prisma.user.create({
        data: { email: `dev${i}@dashboard.com`, password: passwordHash, name: `Developer ${i}`, role: 'DEVELOPER' },
      })
    );
  }

  // Clients
  const client1 = await prisma.client.create({
    data: { name: 'Acme Corp', company: 'Acme Corp', email: 'contact@acme.com' },
  });
  const client2 = await prisma.client.create({
    data: { name: 'Globex', company: 'Globex Inc', email: 'hello@globex.com' },
  });

  // Projects
  const p1 = await prisma.project.create({
    data: { name: 'Acme Website Redesign', description: 'Full stack redesign', clientId: client1.id, managerId: pm1.id },
  });
  const p2 = await prisma.project.create({
    data: { name: 'Globex Mobile App', description: 'React Native app', clientId: client2.id, managerId: pm2.id },
  });

  // Dates
  const today = new Date();
  const past = new Date(today); past.setDate(today.getDate() - 3);
  const future = new Date(today); future.setDate(today.getDate() + 5);

  // Tasks
  const tasksData = [
    { title: 'Setup Repo',        status: 'DONE',        priority: 'HIGH',     dueDate: past,   isOverdue: false, projectId: p1.id, assigneeId: devs[0].id },
    { title: 'Design DB Schema',  status: 'IN_REVIEW',   priority: 'CRITICAL', dueDate: today,  isOverdue: false, projectId: p1.id, assigneeId: devs[1].id },
    { title: 'Implement Auth',    status: 'IN_PROGRESS', priority: 'HIGH',     dueDate: future, isOverdue: false, projectId: p1.id, assigneeId: devs[0].id },
    { title: 'Overdue Task 1',    status: 'TO_DO',       priority: 'MEDIUM',   dueDate: past,   isOverdue: true,  projectId: p1.id, assigneeId: devs[1].id },
    { title: 'Scaffold App',      status: 'DONE',        priority: 'HIGH',     dueDate: past,   isOverdue: false, projectId: p2.id, assigneeId: devs[2].id },
    { title: 'UI Components',     status: 'IN_PROGRESS', priority: 'MEDIUM',   dueDate: future, isOverdue: false, projectId: p2.id, assigneeId: devs[2].id },
    { title: 'API Integration',   status: 'TO_DO',       priority: 'HIGH',     dueDate: future, isOverdue: false, projectId: p2.id, assigneeId: devs[3].id },
    { title: 'Overdue Task 2',    status: 'IN_PROGRESS', priority: 'CRITICAL', dueDate: past,   isOverdue: true,  projectId: p2.id, assigneeId: devs[3].id },
  ];

  for (const data of tasksData) {
    await prisma.task.create({ data });
  }

  // A couple of activity entries so the dashboard feed isn't empty
  const task1 = await prisma.task.findFirst({ where: { title: 'Setup Repo' } });
  if (task1) {
    await prisma.taskActivity.create({
      data: { taskId: task1.id, userId: devs[0].id, previousStatus: 'IN_PROGRESS', newStatus: 'DONE' },
    });
  }

  console.log('\n✅ Database seeded!');
  console.log('─────────────────────────────────────────');
  console.log('Test accounts (password: password123)');
  console.log('  Admin : admin@dashboard.com');
  console.log('  PM 1  : pm1@dashboard.com');
  console.log('  PM 2  : pm2@dashboard.com');
  console.log('  Dev 1 : dev1@dashboard.com');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
