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
// isTaxable: "",
minTotal: "",
maxTotal: "",
});

const [activeField, setActiveField] = useState(null);
const cursorPositionRef = useRef(null);

const inputRefs = {
customerName: useRef(null),
isTaxable: useRef(null),
minTotal: useRef(null),
maxTotal: useRef(null),
};

const [pagination, setPagination] = useState({
page: 1,
limit: 5,
totalCount: 0,
totalPages: 0,
hasNext: false,
hasPrev: false,
});

const [debouncedFilters, setDebouncedFilters] = useState(filters);

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
if (inputRefs[filterName]?.current) {
cursorPositionRef.current = inputRefs[filterName].current.selectionStart;
}
setFilters((prev) => ({ ...prev, [filterName]: value }));
};

const clearFilters = () => {
setFilters({
customerName: "",
// isTaxable: "",
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
{/_ Filters Section _/}
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

        {/* {*} */}

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
              <th className="p-2 border border-gray-400">Product</th>
              <th className="p-2 border border-gray-400">Qty</th>
              <th className="p-2 border border-gray-400">Unit</th>
              <th className="p-2 border border-gray-400">Rate</th>
              <th className="p-2 border border-gray-400">Item Disc%</th>
              <th className="p-2 border border-gray-400">Taxable</th>
              <th className="p-2 border border-gray-400">Item Total</th>
              <th className="p-2 border border-gray-400">Bill Disc%</th>
              <th className="p-2 border border-gray-400">VAT%</th>
              <th className="p-2 border border-gray-400">Grand Total</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td
                  colSpan="13"
                  className="p-4 text-center text-gray-500 border"
                >
                  No bills found
                </td>
              </tr>
            ) : (
              bills.map((bill) => {
                const items = bill.items || [];
                // console.log(items);
                if (items.length === 0) {
                  // If no items, show bill info with empty product columns
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
                      <td
                        className="p-2 border border-gray-300 text-gray-400 italic"
                        colSpan="7"
                      >
                        No items
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
                    </tr>
                  );
                }

                // Render one row per product
                return items.map((item, idx) => (
                  <tr
                    key={`${bill.invoiceNumber}-${idx}`}
                    className={`border-b hover:bg-gray-50 ${
                      idx > 0 ? "bg-gray-50" : ""
                    }`}
                  >
                    {/* Show bill info only in first row */}
                    {idx === 0 ? (
                      <>
                        <td
                          className="p-2 border border-gray-300 font-medium align-top"
                          rowSpan={items.length}
                        >
                          {bill.invoiceNumber}
                        </td>
                        <td
                          className="p-2 border border-gray-300 align-top"
                          rowSpan={items.length}
                        >
                          {bill.customer}
                        </td>
                        <td
                          className="p-2 border border-gray-300 align-top"
                          rowSpan={items.length}
                        >
                          {new Date(bill.salesDate).toLocaleDateString()}
                        </td>
                      </>
                    ) : null}

                    {/* Product details - shown in every row */}
                    <td className="p-2 border border-gray-300">
                      {item.product?.name || "N/A"}
                    </td>
                    <td className="p-2 border border-gray-300 text-right">
                      {item.quantity}
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {item.unit}
                    </td>
                    <td className="p-2 border border-gray-300 text-right">
                      Rs. {item.rate} {/* Show the actual rate from database */}
                      <span className="text-xs text-gray-500 ml-1">
                        per {item.unit === "dozen" ? "dozen" : "piece"}
                      </span>
                    </td>
                    <td className="p-2 border border-gray-300 text-center text-red-600">
                      {item.discountPercent}%
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {item.isTaxable ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                    </td>
                    <td className="p-2 border border-gray-300 text-right font-medium">
                      {item.unit === "dozen"
                        ? `Rs. ${(item.individualRate * 12).toFixed(2)}`
                        : item.unit === "box"
                        ? `Rs. ${(item.individualRate * 6).toFixed(2)}`
                        : `Rs. ${(item.individualRate * item.quantity).toFixed(
                            2
                          )}`}
                    </td>

                    {/* Bill totals - shown only in first row */}
                    {idx === 0 ? (
                      <>
                        <td
                          className="p-2 border border-gray-300 text-center align-top"
                          rowSpan={items.length}
                        >
                          {bill.discountPercent}%
                        </td>
                        <td
                          className="p-2 border border-gray-300 text-center align-top"
                          rowSpan={items.length}
                        >
                          {bill.vatPercent}%
                        </td>
                        <td
                          className="p-2 border border-gray-300 font-bold text-green-700 text-right align-top"
                          rowSpan={items.length}
                        >
                          Rs. {bill.grandTotal?.toFixed(2)}
                        </td>
                      </>
                    ) : null}
                  </tr>
                ));
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
