# SINDH Frontend

A modern React-based web application for connecting daily wage workers with employers, built with a focus on user experience and accessibility.

## 🚀 Features

- Modern UI with Tailwind CSS and Framer Motion animations
- Responsive design for all device sizes
- Multi-language support (English and Hindi)
- Real-time job matching and notifications
- Worker profile management
- Job posting and search functionality
- Secure authentication system

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Context API
- **API Communication**: Axios
- **Authentication**: Firebase
- **Notifications**: Twilio, MessageBird
- **Email Services**: EmailJS, Nodemailer
- **Data Processing**: PapaParse

## 📦 Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd SINDH-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add necessary environment variables:
```env
REACT_APP_API_URL=your_backend_url
REACT_APP_FIREBASE_CONFIG=your_firebase_config
```

4. Start the development server:
```bash
npm start
```

## 🏗️ Project Structure

```
SINDH-frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── assets/        # Static assets
│   └── App.js         # Main application component
├── public/            # Public assets
├── config/            # Configuration files
└── package.json       # Project dependencies
```

## 🚀 Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Runs the test suite
- `npm eject`: Ejects from Create React App

## 🔒 Environment Variables

The following environment variables are required:

- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_FIREBASE_CONFIG`: Firebase configuration
- `REACT_APP_TWILIO_ACCOUNT_SID`: Twilio Account SID
- `REACT_APP_TWILIO_AUTH_TOKEN`: Twilio Auth Token
- `REACT_APP_MESSAGEBIRD_API_KEY`: MessageBird API Key

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
