# 🔗 QRIS Invoice Generator - Backend API

Backend API server untuk QRIS Invoice Generator yang dibuat dengan Express.js dan MongoDB Atlas.

## 🚀 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Rate Limiting** - API protection

## 📦 Installation & Setup

### 1. Clone Repository
```bash
git clone <backend-repository-url>
cd qris-invoice-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` dan edit sesuai konfigurasi Anda:

```bash
cp .env.example .env
```

Edit file `.env`:
```env
MONGODB_URI=mongodb+srv://xxxxx
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
FRONTEND_PROD_URL=https://your-frontend-domain.vercel.app
```

### 4. Run Development Server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3001`

### 5. Test API
```bash
curl http://localhost:3001/api/health
```

## 📡 API Endpoints

### Health Check
- **GET** `/api/health` - Server health status
- **GET** `/api` - API information

### Invoices
- **POST** `/api/invoices` - Create new invoice
- **GET** `/api/invoices/:invoiceNumber` - Get invoice by number
- **GET** `/api/invoices` - Get all invoices (with pagination)
- **DELETE** `/api/invoices/:invoiceNumber` - Delete invoice

## 📊 Request/Response Examples

### Create Invoice
**POST** `/api/invoices`
```json
{
  "invoiceNumber": "INV-1234567890-123",
  "merchantInfo": {
    "name": "Toko ABC",
    "location": "Jakarta"
  },
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+62812345678",
    "address": "Jl. Contoh No. 123"
  },
  "items": [
    {
      "id": "1",
      "name": "Produk A",
      "quantity": 2,
      "price": 50000,
      "total": 100000
    }
  ],
  "subtotal": 100000,
  "total": 100000,
  "dynamicQRCode": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice saved successfully",
  "invoiceId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "invoiceNumber": "INV-1234567890-123",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Invoice
**GET** `/api/invoices/INV-1234567890-123`

**Response:**
```json
{
  "success": true,
  "invoice": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "invoiceNumber": "INV-1234567890-123",
    "merchantInfo": {...},
    "customerInfo": {...},
    "items": [...],
    "total": 100000,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🚀 Deployment

### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Render
1. Connect GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Set environment variables

### Heroku
```bash
heroku create qris-invoice-backend
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set NODE_ENV=production
git push heroku main
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS** - Configured for specific frontend domains
- **Input Validation** - Mongoose schema validation
- **Error Handling** - Proper error responses

## 📊 Database Schema

```javascript
{
  invoiceNumber: String (unique, required),
  merchantInfo: {
    name: String,
    location: String
  },
  customerInfo: {
    name: String (required),
    email: String,
    phone: String,
    address: String
  },
  items: [{
    id: String,
    name: String (required),
    quantity: Number (required, min: 1),
    price: Number (required, min: 0),
    total: Number (required, min: 0)
  }],
  total: Number (required, min: 0),
  dynamicQRCode: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Scripts

- `npm start` - Production server
- `npm run dev` - Development server with nodemon
- `npm run build` - No build step required

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `FRONTEND_URL` | Frontend development URL | http://localhost:5173 |
| `FRONTEND_PROD_URL` | Frontend production URL | Required for CORS |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

---

**Made with ❤️ for PayInvoicely QRIS Invoice Generator**