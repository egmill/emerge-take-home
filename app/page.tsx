'use client';

import { useState, useEffect } from 'react';

interface Student {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  urgency_score: number;
  summary: string;
  acknowledged: number;
  last_updated: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'top-priority' | 'all'>('top-priority');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStudents(true, activeTab);
  }, [activeTab]);

  const fetchStudents = async (showLoading: boolean = true, tab: 'top-priority' | 'all' = activeTab) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await fetch('/api/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      
      let filteredStudents: Student[];
      
      if (tab === 'top-priority') {
        // Filter to only non-acknowledged students (acknowledged = 0)
        filteredStudents = data.students.filter((s: Student) => s.acknowledged === 0);
        // Sort by urgency (highest to lowest), then by last_updated (most recent first)
        filteredStudents.sort((a: Student, b: Student) => {
          if (b.urgency_score !== a.urgency_score) {
            return b.urgency_score - a.urgency_score;
          }
          return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
        });
        // Take top 10
        filteredStudents = filteredStudents.slice(0, 10);
      } else {
        // Show all students
        filteredStudents = data.students;
        // Sort by urgency (highest to lowest), then by last_updated (most recent first)
        filteredStudents.sort((a: Student, b: Student) => {
          if (b.urgency_score !== a.urgency_score) {
            return b.urgency_score - a.urgency_score;
          }
          return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
        });
      }
      
      setStudents(filteredStudents);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleGetRecommendedMessage = async (studentId: string) => {
    if (loadingMessages.has(studentId) || messages[studentId]) {
      return;
    }

    try {
      setLoadingMessages(prev => new Set(prev).add(studentId));
      const response = await fetch(`/api/students/${studentId}/outreach`);
      if (!response.ok) {
        throw new Error('Failed to generate message');
      }
      const data = await response.json();
      setMessages(prev => ({ ...prev, [studentId]: data.message }));
    } catch (err) {
      console.error('Error generating message:', err);
      setMessages(prev => ({ ...prev, [studentId]: 'Error generating message. Please try again.' }));
    } finally {
      setLoadingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  const handleAcknowledge = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}/acknowledge`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to acknowledge student');
      }
      // Clear the message for this student
      setMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[studentId];
        return newMessages;
      });
      // Refetch students to get the next highest priority student (without showing loading screen)
      await fetchStudents(false, activeTab);
    } catch (err) {
      console.error('Error acknowledging student:', err);
      alert('Failed to acknowledge student. Please try again.');
    }
  };

  const getCardColor = (urgency: number, acknowledged: number): string => {
    if (acknowledged === 1) {
      return 'bg-gray-100 border-gray-300';
    }
    if (urgency > 80) return 'bg-red-50 border-red-300';
    if (urgency >= 60) return 'bg-orange-50 border-orange-300';
    if (urgency >= 40) return 'bg-yellow-50 border-yellow-300';
    return 'bg-green-50 border-green-300';
  };

  const getTextColor = (urgency: number, acknowledged: number): string => {
    if (acknowledged === 1) {
      return 'text-gray-600';
    }
    if (urgency > 80) return 'text-red-800';
    if (urgency >= 60) return 'text-orange-800';
    if (urgency >= 40) return 'text-yellow-800';
    return 'text-green-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading students...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Student Triage Dashboard</h1>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('top-priority')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'top-priority'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Top Priority
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Students
              </button>
            </nav>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">
              {activeTab === 'top-priority' 
                ? 'No unacknowledged students at this time.' 
                : 'No students found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student.id}
                className={`rounded-lg border-2 p-6 shadow-md flex flex-col relative ${getCardColor(student.urgency_score, student.acknowledged)}`}
              >
                {/* Grey overlay for acknowledged students */}
                {student.acknowledged === 1 && (
                  <div className="absolute inset-0 bg-gray-400/40 rounded-lg pointer-events-none z-10" />
                )}
                
                <div className="mb-4 flex-grow relative z-20">
                  <div className="mb-2">
                    <h2 className={`text-xl font-semibold ${getTextColor(student.urgency_score, student.acknowledged)}`}>
                      {student.name}
                    </h2>
                  </div>
                  <p className={`text-sm ${getTextColor(student.urgency_score, student.acknowledged)} mt-3 leading-relaxed`}>
                    {student.summary}
                  </p>
                </div>

                <div className="mt-auto space-y-3 relative z-20">
                  {messages[student.id] && (
                    <div className="mb-3 p-3 bg-white/70 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {messages[student.id]}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleGetRecommendedMessage(student.id)}
                    disabled={loadingMessages.has(student.id) || student.acknowledged === 1}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {loadingMessages.has(student.id) ? 'Generating...' : 'Recommend Message'}
                  </button>

                  {student.acknowledged === 0 ? (
                    <button
                      onClick={() => handleAcknowledge(student.id)}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Acknowledge
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Acknowledged
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
