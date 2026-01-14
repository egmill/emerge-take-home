import { NextResponse } from 'next/server';
import { acknowledgeStudent } from '@/lib/studentMap';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const success = await acknowledgeStudent(studentId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error acknowledging student:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge student' },
      { status: 500 }
    );
  }
}
