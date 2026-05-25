export interface Proposal {
  id: string;
  createdAt: string;
  supervisor_fullname: string;
  supervisor_rank: string;
  supervisor_email: string;
  cosupervisor_name?: string;
  cosupervisor_rank?: string;
  cosupervisor_email?: string;
  cosupervisor_phone?: string;
  specialty: string;
  title_arabic: string;
  title_english: string;
  work_type: string; // e.g., "نظري, تطبيقي"
  summary: string;
  keywords: string;
  updatedAt?: string;
}

export interface PedagogicalWish {
  id: string;
  createdAt: string;
  teacher_name: string;
  teacher_rank: string;
  teacher_email: string;
  department: string;
  department_label: string;
  module_name: string;
  year_level: string;
  lesson_types: string[];
  group_count?: string | number;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  updatedAt?: string;
}

