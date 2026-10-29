# DriveEasy - Car Rental System

A full-stack car rental management web application built with Node.js, Express, MongoDB Atlas, and Vanilla JavaScript. It features role-based access control, car fleet cataloging, rental bookings, and complete admin/manager workflows.

---

## 🌐 Live Demo & Deployment

* **Live Application (Frontend):** [https://car-rental-system-frontend-five.vercel.app](https://www.google.com/search?q=https://car-rental-system-frontend-five.vercel.app)[cite: 24, 28]
* **API Server (Backend):** [https://car-rental-system-vs2l.onrender.com](https://www.google.com/search?q=https://car-rental-system-vs2l.onrender.com)[cite: 25]
* **Source Code:** [https://github.com/Gangadhar8080/car-rental-system](https://www.google.com/search?q=https://github.com/Gangadhar8080/car-rental-system)[cite: 6, 28]

---

## 🚀 Features

* **Role-Based Access Control (RBAC):** Distinct permissions and dashboards for Admin, Manager, and Customer accounts[cite: 4].
* **Vehicle Catalog:** Browse available cars with specifications, pricing, and availability statuses[cite: 4].
* **Booking Flow:** Real-time rental scheduling and reservation management[cite: 4].
* **RESTful API:** Centralized Express.js backend handling authentication, data validation, and database operations.


* **Responsive UI:** Clean and responsive interface built with modular HTML, CSS, and vanilla JavaScript.



---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js


* **Database:** MongoDB Atlas (Mongoose ODM)


* **Frontend:** HTML5, CSS3, Modern JavaScript (Fetch API)


* **Authentication:** JSON Web Tokens (JWT) & bcryptjs


* **Hosting:** Vercel (Frontend), Render (Backend)[cite: 6, 24]

---

## 📂 Project Structure

```text
car-rental-system/
├── backend/
│   ├── config/          # Database configuration (db.js)
│   ├── controllers/     # Route business logic (auth, cars, bookings)
│   ├── models/          # Mongoose database schemas
│   ├── routes/          # Express API route endpoints
│   ├── middleware/      # Authentication & authorization checks
│   └── server.js        # Express app entry point
├── frontend/
│   ├── css/             # Stylesheets
│   ├── js/              # Frontend logic (api.js, auth, bookings)
│   ├── pages/           # Admin/Manager/Customer pages
│   └── index.html       # Landing page
├── package.json
└── README.md

```

[cite: 1, 4, 28]

---

## 🔑 Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@carrental.com` | `Admin@123` |
| **Manager** | `manager@carrental.com` | `Manager@123` |
| **User (Customer)** | `user@carrental.com` | `User@123` |

[cite: 4]

---

## 💻 Local Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/Gangadhar8080/car-rental-system.git
cd car-rental-system

```

[cite: 6]

### 2. Install dependencies

```bash
npm install

```



### 3. Configure environment variables

Create a `.env` file in the project root directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://127.0.0.1:5500

```

[cite: 1, 4, 13]

### 4. Seed initial database data

```bash
node backend/seed.js

```

[cite: 4]

### 5. Start the backend server

```bash
npm start

```



### 6. Run the frontend

Open `frontend/index.html` using VS Code Live Server or your local browser[cite: 1, 13].

---

## 📄 License

This project is open-source and available under the [MIT License](https://www.google.com/search?q=LICENSE).
