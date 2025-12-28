const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/analysis", require("./routes/analysis")); // ✅ NEW
app.use("/api/contact", require("./routes/contact")); // ✅ ADD THIS LINE

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'SSN AI Backend is running!',
        endpoints: {
            user_signup: 'POST /api/auth/signup',
            user_signin: 'POST /api/auth/signin',
            admin_login: 'POST /api/admin/login',
            create_admin: 'POST /api/admin/create-initial',
            create_analysis: 'POST /api/analysis/create',
            get_analysis: 'GET /api/analysis/:analysisId',
            update_analysis: 'PUT /api/analysis/:analysisId/data',
            submit_contact: 'POST /api/contact/submit', // ✅ ADD
            get_contacts: 'GET /api/contact/all', // ✅ ADD
            delete_contact: 'DELETE /api/contact/:contactId' // ✅ ADD
        }
    });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, status: "healthy" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}\n`);
});
