import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4001;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.static('public'));

// Middleware to capture branch from query before multer processes
const captureBranch = (req, res, next) => {
  // Parse query parameter from URL manually
  let branchFromQuery = null;
  if (req.url && req.url.includes('?')) {
    const queryString = req.url.split('?')[1];
    const params = new URLSearchParams(queryString);
    branchFromQuery = params.get('branch');
  }
  
  // Also check req.query (Express might have parsed it)
  if (!branchFromQuery && req.query?.branch) {
    branchFromQuery = req.query.branch;
  }
  
  // Store branch in request object for filename callback
  req.uploadBranch = branchFromQuery || req.body?.branch || 'dubai';
  
  console.log('=== BRANCH CAPTURE MIDDLEWARE ===');
  console.log('URL:', req.url);
  console.log('Query branch (parsed):', branchFromQuery);
  console.log('req.query:', req.query);
  console.log('Body branch:', req.body?.branch);
  console.log('Stored branch:', req.uploadBranch);
  
  next();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public');
    // Ensure public directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Get branch from the stored value in request object
    const branch = req.uploadBranch ? String(req.uploadBranch).trim().toLowerCase() : 'dubai';
    
    console.log('=== FILENAME CALLBACK ===');
    console.log('Branch from req.uploadBranch:', req.uploadBranch);
    console.log('Normalized branch:', branch);
    
    // Save as branch-specific file
    let filename;
    // Check for Hong Kong variations
    if (branch === 'hong-kong' || branch === 'hongkong' || branch.includes('hong')) {
      filename = 'hongkong.xlsx';
      console.log('✓ SAVING AS HONG KONG FILE:', filename);
    } else {
      filename = 'dubai.xlsx';
      console.log('✓ SAVING AS DUBAI FILE:', filename);
    }
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only XLSX and XLS files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware to parse multipart form fields before multer
const parseFormFields = (req, res, next) => {
  if (req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
    // Multer will parse this, but we need to ensure body is available
    next();
  } else {
    next();
  }
};

// Upload endpoint
app.post('/stock/upload', captureBranch, parseFormFields, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Try to get branch from query parameter first (most reliable)
    // Then try body as fallback
    const branchFromQuery = req.query?.branch ? String(req.query.branch).trim().toLowerCase() : null;
    const branchFromBody = req.body?.branch ? String(req.body.branch).trim().toLowerCase() : null;
    const branch = branchFromQuery || branchFromBody || 'dubai';
    
    console.log('=== UPLOAD ENDPOINT DEBUG ===');
    console.log('Raw query params:', req.query);
    console.log('Raw request body:', req.body);
    console.log('Branch from query (normalized):', branchFromQuery);
    console.log('Branch from body (normalized):', branchFromBody);
    console.log('Final branch value:', branch);
    
    let filePath;
    if (branch === 'hong-kong' || branch === 'hongkong') {
      filePath = '/hongkong.xlsx';
    } else {
      filePath = '/dubai.xlsx';
    }
    console.log(`File uploaded successfully for branch: ${branch}, saved to: ${filePath}`);

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: filePath,
      branch: branch
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simple root route (optional)
app.get('/', (req, res) => {
  res.json({ status: 'backend-ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Upload endpoint: http://localhost:${PORT}/stock/upload`);
});

