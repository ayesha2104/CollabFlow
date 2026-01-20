# Backend Deployment Guide

This guide covers deploying your Node.js/Express backend to **Render.com** (recommended for ease of use) and setting up your database on **MongoDB Atlas**.

## Prerequisites
- [ ] GitHub account (code must be pushed to a repository)
- [ ] MongoDB Atlas account
- [ ] Render.com account

---

## Part 1: Database Setup (MongoDB Atlas)

1.  **Create Cluster**: Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free Shared Cluster (M0 Sandbox).
2.  **Create Database User**:
    - Go to **Database Access** -> **Add New Database User**.
    - Authentication Method: Password.
    - Username: `admin` (or similar).
    - Password: **Generate a secure password** and save it safely.
    - Role: "Read and write to any database".
3.  **Network Access**:
    - Go to **Network Access** -> **Add IP Address**.
    - Select **"Allow Access from Anywhere"** (`0.0.0.0/0`). This allows your cloud backend to connect.
4.  **Get Connection String**:
    - Go to **Database** -> **Connect** -> **Drivers**.
    - Copy the connection string. It will look like:
      `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
    - Replace `<password>` with the password you created in step 2.

---

## Part 2: Backend Config Check

Ensure your `package.json` has the correct start script (already verified):
```json
"scripts": {
  "start": "node server.js"
}
```

Ensure your `server.js` uses the `PORT` environment variable (already verified):
```javascript
const PORT = process.env.PORT || 5000;
```

---

## Part 3: Deploy to Render

1.  **Create New Web Service**:
    - Log in to your Render dashboard.
    - Click **"New +"** -> **"Web Service"**.
2.  **Connect GitHub**:
    - Connect your GitHub account and select your repository.
    - If your backend is in a subdirectory (e.g., `/backend`), set **Root Directory** to `backend`.
3.  **Configure Service**:
    - **Name**: `collabflow-backend` (or unique name)
    - **Region**: Closest to you (e.g., Oregon, Frankfurt)
    - **Branch**: `main`
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
4.  **Environment Variables**:
    - Scroll down to **"Environment Variables"** and click **"Add Environment Variable"**. Add the following:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | *Your connection string from Part 1* |
| `JWT_SECRET` | *A long, random string (e.g., generated via online tool)* |
| `JWT_EXPIRE` | `30d` |
| `CLIENT_URL` | *Your Frontend URL (e.g. `https://your-app.netlify.app`)* <br> *Note: For now, you can use `*` to allow all, but update this once frontend is deployed.* |

5.  **Deploy**:
    - Click **"Create Web Service"**.
    - Render will build and deploy your app.
    - Once finished, you will see a URL (e.g., `https://collabflow-backend.onrender.com`).

---

## Part 4: Verification

1.  **Check Health Endpoint**:
    - Visit `https://your-app-url.onrender.com/health`
    - You should see: `{"status":"OK","timestamp":"..."}`
2.  **Test API**:
    - Use Postman to send a POST request to `https://your-app-url.onrender.com/api/auth/signup` to verify database connection and writing.

---

## Troubleshooting

- **"Build Failed"**: Check if `npm install` worked. Ensure `package.json` is in the root directory you specified.
- **"Application Error" / Crashes**: Check the **Logs** tab in Render.
    - *MongoTimeoutError*: Check your MongoDB Atlas Network Access (IP Whitelist).
    - *Authentication Failed*: Check your `MONGO_URI` password (special characters might need URL encoding).
