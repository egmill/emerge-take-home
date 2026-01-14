## Documents
(https://docs.google.com/document/d/1arFDRiX628bxzR7hhWCc8A0xzaG0eGLhwkCLRTOfGtI/edit?usp=sharing)[Segmentation & Prioritization Framework]
(https://docs.google.com/document/d/1k9i7q05O1rMBYrkdwuqhYe9Khr0tJ68fjNLgWeCb0-Y/edit?usp=sharing)[Stakeholder Communication]

## Prerequisites

- Node.js 18+ 
- npm or yarn
- An Anthropic API key (get one at https://console.anthropic.com/ or reach out to me to borrow mine).

## Installation

1. **Clone the repository**
```bash
   git clone https://github.com/egmill/emerge-take-home.git
   cd emerge-take-home
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up environment variables**
```bash
   cp .env.example .env.local
```

4. **Add your Anthropic API key**
   
   Open `.env.local` and add your API key:
```
   CLAUDE_API_KEY=your_actual_api_key_here
```

5. **Run the development server**
```bash
   npm run dev
```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Discussion + Tradeoffs

 This algorithm is implemented using the logic outlined in the (https://docs.google.com/document/d/1arFDRiX628bxzR7hhWCc8A0xzaG0eGLhwkCLRTOfGtI/edit?tab=t.0)[Segmentation & Prioritization Framework] document. Notably:
 1. All student record scoring is done logically, using keyword identification for messages/call transcripts, score bracketing for exam scores, video percentages and timestamps for videos watched, and timeboxing for milestones. A more robust version of this software should use limited LLM calls to help process messages and call transcripts. I chose not to integrate an LLM for the purpose of this demo to avoid very costly and time-consuming repeated LLM calls, since I didn't have time to narrow down on an appropriately limited scope of use for LLM integration in scoring.
 2. This implementation is serverless for the sake of simplicity; modifications to the data (i.e., acknowledging students' statuses) will not persist.
 3. This implementation integrates an LLM via Anthropic API for the purpose of generating a recommended message for high-risk students. This very limited scope of LLM incorporation is, in my opinion, the use case within this dashboard that most urgently requires LLM integration. With more time and resources, LLMs could be used to handle and improve virtually every step of this process depending on prioritization.
