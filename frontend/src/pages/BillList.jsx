import { useEffect, useState } from "react";
import billService from "../api/billServices";

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
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 700);
    return () => clearTimeout(timer);
  }, [filters]);
  useEffect(() => {
    fetchBill();
  }, [debouncedFilters]);
  const fetchBill = async () => {
    try {
      setLoading(true);
      const response = await billService.getAllBills(debouncedFilters);

      setBills(response || []);
    } catch (error) {
      setError("Failed to load bills");
      console.error("Failed to fetch bills", error);
    } finally {
      setLoading(false);
    }
  };
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
      customerName: "",
      isTaxable: "",
      minTotal: "",
      maxTotal: "",
    });
  };

  if (loading) return <div className="p-4">Loading Bills...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  return (
    <>
      {/* Filters Section */}
      <div className="p-4 bg-white border-b grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Customer Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name
          </label>
          <input
            type="text"
            placeholder="Search customer..."
            value={filters.customerName}
            onChange={(e) => handleFilterChange("customerName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Taxable Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taxable
          </label>
          <select
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

      {/* Table (same as before) */}
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
            {bills.map((item) => (
              <tr key={item.invoiceNumber} className="border-b">
                <td className="p-2">{item.invoiceNumber}</td>
                <td className="p-2">{item.customer}</td>
                <td className="p-2">{item.salesDate}</td>
                <td className="p-2">{item.taxableTotal > 0 ? "Yes" : "No"}</td>
                <td className="p-2">{item.grandTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 text-sm text-gray-600">
          Showing {bills.length} bills
        </div>
      </div>
    </>
  );
};

export default BillList;
