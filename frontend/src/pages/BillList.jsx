import { useEffect, useRef, useState } from "react";
import billService from "../api/billServices";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

const BillList = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    customerName: "",
    isTaxable: "",
    minTotal: "",
    maxTotal: "",
  });

  // TRACK WHICH FIELD IS ACTIVE
  const [activeField, setActiveField] = useState(null);

  //  Track cursor position
  const cursorPositionRef = useRef(null);

  // INPUT REFS
  const inputRefs = {
    customerName: useRef(null),
    isTaxable: useRef(null),
    minTotal: useRef(null),
    maxTotal: useRef(null),
  };

  // PAGINATION
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // debounce only - don't restore focus here
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 700);

    return () => clearTimeout(timer);
  }, [filters]);

  // Restore focus AFTER data finishes loading
  useEffect(() => {
    if (!loading && activeField && inputRefs[activeField]?.current) {
      const input = inputRefs[activeField].current;
      input.focus();

      // Restore cursor position for text inputs
      if (cursorPositionRef.current !== null && input.setSelectionRange) {
        input.setSelectionRange(
          cursorPositionRef.current,
          cursorPositionRef.current
        );
      }
    }
  }, [loading, bills]); // Triggers after data loads

  // FETCH DATA
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

      setBills(response.result || response || []);
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
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    //save cursor position before updating
    if (inputRefs[filterName]?.current) {
      cursorPositionRef.current = inputRefs[filterName].current.selectionStart;
    }

    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
      customerName: "",
      isTaxable: "",
      minTotal: "",
      maxTotal: "",
    });
    setActiveField(null);
    cursorPositionRef.current = null;
  };

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <>
      {/* Filters Section */}
      <div className="p-4 bg-white border-b grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Customer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name
          </label>
          <input
            ref={inputRefs.customerName}
            onFocus={() => setActiveField("customerName")}
            onBlur={() => {
              // Save cursor position on blur
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

        {/* Taxable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taxable
          </label>
          <select
            ref={inputRefs.isTaxable}
            onFocus={() => setActiveField("isTaxable")}
            value={filters.isTaxable}
            onChange={(e) => handleFilterChange("isTaxable", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="true">Taxable</option>
            <option value="false">Non-Taxable</option>
          </select>
        </div>

        {/* Min Total */}
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

        {/* Max Total */}
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

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-4 text-center text-gray-500">Loading Bills...</div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-500 text-left text-sm font-semibold">
              <th className="p-2">INV #</th>
              <th className="p-2">CUSTOMER</th>
              <th className="p-2">DATE OF SALE</th>
              <th className="p-2">TAXABLE</th>
              <th className="p-2">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No bills found
                </td>
              </tr>
            ) : (
              bills.map((item) => (
                <tr
                  key={item.invoiceNumber}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-2">{item.invoiceNumber}</td>
                  <td className="p-2">{item.customer}</td>
                  <td className="p-2">{item.salesDate}</td>
                  <td className="p-2">
                    {item.taxableTotal > 0 ? "Yes" : "No"}
                  </td>
                  <td className="p-2">{item.grandTotal}</td>
                </tr>
              ))
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
          Showing {bills.length} of {pagination.totalCount} bills
        </div>
      </div>
    </>
  );
};

export default BillList;
