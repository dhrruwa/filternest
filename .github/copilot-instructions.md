# GitHub Copilot Instructions

## Project Overview
Water Filter Service Management System - A production-ready full-stack application for managing water purifier servicing, maintenance schedules, and customer bookings.

## Technology Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: Zustand
- **API Client**: Axios
- **Validation**: Express-validator + Client-side validation
- **Email**: Nodemailer
- **Scheduling**: Node-cron
- **Notifications**: Multi-channel (Email, SMS/WhatsApp ready)

## Project Structure
- `/server` - Express backend with models, controllers, routes, middleware, services
- `/client` - React frontend with pages, components, services, context
- Configuration files for both frontend and backend
- `.env.example` files for environment setup

## Key Features Implemented
1. ✅ Customer registration, login, and profile management
2. ✅ Service booking system with geolocation capture
3. ✅ Service agent dashboard with status updates
4. ✅ Admin dashboard with analytics
5. ✅ Automatic maintenance scheduling (3-month pre-filter, 6-month membrane)
6. ✅ Email notifications and reminders
7. ✅ Role-based access control
8. ✅ JWT authentication and authorization
9. ✅ Mobile-responsive UI with Tailwind CSS
10. ✅ Smooth animations with Framer Motion

## Development Guidelines
- Use `.env` files for sensitive configuration
- Follow REST API conventions for endpoints
- Implement proper error handling and validation
- Keep components modular and reusable
- Use Zustand for global state management in React
- Document all API endpoints and their requirements

## Database Schema
- Customers: User profiles with location tracking
- Agents: Service professionals with location and status
- Bookings: Service requests with status and assignment
- MaintenanceSchedules: Automatic reminder tracking
- Notifications: Multi-channel notification management
- Invoices: Payment and service records
- Services: Service catalog and pricing
- Admins: Admin user management

## Running the Application
1. Backend: `cd server && npm run dev` (runs on port 5000)
2. Frontend: `cd client && npm run dev` (runs on port 3000)

## Important Notes
- Scheduler starts automatically on server initialization
- JWT tokens expire after 7 days by default
- All passwords are hashed using bcrypt
- Geolocation uses browser's Geolocation API
- Email service uses Nodemailer (configure SMTP settings)
- Rate limiting enabled to prevent abuse

## Next Steps for Deployment
1. Set up MongoDB Atlas or local MongoDB instance
2. Configure email service (SMTP or SendGrid)
3. Add Google Maps API key for maps integration
4. Set up environment variables for production
5. Build frontend: `npm run build`
6. Deploy backend to hosting (Heroku, AWS, DigitalOcean, etc.)
7. Deploy frontend to hosting (Vercel, Netlify, AWS S3, etc.)
