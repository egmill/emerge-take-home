import { NextResponse } from 'next/server';
import { getStudent } from '@/lib/studentMap';
import { generateOutreachMessage } from '@/lib/scoring/llm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const student = await getStudent(studentId);
    
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    const message = await generateOutreachMessage(student);
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error generating outreach message:', error);
    return NextResponse.json(
      { error: 'Failed to generate outreach message' },
      { status: 500 }
    );
  }
}
