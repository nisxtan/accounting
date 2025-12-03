import { useEffect, useRef, useState } from "react";
import billService from "../api/billServices";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

const BillList = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printingBill, setPrintingBill] = useState(null);
  const [filters, setFilters] = useState({
    customerName: "",
    minTotal: "",
    maxTotal: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [activeField, setActiveField] = useState(null);
  const cursorPositionRef = useRef(null);

  const inputRefs = {
    customerName: useRef(null),
    isTaxable: useRef(null),
    minTotal: useRef(null),
    maxTotal: useRef(null),
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 700);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    if (!loading && activeField && inputRefs[activeField]?.current) {
      const input = inputRefs[activeField].current;
      input.focus();

      if (cursorPositionRef.current !== null && input.setSelectionRange) {
        input.setSelectionRange(
          cursorPositionRef.current,
          cursorPositionRef.current
        );
      }
    }
  }, [loading, bills]);

  useEffect(() => {
    fetchBills();
  }, [debouncedFilters, pagination.page, pagination.limit]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billService.getAllBills(debouncedFilters, {
        page: pagination.page,
        limit: pagination.limit,
      });

      console.log("Full Response from API:", response); // Debug log
      console.log("Response keys:", Object.keys(response)); // Show all keys
      console.log("response.result type:", typeof response.result);
      console.log("response.result is array?", Array.isArray(response.result));
      console.log("response.result content:", response.result);

      // Handle different response structures
      let billsData = [];
      if (Array.isArray(response)) {
        billsData = response;
      } else if (response.result && Array.isArray(response.result)) {
        billsData = response.result;
      } else if (response.results && Array.isArray(response.results)) {
        billsData = response.results;
      } else if (response.data && Array.isArray(response.data)) {
        billsData = response.data;
      } else if (response.bills && Array.isArray(response.bills)) {
        billsData = response.bills;
      } else {
        console.error(
          "⚠️ Bills array not found in response! Response structure:",
          response
        );
      }

      console.log("Extracted bills data:", billsData);
      console.log("Bills count:", billsData.length);

      setBills(billsData);
      setPagination(
        response.pagination || {
          page: 1,
          limit: 5,
          totalCount: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        }
      );
    } catch (error) {
      setError("Failed to load bills");
      console.error("Failed to fetch bills", error);
      setBills([]); // Ensure bills is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    if (inputRefs[filterName]?.current) {
      cursorPositionRef.current = inputRefs[filterName].current.selectionStart;
    }
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
      customerName: "",
      minTotal: "",
      maxTotal: "",
    });
    setActiveField(null);
    cursorPositionRef.current = null;
  };

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePrintBill = async (bill) => {
    try {
      setPrintingBill(bill.invoiceNumber);

      // If bill already has items (from current API), use them
      // Otherwise fetch from new API
      if (bill.items && bill.items.length > 0) {
        printBillDetails(bill);
      } else {
        const detailedBill = await billService.getBillDetails(
          bill.invoiceNumber
        );
        printBillDetails(detailedBill);
      }
    } catch (error) {
      alert(`Print failed: ${error.message || "Failed to fetch bill details"}`);
    } finally {
      setPrintingBill(null);
    }
  };

  const printBillDetails = (bill) => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to print the bill");
      return;
    }

    const items = bill.items || [];

    const itemsHTML = items
      .map(
        (item, index) => `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${
          index + 1
        }</td>
        <td style="border: 1px solid #000; padding: 8px;">${
          item.product?.name || "N/A"
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${
          item.quantity
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${
          item.unit
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right;">Rs. ${item.rate.toFixed(
          2
        )}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${
          item.discountPercent
        }%</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${
          item.isTaxable ? "Yes" : "No"
        }</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right;">Rs. ${
          item.unit === "dozen"
            ? (item.individualRate * 12).toFixed(2)
            : item.unit === "box"
            ? (item.individualRate * 6).toFixed(2)
            : (item.individualRate * item.quantity).toFixed(2)
        }</td>
      </tr>
    `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${bill.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .invoice-info {
            margin-bottom: 20px;
          }
          .invoice-info div {
            margin: 5px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background-color: #333;
            color: white;
            padding: 10px;
            border: 1px solid #000;
            text-align: left;
          }
          .totals {
            margin-top: 20px;
            text-align: right;
          }
          .totals div {
            margin: 5px 0;
            font-size: 14px;
          }
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #006400;
            margin-top: 10px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SALES INVOICE</h1>
        </div>
        
        <div class="invoice-info">
          <div><strong>Invoice Number:</strong> ${bill.invoiceNumber}</div>
          <div><strong>Customer:</strong> ${bill.customer}</div>
          <div><strong>Date:</strong> ${new Date(
            bill.salesDate
          ).toLocaleDateString()}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center;">S.N.</th>
              <th>Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: center;">Unit</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: center;">Disc%</th>
              <th style="text-align: center;">Taxable</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              itemsHTML ||
              '<tr><td colspan="8" style="text-align: center; padding: 20px;">No items</td></tr>'
            }
          </tbody>
        </table>

        <div class="totals">
          <div><strong>Bill Discount:</strong> ${bill.discountPercent}%</div>
          <div><strong>VAT:</strong> ${bill.vatPercent}%</div>
          <div class="grand-total">Grand Total: Rs. ${bill.grandTotal?.toFixed(
            2
          )}</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <>
      {/* Filters Section */}
      <div className="p-4 bg-white border-b grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name
          </label>
          <input
            ref={inputRefs.customerName}
            onFocus={() => setActiveField("customerName")}
            onBlur={() => {
              if (inputRefs.customerName.current) {
                cursorPositionRef.current =
                  inputRefs.customerName.current.selectionStart;
              }
            }}
            type="text"
            placeholder="Search customer..."
            value={filters.customerName}
            onChange={(e) => handleFilterChange("customerName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Total
          </label>
          <input
            ref={inputRefs.minTotal}
            onFocus={() => setActiveField("minTotal")}
            onBlur={() => {
              if (inputRefs.minTotal.current) {
                cursorPositionRef.current =
                  inputRefs.minTotal.current.selectionStart;
              }
            }}
            min={0}
            type="number"
            placeholder="0"
            value={filters.minTotal}
            onChange={(e) => handleFilterChange("minTotal", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Total
          </label>
          <input
            ref={inputRefs.maxTotal}
            onFocus={() => setActiveField("maxTotal")}
            onBlur={() => {
              if (inputRefs.maxTotal.current) {
                cursorPositionRef.current =
                  inputRefs.maxTotal.current.selectionStart;
              }
            }}
            type="number"
            min={0}
            placeholder="10000"
            value={filters.maxTotal}
            onChange={(e) => handleFilterChange("maxTotal", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-4 text-center text-gray-500">Loading Bills...</div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto p-4">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-700 text-white text-left text-xs font-semibold">
              <th className="p-2 border border-gray-400">Invoice #</th>
              <th className="p-2 border border-gray-400">Customer</th>
              <th className="p-2 border border-gray-400">Date</th>
              <th className="p-2 border border-gray-400">Disc%</th>
              <th className="p-2 border border-gray-400">VAT%</th>
              <th className="p-2 border border-gray-400">Grand Total</th>
              <th className="p-2 border border-gray-400 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="p-4 text-center text-gray-500 border"
                >
                  No bills found
                </td>
              </tr>
            ) : (
              bills.map((bill) => {
                const items = bill.items || [];

                return (
                  <tr
                    key={bill.invoiceNumber}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-2 border border-gray-300 font-medium">
                      {bill.invoiceNumber}
                    </td>
                    <td className="p-2 border border-gray-300">
                      {bill.customer}
                    </td>
                    <td className="p-2 border border-gray-300">
                      {new Date(bill.salesDate).toLocaleDateString()}
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {bill.discountPercent}%
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {bill.vatPercent}%
                    </td>
                    <td className="p-2 border border-gray-300 font-bold text-green-700">
                      Rs. {bill.grandTotal?.toFixed(2)}
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      <button
                        onClick={() => handlePrintBill(bill)}
                        disabled={printingBill === bill.invoiceNumber}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {printingBill === bill.invoiceNumber
                          ? "Loading..."
                          : "Print"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <div className="mt-6 flex justify-center">
            <Stack spacing={2}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Stack>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          Showing {bills.length} bills with{" "}
          {bills.reduce((sum, b) => sum + (b.items?.length || 0), 0)} total
          items
        </div>
      </div>
    </>
  );
};

export default BillList;
