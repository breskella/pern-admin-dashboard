import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users, classes } from './src/db/schema/index.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const seedData = async () => {
  try {
    // Insert sample teachers
    const teacherIds = ['teacher-1', 'teacher-2', 'teacher-3'];
    
    await db.insert(users).values([
      {
        id: 'teacher-1',
        name: 'Dr. John Smith',
        email: 'john.smith@university.edu',
        role: 'teacher',
        department: 'Electronics & Communication',
      },
      {
        id: 'teacher-2',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        role: 'teacher',
        department: 'Computer Science',
      },
      {
        id: 'teacher-3',
        name: 'Prof. Michael Brown',
        email: 'michael.brown@university.edu',
        role: 'teacher',
        department: 'Mechanical Engineering',
      },
    ]).onConflictDoNothing();

    // Insert sample classes
    await db.insert(classes).values([
      {
        subjectId: 1, // ECE102 - Data Structures
        teacherId: 'teacher-1',
        name: 'Data Structures - Batch A',
        description: 'Introduction to data structures including arrays, linked lists, stacks, and queues',
        capacity: 40,
        status: 'active',
        bannerUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop',
        bannerCldPubId: 'ece-102-a-banner',
        inviteCode: 'DS2024A',
      },
      {
        subjectId: 2, // ECE101 - Signals
        teacherId: 'teacher-2',
        name: 'Signal Processing Fundamentals',
        description: 'Analysis and processing of electronic signals',
        capacity: 35,
        status: 'active',
        bannerUrl: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=500&h=300&fit=crop',
        bannerCldPubId: 'ece-101-banner',
        inviteCode: 'SP2024',
      },
    ]).onConflictDoNothing();

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
