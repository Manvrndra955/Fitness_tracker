# Fitness Tracker 🏋️‍♂️🥗💧

A comprehensive, full-stack web application designed to help individuals monitor, manage, and analyze their daily fitness routines, nutritional intake, hydration levels, and weight progression in one unified dashboard.

---

## 1. Problem Statement & Solution

### The Problem
Maintaining a healthy lifestyle requires consistency, but individuals often face **data fragmentation**. Tracking physical activity, caloric intake, hydration, and body weight typically requires using multiple independent apps. This separation leads to:
* **Friction and App Fatigue:** Switching between various platforms to log different aspects of health.
* **Lack of Holistic Insight:** Difficulty seeing how hydration, diet, and workouts collectively affect body weight and overall health.
* **Loss of Motivation:** No centralized progress tracking makes it harder to visualize long-term trends and stay committed to fitness goals.

### The Solution
**Fitness Tracker** solves this by providing a unified, user-friendly hub that aggregates all primary health metrics into a single interactive dashboard. 
* **Unified Logging:** Users can track workouts, meals, water intake, and weight in one place.
* **Goal-Oriented Dashboard:** Real-time feedback and dynamic summaries enable users to visualize their active minutes, calories burned vs. consumed, hydration levels, and weight changes.
* **Secured Accessibility:** Secure user registration and login ensure that personal health data remains private and persists across devices.

---

## 2. Technology Stack & How It Works

This project is built using a modern **JavaScript / Node.js** ecosystem, combining a lightweight frontend with a robust backend API and database.

```mermaid
graph TD
    A[Client Browser] -->|HTML/CSS/JS| B(Express Web Server)
    B -->|API Requests & Middleware| C{Auth & Routes}
    C -->|Mongoose ODM| D[(MongoDB Database)]
```

### Frontend (Client-Side)
* **HTML5 & CSS3:** Defines the visual layout and responsive structure of the application. Customized stylesheets (`landing_page.css`, `dashboard.css`, `login.css`, `registration.css`) ensure a modern, polished, and mobile-friendly interface.
* **Vanilla JavaScript:** Powers the application's interactivity. It manages client-side form validation, handles session states (storing and transmitting JWT tokens), and asynchronously interacts with backend REST endpoints using the browser's Native Fetch API.
* **EJS (Embedded JavaScript Templates):** Utilized by the Express server to dynamically serve template HTML files from the `public` directory.

### Backend (Server-Side)
* **Node.js & Express.js:** The core runtime and server framework. Express handles incoming HTTP requests, directs routing (`/api/auth`, `/api/workouts`, etc.), and manages the middleware pipeline (such as request body parsing and CORS configuration).
* **CORS (Cross-Origin Resource Sharing):** Configured to allow secure cross-origin communication between the client interface and backend API routes.
* **Dotenv:** Securely loads environment-specific configurations (such as database credentials and port numbers) from a local `.env` file, keeping sensitive credentials out of source control.

### Database & Authentication
* **MongoDB:** A document-oriented NoSQL database used to store persistent data collections for Users, Activities (Workouts), Meals, Hydration Logs, and Weight Entries in flexible, BSON format.
* **Mongoose ODM:** An Object Data Modeling library that provides schema validation, types, and model structure directly within Node.js, making database operations structured and type-safe.
* **JSON Web Tokens (JWT):** Facilitates stateless user authentication. Upon successful login, the server issues a signed token which the client stores and sends in authorization headers to access protected endpoints.
* **Bcrypt.js:** Hashes passwords with salt before database storage to protect user credentials, ensuring passwords are never stored in plain text.

---

## 3. Database Models

The data is structured into five core Mongoose schemas:
1. **User:** Manages authentication details (Username, Email, and encrypted Password).
2. **Activity:** Logs workouts including activity type, duration, calories burned, date, and completion status.
3. **Meal:** Tracks nutritional logs, item descriptions, and caloric value.
4. **WaterLog:** Monitors daily hydration targets and ounces/milliliters consumed.
5. **WeightEntry:** Logs body weight over time to display trends and history.

---

## 4. Setup & Running Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+ recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Manvrndra955/Fitness_tracker.git
   cd Fitness_tracker
   ```
2. Install the server-side dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your configurations:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/fitness_tracker
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the application:
   ```bash
   npm start
   ```
   Open your browser and navigate to `http://localhost:5000` to access the application.
