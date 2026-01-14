import { NextResponse } from 'next/server';
import { getStudentsArray, getMapStats, formatStudentName } from '@/lib/studentMap';

export async function GET() {
  try {
    const students = await getStudentsArray();
    const stats = await getMapStats();
    
    const formattedStudents = students.map(student => ({
      id: student.student_id,
      name: formatStudentName(student),
      first_name: student.first_name,
      last_name: student.last_name,
      urgency_score: student.urgency, 
      recent_events: student.recent_events,
      event_count: student.recent_events.length,
      last_updated: student.last_updated,
      summary: student.summary,
      acknowledged: student.acknowledged
    }));
    
    return NextResponse.json({
      students: formattedStudents,
      stats
    });
  } catch (error) {
    console.error('Error loading students:', error);
    return NextResponse.json(
      { error: 'Failed to load students' },
      { status: 500 }
    );
  }
}
