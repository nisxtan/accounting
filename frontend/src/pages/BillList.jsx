import { useEffect, useRef, useState } from "react";
import billService from "../api/billServices";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

import { AiFillFileExcel } from "react-icons/ai"; // Excel icon
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Link, useNavigate } from "react-router-dom";

const BillList = () => {
  const navigate = useNavigate();
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

      let billsData = [];
      if (Array.isArray(response)) billsData = response;
      else if (response.result) billsData = response.result;
      else if (response.results) billsData = response.results;
      else if (response.data) billsData = response.data;
      else if (response.bills) billsData = response.bills;

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
      console.error("Failed to fetch bills", error);
      setError("Failed to load bills");
      setBills([]);
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

  const downloadExcel = async (bill) => {
    try {
      let detailedBill = bill;

      // Fetch full bill if items missing
      if (!bill.items || bill.items.length === 0) {
        detailedBill = await billService.getBillDetails(bill.invoiceNumber);
      }

      const items = detailedBill.items || [];

      // Prepare rows for table
      const excelData = [
        [
          "S.N.",
          "Product",
          "Quantity",
          "Unit",
          "Rate",
          "Discount %",
          "Taxable",
          "Total",
        ],
      ];

      items.forEach((item, index) => {
        excelData.push([
          index + 1,
          item.product?.name || "N/A",
          item.quantity,
          item.unit,
          item.rate.toFixed(2),
          item.discountPercent,
          item.isTaxable ? "Yes" : "No",
          item.unit === "dozen"
            ? (item.individualRate * 12).toFixed(2)
            : item.unit === "box"
            ? (item.individualRate * 6).toFixed(2)
            : (item.individualRate * item.quantity).toFixed(2),
        ]);
      });

      // Empty row + summary section
      excelData.push([]);
      excelData.push(["Bill Discount (%)", detailedBill.discountPercent]);
      excelData.push(["VAT (%)", detailedBill.vatPercent]);
      excelData.push(["Grand Total", detailedBill.grandTotal.toFixed(2)]);

      // Convert array to sheet
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      // Column widths (auto upscale)
      const colWidths = [
        { wch: 6 }, // S.N.
        { wch: 25 }, // Product
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
      ];
      worksheet["!cols"] = colWidths;

      // Apply styling to header row
      const headerCells = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"];
      headerCells.forEach((cell) => {
        if (worksheet[cell]) {
          worksheet[cell].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: "D9E1F2" } },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          };
        }
      });

      // Apply border to all data rows
      excelData.forEach((row, rIndex) => {
        row.forEach((_, cIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: rIndex, c: cIndex });
          if (worksheet[cellAddress]) {
            worksheet[cellAddress].s = {
              border: {
                top: { style: "thin", color: { rgb: "999999" } },
                bottom: { style: "thin", color: { rgb: "999999" } },
                left: { style: "thin", color: { rgb: "999999" } },
                right: { style: "thin", color: { rgb: "999999" } },
              },
            };
          }
        });
      });

      // Style summary section
      const summaryStart = items.length + 2;
      const summaryCells = [
        `A${summaryStart + 1}`,
        `A${summaryStart + 2}`,
        `A${summaryStart + 3}`,
      ];

      summaryCells.forEach((cell) => {
        if (worksheet[cell]) {
          worksheet[cell].s = {
            font: { bold: true, sz: 12 },
          };
        }
      });

      // ---------------------------------------------

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        cellStyles: true,
      });

      // Download file
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, `Invoice_${bill.invoiceNumber}.xlsx`);
    } catch (err) {
      console.error("Excel error:", err);
      alert("Failed to download Excel");
    }
  };

  const handlePrintBill = async (bill) => {
    try {
      setPrintingBill(bill.invoiceNumber);
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
    if (!printWindow) return alert("Enable pop-ups to print.");

    const items = bill.items || [];

    const itemsHTML = items
      .map(
        (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.product?.name || "N/A"}</td>
        <td>${item.quantity}</td>
        <td>${item.unit}</td>
        <td>Rs. ${item.rate.toFixed(2)}</td>
        <td>${item.discountPercent}%</td>
        <td>${item.isTaxable ? "Yes" : "No"}</td>
        <td>Rs. ${
          item.unit === "dozen"
            ? (item.individualRate * 12).toFixed(2)
            : item.unit === "box"
            ? (item.individualRate * 6).toFixed(2)
            : (item.individualRate * item.quantity).toFixed(2)
        }</td>
      </tr>`
      )
      .join("");

    const htmlContent = `
      <html>
        <body>
          <h1>Sales Invoice</h1>
          <h3>Invoice #: ${bill.invoiceNumber}</h3>
          <h3>Customer: ${bill.customer}</h3>
          <h3>Date: ${new Date(bill.salesDate).toLocaleDateString()}</h3>

          <table border="1" cellspacing="0" cellpadding="6" width="100%">
            <thead>
              <tr>
                <th>S.N.</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Rate</th>
                <th>Disc%</th>
                <th>Taxable</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <h3>Discount: ${bill.discountPercent}%</h3>
          <h3>VAT: ${bill.vatPercent}%</h3>
          <h2>Grand Total: Rs. ${bill.grandTotal?.toFixed(2)}</h2>

          <script>
            window.onload = () => setTimeout(() => window.print(), 250);
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
      {/* Filters */}
      <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-5 gap-4 ml-39 mt-5">
        <div>
          <button
            onClick={() => navigate("/sales")}
            className="px-4 py-2 bg-green-300 text-black font-medium rounded-lg 
             shadow-sm hover:bg-green-400 hover:shadow-md mt-5 ml--10
             transition-all duration-200"
          >
            Back to Home
          </button>
        </div>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full bg-gray-500 text-white px-3 py-2 rounded-md"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-4 text-center text-gray-500">Loading Bills...</div>
      )}

      {/* Table */}
      <div className="border-t w-full overflow-x-auto p-4 mt-8">
        <table className="w-full border-collapse border border-gray-300 mt-10">
          <thead>
            <tr className="bg-gray-700 text-white text-left text-xs font-semibold">
              <th className="p-2 border border-gray-400">Invoice #</th>
              <th className="p-2 border border-gray-400">Customer</th>
              <th className="p-2 border border-gray-400">Date</th>
              <th className="p-2 border border-gray-400">Disc%</th>
              <th className="p-2 border border-gray-400">VAT%</th>
              <th className="p-2 border border-gray-400">Grand Total</th>
              <th className="p-2 border border-gray-400 text-center">
                Actions
              </th>
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
                return (
                  <tr
                    key={bill.invoiceNumber}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-2 border border-gray-300 font-medium">
                      {bill.invoiceNumber}
                    </td>
                    <td className="p-2 border border-gray-300">
                      {bill.customer?.fullName || "N/A"}
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

                    {/* ACTION BUTTONS */}
                    <td className="p-2 border border-gray-300 text-center flex gap-3 justify-center">
                      {/* Print Button */}
                      <button
                        onClick={() => handlePrintBill(bill)}
                        disabled={printingBill === bill.invoiceNumber}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                      >
                        {printingBill === bill.invoiceNumber
                          ? "Loading..."
                          : "Print"}
                      </button>

                      {/* Excel Button */}
                      <button
                        onClick={() => downloadExcel(bill)}
                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                        title="Download Excel"
                      >
                        <AiFillFileExcel size={20} />
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
      </div>
    </>
  );
};

export default BillList;
