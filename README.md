# myBucks 💰

A full-stack web application for tracking personal financial transactions with a clean, intuitive interface.

## 🚀 Features

- **Add Transactions**: Record income and expenses with descriptions and timestamps
- **Smart Sorting**: Sort transactions by date (latest/oldest) or amount (highest/lowest)
- **Real-time Balance**: Automatically calculated balance with visual indicators
- **Delete Transactions**: Remove unwanted entries with confirmation
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Production Ready**: Includes security, logging, and monitoring features

## 🛠️ Tech Stack

**Frontend:**
- React 19.1.0
- CSS3 with responsive design
- Modern ES6+ JavaScript

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- Winston logging
- Helmet security middleware
- Express Rate Limiting
- Input validation with express-validator

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn package manager
- MongoDB (local installation or MongoDB Atlas account)

## ⚡ Quick Start

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd myBucks
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Copy the example environment file and configure your settings:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017/mybucks

# API Configuration
PORT=4040
NODE_ENV=development

# Frontend Configuration
REACT_APP_API_URL=http://localhost:4040/api
```

### 4. Start MongoDB
Ensure MongoDB is running on your system or configure MongoDB Atlas connection.

### 5. Run the application

**Development mode (runs both frontend and backend):**
```bash
npm run dev
```

**Or run separately:**

Backend only:
```bash
npm run server
```

Frontend only:
```bash
npm start
```

### 6. Access the application
- Frontend: http://localhost:3000
- API: http://localhost:4040/api
- Health Check: http://localhost:4040/api/health

## 📖 API Documentation

### Base URL
```
http://localhost:4040/api
```

### Endpoints

#### Health Check
```http
GET /api/health
```
Returns server health status and database connection info.

#### Get Transactions
```http
GET /api/transactions?sort=latest&limit=100&offset=0
```
**Query Parameters:**
- `sort`: `latest`, `oldest`, `highest`, `lowest`
- `limit`: Number of transactions to return (max 1000)
- `offset`: Number of transactions to skip for pagination

#### Create Transaction
```http
POST /api/transaction
Content-Type: application/json

{
  "name": "Grocery Shopping",
  "description": "Weekly groceries",
  "price": -150.50,
  "datetime": "2024-01-15T10:30:00.000Z"
}
```

#### Delete Transaction
```http
DELETE /api/transaction/:id
```

### Response Format
```json
{
  "transactions": [...],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

## 🏗️ Project Structure

```
myBucks/
├── src/                    # React frontend source
│   ├── App.js             # Main React component
│   ├── App.css            # Application styles
│   └── index.js           # React entry point
├── api/                   # Express backend
│   ├── index.js           # Main server file
│   └── models/
│       └── Transaction.js # MongoDB transaction model
├── public/                # Static assets
├── logs/                  # Application logs
├── package.json           # Dependencies and scripts
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=80
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/mybucks
REACT_APP_API_URL=https://yourdomain.com/api
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Using Docker
```bash
docker build -t mybucks .
docker run -p 4040:4040 --env-file .env mybucks
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Server-side validation for all inputs
- **Environment Variables**: Secure configuration management
- **Error Handling**: Comprehensive error handling and logging

## 📊 Monitoring

- **Health Check Endpoint**: `/api/health`
- **Winston Logging**: Structured logging with file rotation
- **Request Logging**: Morgan HTTP request logger
- **Database Connection Monitoring**: Real-time connection status

## 🧪 Testing

```bash
npm test
```

## 📝 Scripts

- `npm start` - Start React development server
- `npm run server` - Start Express API server
- `npm run dev` - Start both frontend and backend concurrently
- `npm run build` - Build React app for production
- `npm test` - Run test suite

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running locally or check your Atlas connection string
   - Verify the MONGO_URL in your .env file

2. **API Not Accessible**
   - Check if the backend server is running on the correct port
   - Verify REACT_APP_API_URL matches your backend URL

3. **CORS Issues**
   - Ensure frontend origin is allowed in CORS configuration
   - Check ALLOWED_ORIGINS environment variable for production

### Getting Help

- Check the application logs in the `logs/` directory
- Visit the health check endpoint: `/api/health`
- Review environment variable configuration

---

**Happy tracking! 💰**
