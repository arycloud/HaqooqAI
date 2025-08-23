# HaqooqAI Frontend

A modern React-based frontend for HaqooqAI, an AI-powered Pakistani legal assistant.

## Features

- **AI-Powered Legal Assistant**: Get instant answers to Pakistani legal questions
- **Backend-Integrated Architecture**: Complete client-server separation with backend API
- **Source Citations**: Every answer includes references to legal documents
- **GitHub OAuth Authentication**: Secure login handled through backend service
- **Quota Management**: Daily query limits with API key support for unlimited access
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: Comprehensive error handling with user-friendly notifications

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks + Zustand (minimal usage)
- **Backend Integration**: Complete API-based communication
- **Authentication**: GitHub OAuth via backend service
- **Backend API**: FastAPI (deployed on Hugging Face Spaces)
- **Deployment**: GitHub Pages via GitHub Actions

## Architecture

This frontend follows a **client-server architecture**:
- **Frontend**: Pure client application handling UI and user interactions
- **Backend**: Complete service layer handling authentication, database, and AI processing
- **Communication**: All data operations via backend API endpoints

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to HaqooqAI backend service
- GitHub OAuth app configured for backend

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_BACKEND_URL=https://ary91-haqooqai-backend.hf.space
VITE_APP_URL=https://arycloud.github.io/HaqooqAI
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/arycloud/HaqooqAI.git
cd HaqooqAI/frontend/HaqooqAI-frontend-clean
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── conversations/  # Chat and conversation components
│   ├── layout/         # Layout components (Header, Sidebar)
│   ├── legal/          # Legal prompt cards
│   ├── settings/       # Settings and configuration
│   └── ui/             # Reusable UI components (shadcn/ui)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API and service layers
│   └── backend/        # Backend API integration
├── store/              # Zustand state management (minimal usage)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Components

### Authentication
- Complete backend-dependent authentication
- GitHub OAuth integration via backend
- Token management and validation
- User session persistence

### Conversations
- Backend API-based conversation management
- Message history and creation
- Conversation CRUD operations

### AI Integration
- Backend API communication for AI queries
- Quota management and API key support
- Source citation handling

## Deployment

The frontend is automatically deployed to GitHub Pages when changes are pushed to the main branch. The deployment workflow:

1. Builds the React application
2. Configures environment variables
3. Deploys to GitHub Pages
4. Updates the live site at [https://arycloud.github.io/HaqooqAI](https://arycloud.github.io/HaqooqAI)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support or questions, please open an issue on GitHub or contact the development team.

---

**HaqooqAI** - Making Pakistani legal information accessible through AI technology.
