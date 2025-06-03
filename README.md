# Zero Analytics Dashboard

A full-stack analytics dashboard for hospitality and retail, providing sales insights via a modern, glassy UI.

## Features

- Sales Summary KPIs
- Sales Trends Line Chart
- Sales Heatmap
- Donut Charts for Top/Bottom Items
- CSV Upload
- Robust error handling and loading states
- Modern, glassy, glowing UI

## Tech Stack

### Frontend
- React + TypeScript (Vite)
- Tailwind CSS
- CSS Modules
- Glassmorphic UI
- Recharts for data visualization

### Backend
- FastAPI (Python)
- Uvicorn
- Supabase (Postgres)

### DevOps/Deployment
- GitHub (source control)
- Vercel (frontend hosting)
- Render (backend hosting)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Supabase account

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_ENABLE_CSV_UPLOAD=true
   VITE_ENABLE_EXPORT=true
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   FRONTEND_URL=http://localhost:5173
   ```

4. Start the development server:
   ```bash
   uvicorn main:app --reload
   ```

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel:
   - `VITE_API_URL`: Your Render backend URL
   - `VITE_ENABLE_CSV_UPLOAD`: true
   - `VITE_ENABLE_EXPORT`: true

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure environment variables:
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_KEY`: Your Supabase key
   - `FRONTEND_URL`: Your Vercel frontend URL

## Development

### Available Scripts

Frontend:
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run type-check`: Run TypeScript type checking

Backend:
- `uvicorn main:app --reload`: Start development server
- `uvicorn main:app`: Start production server

### API Endpoints

- `/sales/summary`: Get sales summary
- `/sales/trends`: Get sales trends
- `/sales/heatmap`: Get sales heatmap
- `/sales/items`: Get item analytics
- `/upload-csv`: Upload CSV data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 