export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

export const SKILL_LEVELS = {
  1: 'Beginner',
  2: 'Basic',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export const TRAINING_STATUS = {
  PENDING: 'PENDING',
  CLAIMED: 'CLAIMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const GAP_STATUS = {
  READY: 'READY',
  NEEDS_IMPROVEMENT: 'NEEDS_IMPROVEMENT',
  SKILL_GAP: 'SKILL_GAP',
  CRITICAL: 'CRITICAL',
};

export const PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const DIFFICULTY = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
};

export const DEMO_ACCOUNTS = [
  {
    role: 'Employee',
    email: 'employee@skillsync.com',
    password: 'password123',
    description: 'View skills, gaps & training',
    color: 'bg-blue-500',
  },
  {
    role: 'SME Employee',
    email: 'sme@skillsync.com',
    password: 'password123',
    description: 'Approved SME capability',
    color: 'bg-purple-500',
  },
  {
    role: 'Manager',
    email: 'manager@skillsync.com',
    password: 'password123',
    description: 'Manage team & validate skills',
    color: 'bg-green-500',
  },
  {
    role: 'Admin',
    email: 'admin@skillsync.com',
    password: 'password123',
    description: 'Full platform administration',
    color: 'bg-orange-500',
  },
];

export const ROLE_ROUTES = {
  EMPLOYEE: '/employee/dashboard',
  MANAGER: '/manager/dashboard',
  ADMIN: '/admin/dashboard',
};
