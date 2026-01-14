export interface StudentEvent {
    event_id: string;
    student_id: string;
    first_name: string;
    last_name: string;
    type: 'call_transcript' | 'exam_score' | 'message' | 'milestone' | 'video_watched';
    value: string;
    timestamp: string;
  }
  
  export interface StudentRecord {
    student_id: string;
    first_name: string;
    last_name: string;
    recent_events: StudentEvent[];
    last_updated: string;
    urgency: number;
    summary: string;
    acknowledged: number; // 0 or 1
  }
  
  export type StudentMap = Record<string, StudentRecord>;
  
  // Helper to format student name for display
  export function formatStudentName(record: StudentRecord): string {
    return `${record.first_name} ${record.last_name} (${record.student_id})`;
  }