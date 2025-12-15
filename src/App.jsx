import { useMemo, useState, useEffect } from "react";
import * as XLSX from "xlsx";

// Color sequence for inventory items - 3 colors that repeat
// Colors from colour.png: Green, Soft Green, Yellow
const COLOR_SEQUENCE = [
  '#C8E6C9', // Color 1 - Green
  '#E8F5E9', // Color 2 - Soft Green (lighter green)
  '#FFF9C4', // Color 3 - Yellow
];

const columns = [
  { key: "make", label: "MAKE" },
  { key: "model", label: "MODEL" },
  { key: "quantity", label: "QUANTITY" },
  { key: "grading", label: "GRADING" },
  { key: "priceEnquiry", label: "PRICE" }
];

const BRANCHES = {
  DUBAI: "dubai",
  HONG_KONG: "hong-kong"
};

const getStockFilePath = (branch) => {
  if (branch === BRANCHES.HONG_KONG) {
    return "/hongkong.xlsx";
  }
  return "/dubai.xlsx";
};

const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL || "https://api.fufu4u.com/stock/upload";

// WhatsApp number - update this with your actual WhatsApp number
const WHATSAPP_NUMBER = "380666732238"; // Replace with your WhatsApp number (country code + number, no + or spaces)

// Sample data to display when no file is uploaded
const SAMPLE_DATA = [
  { make: "Fujitsu-1", model: "ARROWS - F04K", quantity: 100, grading: "AU-C", priceEnquiry: "Yes" },
  { make: "Fujitsu-1", model: "ARROWS-NX-F02H", quantity: 25, grading: "AU-C", priceEnquiry: "Yes" },
  { make: "Fujitsu-3", model: "ARROWS WE 2", quantity: 125, grading: "AU-B", priceEnquiry: "Yes" },
  { make: "Fujitsu-4", model: "ARROWS - F04K", quantity: 100, grading: "AU-D", priceEnquiry: "Yes" },
  { make: "Fujitsu-5", model: "ARROWS-NX-F02H", quantity: 300, grading: "AU-A", priceEnquiry: "Yes" },
  { make: "Fujitsu-6", model: "ARROWS WE 2", quantity: 142, grading: "DND", priceEnquiry: "Yes" },
  { make: "Google Pixel-1", model: "7a", quantity: 554, grading: "DNA", priceEnquiry: "Yes" },
  { make: "Google Pixel-2", model: "9Pro XL", quantity: 255, grading: "DNB", priceEnquiry: "Yes" },
  { make: "Apple-1", model: "iPhone 11", quantity: 300, grading: "DNB", priceEnquiry: "Yes" },
  { make: "Apple-2", model: "iPhone 14 Pro Max", quantity: 200, grading: "DND", priceEnquiry: "Yes" }
];

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'dubai!@#$'
};

export default function App() {
  const [rows, setRows] = useState(SAMPLE_DATA);
  const [status, setStatus] = useState("Showing sample data");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBranch, setActiveBranch] = useState(BRANCHES.DUBAI);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Check if admin path is in URL (e.g., /admin)
    const pathname = window.location.pathname;
    const isAdminRoute = pathname.includes("/admin");
    
    if (isAdminRoute) {
      // Check if user is authenticated
      const authStatus = sessionStorage.getItem('adminAuthenticated') === 'true';
      setIsAuthenticated(authStatus);
      setIsAdmin(authStatus);
    } else {
      setIsAdmin(false);
      setIsAuthenticated(false);
    }
    
    // Load data from public folder file on mount
    loadStockFile();
  }, [activeBranch]);

  // Listen for pathname changes (browser navigation)
  useEffect(() => {
    const handleLocationChange = () => {
      const pathname = window.location.pathname;
      const isAdminRoute = pathname.includes("/admin");
      
      if (isAdminRoute) {
        const authStatus = sessionStorage.getItem('adminAuthenticated') === 'true';
        setIsAuthenticated(authStatus);
        setIsAdmin(authStatus);
      } else {
        setIsAdmin(false);
        setIsAuthenticated(false);
      }
    };

    // Check on popstate (browser back/forward)
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const loadStockFile = async () => {
    try {
      setIsLoading(true);
      
      const filePath = getStockFilePath(activeBranch);
      const branchName = activeBranch === BRANCHES.HONG_KONG ? "Hong Kong" : "Dubai";
      
      // Check if branch stock file exists in public folder
      const response = await fetch(filePath);
      if (response.ok) {
        // File exists, load data from it
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const normalized = json
          .map((row) => ({
            make: row.Make || row.make || "",
            model: row.Model || row.model || "",
            quantity: row.Quantity || row.quantity || 0,
            grading: row.Grading || row.grading || "",
            priceEnquiry: row["Price Enquiry"] || row.priceEnquiry || "Yes"
          }))
          .filter((r) => r.make && r.model);

        if (normalized.length > 0) {
          setRows(normalized);
          setStatus(`Loaded ${normalized.length} items from ${branchName} branch`);
        } else {
          // If file is empty, show sample data
          setRows(SAMPLE_DATA);
          setStatus(`Showing sample data (${branchName} stock file is empty)`);
        }
      } else {
        // File doesn't exist, show sample data
        setRows(SAMPLE_DATA);
        setStatus(`Showing sample data (${branchName} stock file not found)`);
      }
    } catch (err) {
      console.error("File load error:", err);
      // If file can't be loaded, show sample data
      setRows(SAMPLE_DATA);
      const branchName = activeBranch === BRANCHES.HONG_KONG ? "Hong Kong" : "Dubai";
      setStatus(`Showing sample data (${branchName} branch)`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFile = async (file, branch = null) => {
    try {
      setStatus("Uploading file…");
      
      // Use provided branch or fall back to active branch
      const targetBranch = branch || activeBranch;
      
      // Ensure correct branch value for backend
      const branchValue = targetBranch === BRANCHES.HONG_KONG ? 'hong-kong' : 'dubai';
      
      console.log('=== FRONTEND UPLOAD DEBUG ===');
      console.log('targetBranch:', targetBranch);
      console.log('BRANCHES.DUBAI:', BRANCHES.DUBAI);
      console.log('BRANCHES.HONG_KONG:', BRANCHES.HONG_KONG);
      console.log('branchValue:', branchValue);
      console.log('Is Hong Kong?', targetBranch === BRANCHES.HONG_KONG);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('branch', branchValue);

      // Upload file to backend
      // Also add branch as query parameter as backup (URL encode it)
      const encodedBranch = encodeURIComponent(branchValue);
      const uploadUrl = `${UPLOAD_API_URL}?branch=${encodedBranch}`;
      console.log('Upload URL:', uploadUrl);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Failed to upload file');
      }

      // Read the file data for immediate display
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const normalized = json
        .map((row) => ({
          make: row.Make || row.make,
          model: row.Model || row.model,
          quantity: row.Quantity || row.quantity || 0,
          grading: row.Grading || row.grading,
          priceEnquiry: row["Price Enquiry"] || row.priceEnquiry || "Yes"
        }))
        .filter((r) => r.make && r.model);

      if (!normalized.length) {
        throw new Error("No data found in the first sheet");
      }

      const branchName = targetBranch === BRANCHES.HONG_KONG ? "Hong Kong" : "Dubai";
      
      console.log(`File uploaded successfully. Branch: ${branchName}, File saved as: ${branchValue === 'hong-kong' ? 'hongkong.xlsx' : 'dubai.xlsx'}`);
      
      // Update rows immediately with uploaded data
      setRows(normalized);
      setStatus(`Uploaded and loaded ${normalized.length} items to ${branchName} branch from ${file.name}`);
      
      // Switch to the target branch if uploading to a different branch
      // This will trigger useEffect which will reload the file
      if (targetBranch !== activeBranch) {
        setActiveBranch(targetBranch);
      } else {
        // If uploading to current branch, reload the file to ensure consistency
        setTimeout(() => {
          loadStockFile();
        }, 500);
      }
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Unable to upload file");
    }
  };

  const handleChange = (event, branch = null) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file, branch);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (loginForm.username === ADMIN_CREDENTIALS.username && 
        loginForm.password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true);
      setIsAdmin(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      setLoginForm({ username: '', password: '' });
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    sessionStorage.removeItem('adminAuthenticated');
    // Redirect to home if on admin route
    if (window.location.pathname.includes('/admin')) {
      window.history.pushState({}, '', '/');
    }
  };

  const handlePriceEnquiry = (make, model, grading, quantity) => {
    // Create WhatsApp message with product details
    const message = encodeURIComponent(
      `Hello! I'm interested in getting a price quote for:\n\nMake: ${make}\nModel: ${model}\nGrading: ${grading}\nQuantity: ${quantity}`
    );
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopy = async (make, model, grading, quantity) => {
    // Format the text as requested
    const copyText = `Make: ${make}\nModel: ${model}\nGrading: ${grading}\nQuantity: ${quantity}`;
    
    try {
      await navigator.clipboard.writeText(copyText);
      // Show temporary success message (you can enhance this with a toast notification)
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = copyText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Copied to clipboard!');
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
        alert('Failed to copy. Please copy manually.');
      }
      document.body.removeChild(textArea);
    }
  };

  // Helper function to adjust color brightness for borders
  const adjustBrightness = (hex, percent) => {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  const totalUnits = useMemo(
    () => rows.reduce((acc, row) => acc + Number(row.quantity || 0), 0),
    [rows]
  );

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return rows;
    }
    const query = searchQuery.toLowerCase().trim();
    return rows.filter((row) => {
      return (
        (row.make && row.make.toString().toLowerCase().includes(query)) ||
        (row.model && row.model.toString().toLowerCase().includes(query)) ||
        (row.grading && row.grading.toString().toLowerCase().includes(query)) ||
        (row.quantity && row.quantity.toString().toLowerCase().includes(query))
      );
    });
  }, [rows, searchQuery]);

  // Show login form if on admin route but not authenticated
  const pathname = window.location.pathname;
  const isAdminRoute = pathname.includes("/admin");
  
  if (isAdminRoute && !isAuthenticated) {
    return (
      <div className="page">
        <header className="header-gradient">
          <div className="header-content">
            <div className="header-title">
              <div className="header-text">
                <span className="inventory-label">INVENTORY</span>
                <h1>Stock Viewer</h1>
              </div>
              <h1 className="header-company">NMP Mobiles</h1>
            </div>
          </div>
        </header>
        <div className="login-container">
          <div className="login-box">
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              {loginError && <div className="login-error">{loginError}</div>}
              <button type="submit" className="login-btn">Login</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header-gradient">
        <div className="header-content">
          <div className="header-title">
            <div className="header-text">
              <span className="inventory-label">INVENTORY</span>
              <h1>Stock Viewer</h1>
            </div>
            <h1 className="header-company">NMP Mobiles</h1>
          </div>
          {isAuthenticated && (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </header>

      <section className="table-wrap">
        <div className="branch-tabs">
          <div className="branch-tab-wrapper">
            <button
              className={`branch-tab ${activeBranch === BRANCHES.DUBAI ? 'active' : ''}`}
              onClick={() => setActiveBranch(BRANCHES.DUBAI)}
            >
              Dubai
            </button>
            {isAdmin && activeBranch === BRANCHES.DUBAI && (
              <label className="upload-tab">
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={(e) => handleChange(e, BRANCHES.DUBAI)}
                />
                <span>Upload</span>
              </label>
            )}
          </div>
          <div className="branch-tab-wrapper">
            <button
              className={`branch-tab ${activeBranch === BRANCHES.HONG_KONG ? 'active' : ''}`}
              onClick={() => setActiveBranch(BRANCHES.HONG_KONG)}
            >
              Hong Kong
            </button>
            {isAdmin && activeBranch === BRANCHES.HONG_KONG && (
              <label className="upload-tab">
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={(e) => handleChange(e, BRANCHES.HONG_KONG)}
                />
                <span>Upload</span>
              </label>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="no-data">No stock data available</div>
        ) : (
          <>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search inventories by make, model, grading, or quantity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <table>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="no-results">
                      No inventories found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    // Use first color for all rows
                    const backgroundColor = COLOR_SEQUENCE[0];
                    const borderColor = adjustBrightness(backgroundColor, -20);
                    
                    return (
                      <tr 
                        key={`${row.make}-${row.model}-${idx}`} 
                        className={idx % 2 === 0 ? "even-row" : "odd-row"}
                        style={{
                          backgroundColor: backgroundColor,
                          borderColor: borderColor
                        }}
                      >
                        {columns.map((col) => {
                          const value = row[col.key];
                          return (
                            <td 
                              key={col.key} 
                              data-label={col.label} 
                              className={col.key === "model" ? "model-cell" : col.key === "priceEnquiry" ? "action-cell" : ""}
                            >
                              {col.key === "grading" ? (
                                <span className="grading-badge">{value || "-"}</span>
                              ) : col.key === "priceEnquiry" ? (
                                <div className="action-buttons">
                                  <button
                                    className="price-enquiry-btn"
                                    onClick={() => handlePriceEnquiry(row.make, row.model, row.grading, row.quantity)}
                                    aria-label={`Price enquiry for ${row.make} ${row.model}`}
                                    title="Price Enquiry"
                                  >
                                    <img src="/msg.png" alt="Message" className="price-enquiry-icon" />
                                  </button>
                                  <button
                                    className="price-enquiry-btn"
                                    onClick={() => handleCopy(row.make, row.model, row.grading, row.quantity)}
                                    aria-label={`Copy details for ${row.make} ${row.model}`}
                                    title="Copy Details"
                                  >
                                    <img src="/copy-link.png" alt="Copy" className="price-enquiry-icon" />
                                  </button>
                                </div>
                              ) : (
                                value
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}


