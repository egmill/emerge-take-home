import { StudentEvent, StudentRecord, StudentMap } from './types';
import { calculateStudentUrgency, generateStudentSummary } from './scoring/scoring';

// In-memory storage - resets on server restart (fine for interview!)
let studentMap: StudentMap = {};
let isInitialized = false;

/**
 * Fetch student event data from the API
 */
async function fetchStudentEventData(): Promise<StudentEvent[]> {
  try {
    const response = await fetch('https://us-central1-ameelio-emerge.cloudfunctions.net/fetchFakeStudentEventLogs', {
      method: 'GET',
      headers: {
        'X-API-Key': 'interview-test-key-2024',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch student event data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data as StudentEvent[];
  } catch (error) {
    console.error('Error fetching student event data:', error);
    throw error;
  }
}

/**
 * Initialize or update the student map from API
 */
export async function initializeStudentMap(): Promise<StudentMap> {
  const events = await fetchStudentEventData();
  
  for (const event of events) {
    const studentId = event.student_id;

    // Create new student record if doesn't exist
    if (!studentMap[studentId]) {
      studentMap[studentId] = {
        student_id: studentId,
        first_name: event.first_name,
        last_name: event.last_name,
        recent_events: [],
        last_updated: new Date().toISOString(),
        urgency: 0,
        summary: 'No recent activity.',
        acknowledged: 0,
      };
    }

    const student = studentMap[studentId];

    // Check if this event already exists
    const eventExists = student.recent_events.some(
      e => e.event_id === event.event_id
    );

    if (!eventExists) {
      // Add the new event
      student.recent_events.push(event);

      // Sort by timestamp (most recent first)
      student.recent_events.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Keep only 3 most recent
      student.recent_events = student.recent_events.slice(0, 3);

      student.last_updated = new Date().toISOString();
      
      // Recalculate urgency score immediately after adding event
      student.urgency = await calculateStudentUrgency(student.recent_events);
      
      // Generate summary from recent events
      student.summary = await generateStudentSummary(student.recent_events);
      
      // Reset acknowledged to 0 when events are updated
      student.acknowledged = 0;
    }
  }

  isInitialized = true;
  return studentMap;
}

/**
 * Get the student map (initializes if needed)
 */
export async function getStudentMap(): Promise<StudentMap> {
  if (!isInitialized) {
    await initializeStudentMap();
  }
  return studentMap;
}

/**
 * Get all students as an array
 */
export async function getStudentsArray(): Promise<StudentRecord[]> {
  const map = await getStudentMap();
  return Object.values(map);
}

/**
 * Get a specific student
 */
export async function getStudent(studentId: string): Promise<StudentRecord | null> {
  const map = await getStudentMap();
  return map[studentId] || null;
}

/**
 * Format student name for display
 */
export function formatStudentName(record: StudentRecord): string {
  return `${record.first_name} ${record.last_name} (${record.student_id})`;
}

/**
 * Acknowledge a student (set acknowledged to 1)
 */
export async function acknowledgeStudent(studentId: string): Promise<boolean> {
  const map = await getStudentMap();
  const student = map[studentId];
  
  if (!student) {
    return false;
  }
  
  student.acknowledged = 1;
  return true;
}

/**
 * Get stats
 */
export async function getMapStats() {
  const students = await getStudentsArray();
  const totalEvents = students.reduce((sum, s) => sum + s.recent_events.length, 0);
  
  return {
    totalStudents: students.length,
    totalEvents,
    initialized: isInitialized
  };
}