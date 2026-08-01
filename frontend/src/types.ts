// Shared type contracts for the SAMS frontend, matching the PHP API's
// JSON response shapes exactly (see Section 6.2.3 - this file is the
// single source of truth kept manually in sync with the backend).

export type Role = 'admin' | 'lecturer' | 'student';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  lecturerName: string;
  studentCount: number | null;
}

export interface RosterEntry {
  studentId: number;
  studentName: string;
  enrolmentId: number;
  status: 'present' | 'absent' | 'late' | null;
}

export interface SessionRoster {
  sessionId: number;
  courseId: number;
  date: string;
  roster: RosterEntry[];
}

export interface TrendPoint {
  week: string;
  rate: number;
}

export interface StudentSummary {
  attendanceRate: number;
  present: number;
  late: number;
  absent: number;
  total: number;
  trend: TrendPoint[];
}

export interface StudentCourseHistory {
  courseId: number;
  courseName: string;
  courseCode: string;
  summary: StudentSummary;
}

export interface PerStudentRow {
  studentId: number;
  studentName: string;
  attendanceRate: number;
  present: number;
  late: number;
  absent: number;
  total: number;
}

export interface AtRiskEntry {
  studentId: number;
  studentName: string;
  attendanceRate: number;
}

export interface CourseDashboard {
  courseId: number;
  overallAttendanceRate: number;
  studentCount: number;
  trend: TrendPoint[];
  perStudent: PerStudentRow[];
  atRisk: AtRiskEntry[];
}

export interface NotificationItem {
  id: number;
  message: string;
  attendanceRate: number;
  isRead: boolean;
  createdAt: string;
  courseName: string;
}

export interface ManagedUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface RosterStudent {
  studentId: number;
  fullName: string;
  email: string;
  enrolmentId?: number;
}

export interface ManageRosterResponse {
  courseId: number;
  enrolled: RosterStudent[];
  available: RosterStudent[];
}
