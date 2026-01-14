import Anthropic from '@anthropic-ai/sdk';
import { StudentRecord } from '../types';

// Initialize client - will be null if no API key
const client = process.env.CLAUDE_API_KEY 
  ? new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  : null;

/**
 * Generate a recommended outreach message for a student based on their record
 * Returns a default message if API unavailable
 */
export async function generateOutreachMessage(student: StudentRecord): Promise<string> {
  // If no API key, return default message
  if (!client) {
    console.warn('No Anthropic API key - returning default outreach message');
    return `Hi ${student.first_name}, I wanted to check in and see how things are going. Let me know if you need any support!`;
  }

  try {
    // Format recent events for context
    const eventsContext = student.recent_events.length > 0
      ? student.recent_events.map((event, idx) => {
          const date = new Date(event.timestamp).toLocaleDateString();
          let eventSummary = '';
          
          switch (event.type) {
            case 'call_transcript':
              eventSummary = `Call transcript: "${event.value.substring(0, 200)}${event.value.length > 200 ? '...' : ''}"`;
              break;
            case 'message':
              eventSummary = `Message: "${event.value.substring(0, 200)}${event.value.length > 200 ? '...' : ''}"`;
              break;
            case 'exam_score':
              eventSummary = `Exam score: ${event.value}`;
              break;
            case 'milestone':
              try {
                const milestone = JSON.parse(event.value);
                eventSummary = `Milestone: ${milestone.name || 'Upcoming milestone'} on ${new Date(milestone.date).toLocaleDateString()}`;
              } catch {
                eventSummary = `Milestone: ${event.value}`;
              }
              break;
            case 'video_watched':
              eventSummary = `Video watched: ${event.value} complete`;
              break;
            default:
              eventSummary = `${event.type}: ${event.value}`;
          }
          
          return `${idx + 1}. ${date} - ${eventSummary}`;
        }).join('\n')
      : 'No recent events';

    // Determine urgency context
    let urgencyContext = '';
    if (student.urgency >= 90) {
      urgencyContext = 'CRISIS - This student needs immediate attention (job loss, emergency, death, health crisis, eviction)';
    } else if (student.urgency >= 60) {
      urgencyContext = 'HIGH PRIORITY - Student has significant blockers (tech failure, transportation, childcare, unreachable)';
    } else if (student.urgency >= 30) {
      urgencyContext = 'MEDIUM PRIORITY - Student may need support (confusion, struggling with material, mild stress)';
    } else {
      urgencyContext = 'LOW PRIORITY - Student appears to be doing well (on track, positive, no blockers)';
    }

    const message = await client!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Generate a personalized outreach message for a student based on their record.

Student Information:
- Name: ${student.first_name} ${student.last_name}
- Student ID: ${student.student_id}
- Urgency Score: ${student.urgency}/99
- Urgency Level: ${urgencyContext}

Recent Events (most recent first):
${eventsContext}

Guidelines for the outreach message:
1. Be empathetic and supportive
2. Match the tone to the urgency level (more urgent = more direct and supportive)
3. Reference specific events when relevant (e.g., "I saw your exam score..." or "I noticed your message about...")
4. For crisis situations (90+), be direct about available support resources
5. For low urgency (0-29), keep it brief and positive
6. Keep the message professional but warm
7. Include a clear call-to-action (e.g., "Let me know how I can help" or "Feel free to reach out")
8. Keep it concise (2-4 sentences typically)

Generate ONLY the outreach message text, nothing else.`
      }]
    });

    // Extract the response text
    const block = message.content.find((c) => c.type === 'text') as { type: 'text'; text: string } | undefined;
    const response = block && typeof block.text === 'string' ? block.text.trim() : '';

    // Validate response
    if (!response) {
      console.warn('Empty LLM response, returning default message');
      return `Hi ${student.first_name}, I wanted to check in and see how things are going. Let me know if you need any support!`;
    }

    return response;

  } catch (error) {
    console.error('LLM outreach message error:', error);
    // Return default message on error
    return `Hi ${student.first_name}, I wanted to check in and see how things are going. Let me know if you need any support!`;
  }
}