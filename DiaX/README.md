# DiaX - Diabetes Management Assistant

![DiaX Logo](public/logo.png)

DiaX is a comprehensive diabetes management platform designed to help users track their health metrics, get personalized advice, and access educational resources about diabetes care.

## Features

- **Health Tracking**: Monitor blood glucose, blood pressure, heart rate, weight, A1C, and exercise
- **Interactive Chat**: Get personalized advice and answers from our AI assistant
- **Educational Resources**: Access curated articles and guides about diabetes management
- **User Profiles**: Maintain personal and medical information for personalized care
- **Data Visualization**: View trends and patterns in your health metrics through interactive charts
- **Mobile Responsive**: Access your diabetes management tools on any device

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS, Framer Motion
- **State Management**: React Context API, SWR for data fetching
- **Authentication**: JWT-based authentication
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/diax.git
   cd diax
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   \`\`\`
   NEXT_PUBLIC_API_URL=https://diax.fileish.com/api
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

\`\`\`
diax/
├── app/                  # Next.js App Router
│   ├── dashboard/        # Dashboard pages
│   ├── login/            # Authentication pages
│   └── register/         # User registration
├── components/           # React components
│   ├── ui/               # UI components (shadcn)
│   └── ...               # Custom components
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and API services
├── public/               # Static assets
└── ...
\`\`\`

## Key Components

### Health Tracking

The health tracking system allows users to:
- Record blood glucose readings
- Track blood pressure measurements
- Monitor heart rate
- Log weight changes
- Record A1C results
- Track exercise activities

### Chat Assistant

The AI-powered chat assistant provides:
- Personalized diabetes management advice
- Educational information about diabetes
- Answers to questions about medications, diet, and lifestyle

### Resources

The resources section offers:
- Articles about diabetes management
- Guides for healthy living with diabetes
- Educational materials about diabetes care

## Contributing

We welcome contributions to DiaX! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest features.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors who have helped build DiaX
- Special thanks to the diabetes community for their feedback and support
\`\`\`

Let's also add an Avatar component to our UI components if it doesn't exist yet:
