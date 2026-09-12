# MindComfort - Frontend Client

MindComfort is a web-based single-page application built to provide an anonymous and affordable space for mental well-being and catharsis. This repository contains the client-side user interfaces, real-time chat views, live audio listener/broadcaster screens, and role-based administrative dashboards.

* **Live Application URL**: http://13.60.72.235
* **Backend Repository**: https://github.com/Iqra-Mushtak/MindComfort.git

---

## Technologies Used

* **React.js**: Core frontend library for building interactive, component-based user interfaces.
* **Vite**: Modern frontend build tool for fast local development and optimized production builds.
* **Bootstrap & Custom CSS**: Responsive UI design, forms, navigation, and modal styling.
* **Socket.io Client**: Real-time event handling for community chatrooms, live podcast comments, and instant alerts.
* **Agora RTC SDK**: Audio engine integration for real-time live podcast streaming and microphone publishing.
* **Axios**: HTTP client configured with base URL and JWT interceptors for communicating with the backend API.

---

## Core System Features & Portals

* **Client Dashboard**:
  * Join community chatrooms with automatic anonymous ID masking for full privacy.
  * Browse dynamic mental health subscription tiers and buy passes via Stripe checkout.
  * Tune into live mentor podcasts and submit private real-time comments.
* **Mentor Dashboard**:
  * Submit onboarding applications with qualification document uploads.
  * Create, schedule, and view upcoming mental health audio podcasts.
  * Go live with integrated Agora microphone streaming and monitor incoming listener questions.
* **Admin Dashboard**:
  * Review reported chat messages, delete offending content, and issue warnings or suspensions.
  * Oversee live audio sessions and comment streams.
  * Approve or reject mentor verification applications and podcast listings.
  * Manage topic chatrooms, update subscription plans, and view platform statistics.
* **Moderator Dashboard**:
  * Review reported chat messages, delete offending content, and issue warnings or suspensions.
  * Oversee live audio sessions and comment streams.

---

## Folder Structure

    frontend/
    ├── public/             # Static public assets and icons
    ├── src/
    │   ├── assets/         # Project illustrations, logos, and images
    │   ├── components/     # Reusable UI elements (Navbar, Modals, NotificationBell)
    │   ├── pages/          # Application views organized by user role
    │   │   ├── admin/      # Management dashboards (Chatrooms, Mentors, Plans, Reports)
    │   │   ├── client/     # Client views (Chatrooms, Live Podcast Player, Subscriptions)
    │   │   ├── mentor/     # Mentor views (Podcast Studio, Application, Schedule)
    │   │   ├── moderator/  # Moderator dashboard and flagged incident reviews
    │   │   ├── public/     # Landing page, Login, Signup, and OTP Verification
    │   │   └── shared/     # Cross-role views (Chat interface, Profile Settings)
    │   ├── utils/          # Axios API gateway and helper methods
    │   ├── App.jsx         # Application routing and role-based route protection
    │   └── main.jsx        # React root application entry point
    ├── Dockerfile          # Nginx production build and container configuration
    ├── package.json        # Frontend dependencies and run scripts
    └── vite.config.js      # Vite build configuration

---

## Environment Configuration

Create a .env file in the root directory and define the following variables:

    VITE_API_URL=http://13.60.72.235:5000/api
    VITE_SOCKET_URL=http://13.60.72.235:5000

---

## Deployment (AWS EC2)

The frontend is built into static production assets and served through an Nginx container managed by Docker Compose on AWS EC2.

1. SSH into the server:
    ssh -i your-key.pem ubuntu@13.60.72.235

2. Clone the repository:
    git clone https://github.com/Iqra-Mushtak/Mindcomfort-Frontend.git
    cd Mindcomfort-Frontend

3. Build and launch services:
    docker compose up -d --build

4. Check running containers:
    docker ps

---

## Project Information

* **Developer**: Iqra Mushtaq (Roll No: 089350 / Reg No: 2021-ks-98)
* **Project ID**: 22-KS-BSIT-35
* **Institution**: Department of Computer Science, Govt. Graduate College, Civil Lines, Sheikhupura (University of the Punjab)
