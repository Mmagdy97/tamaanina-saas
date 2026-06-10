export interface Child {
  id: string;
  name: string;
  age: number;
  parentName: string;
  status: 'Active' | 'On Hold' | 'Completed';
  lastSession: string;
  milestones: string[];
}

export interface Therapist {
  id: string;
  name: string;
  specialization: string;
  availability: 'Available' | 'In Session' | 'Offline';
  activeCases: number;
  email: string;
}

export const mockChildren: Child[] = [
  {
    id: 'c1',
    name: 'أحمد محمد',
    age: 6,
    parentName: 'إيمان محمد',
    status: 'Active',
    lastSession: '2024-05-15',
    milestones: ['تحسن في التواصل البصري', 'بناء جمل بسيطة'],
  },
  {
    id: 'c2',
    name: 'ليلى إبراهيم',
    age: 4,
    parentName: 'داوود إبراهيم',
    status: 'Active',
    lastSession: '2024-05-18',
    milestones: ['تقليل الحساسية الحسية', 'مشاركة الألعاب'],
  },
  {
    id: 'c3',
    name: 'سارة خالد',
    age: 8,
    parentName: 'صوفيا خالد',
    status: 'Completed',
    lastSession: '2024-04-10',
    milestones: ['إتقان التنظيم الذاتي', 'الاندماج الاجتماعي مع الأقران'],
  },
  {
    id: 'c4',
    name: 'عمر علي',
    age: 7,
    parentName: 'علي بن حسن',
    status: 'Active',
    lastSession: '2024-05-19',
    milestones: ['التعبير عن المشاعر لفظياً'],
  },
];

export const mockTherapists: Therapist[] = [
  {
    id: 't1',
    name: 'د. إلينا مراد',
    specialization: 'علاج النطق',
    availability: 'Available',
    activeCases: 8,
    email: 'elena.m@tamaanina.com',
  },
  {
    id: 't2',
    name: 'د. يوسف زكي',
    specialization: 'العلاج الوظيفي',
    availability: 'In Session',
    activeCases: 12,
    email: 'youssef.z@tamaanina.com',
  },
  {
    id: 't3',
    name: 'سارة منصور',
    specialization: 'العلاج السلوكي',
    availability: 'Offline',
    activeCases: 5,
    email: 'sarah.m@tamaanina.com',
  },
];
