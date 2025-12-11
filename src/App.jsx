import { useMemo, useState, useEffect } from "react";
import * as XLSX from "xlsx";

const columns = [
  { key: "make", label: "MAKE" },
  { key: "model", label: "MODEL" },
  { key: "quantity", label: "QUANTITY" },
  { key: "grading", label: "GRADING" },
  { key: "priceEnquiry", label: "PRICE" }
];

const STOCK_FILE_PATH = "/sample-stock.xlsx";
const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL || "http://localhost:4000/upload";

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

export default function App() {
  const [rows, setRows] = useState(SAMPLE_DATA);
  const [status, setStatus] = useState("Showing sample data");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Check if admin path is in URL (e.g., /admin)
    const pathname = window.location.pathname;
    setIsAdmin(pathname.includes("/admin"));
    
    // Load data from public folder file on mount
    loadStockFile();
  }, []);

  const loadStockFile = async () => {
    try {
      setIsLoading(true);
      
      // Check if sample-stock.xlsx exists in public folder
      const response = await fetch(STOCK_FILE_PATH);
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
          setStatus(`Loaded ${normalized.length} items from sample-stock.xlsx`);
        } else {
          // If file is empty, show sample data
          setRows(SAMPLE_DATA);
          setStatus("Showing sample data (sample-stock.xlsx is empty)");
        }
      } else {
        // File doesn't exist, show sample data
        setRows(SAMPLE_DATA);
        setStatus("Showing sample data");
      }
    } catch (err) {
      console.error("File load error:", err);
      // If file can't be loaded, show sample data
      setRows(SAMPLE_DATA);
      setStatus("Showing sample data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFile = async (file) => {
    try {
      setStatus("Uploading file…");
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload file to backend
      const uploadResponse = await fetch(UPLOAD_API_URL, {
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

      setRows(normalized);
      setStatus(`Uploaded and loaded ${normalized.length} items from ${file.name}`);
      
      // Reload data from the file to ensure consistency
      setTimeout(() => {
        loadStockFile();
      }, 500);
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Unable to upload file");
    }
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const handlePriceEnquiry = (make, model) => {
    // Create WhatsApp message with product details
    const message = encodeURIComponent(
      `Hello! I'm interested in getting a price quote for:\n\nMake: ${make}\nModel: ${model}\n\nPlease provide me with the pricing information.`
    );
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, "_blank");
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
          {isAdmin && (
            <label className="upload">
              <input type="file" accept=".xlsx,.xls" onChange={handleChange} />
              <span>Upload XLSX</span>
            </label>
          )}
        </div>
      </header>

      <section className="table-wrap">
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
                  filteredRows.map((row, idx) => (
                <tr 
                  key={`${row.make}-${row.model}-${idx}`} 
                  className={idx % 2 === 0 ? "even-row" : "odd-row"}
                  style={{ backgroundColor: "#f0fdf4" }}
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    return (
                      <td key={col.key} data-label={col.label} className={col.key === "model" ? "model-cell" : ""}>
                        {col.key === "grading" ? (
                          <span className="grading-badge">{value || "-"}</span>
                        ) : col.key === "priceEnquiry" ? (
                          <button
                            className="price-enquiry-btn"
                            onClick={() => handlePriceEnquiry(row.make, row.model)}
                            aria-label={`Price enquiry for ${row.make} ${row.model}`}
                          >
                            {value || "Yes"}
                          </button>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}


