import React from "react";

const Table = () => {
  return (
    <div className="w-full overflow-x-auto p-4">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">#</th>
            <th className="border p-2">Product</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Unit</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Taxable</th>
            <th className="border p-2">Discount %</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {/* Placeholder row */}
          <tr>
            <td className="border p-2 text-center">1</td>
            <td className="border p-2">Select product</td>
            <td className="border p-2">0</td>
            <td className="border p-2">unit</td>
            <td className="border p-2">0</td>
            <td className="border p-2">No</td>
            <td className="border p-2">0%</td>
            <td className="border p-2 font-semibold">0.00</td>
            <td className="border p-2 text-center">
              <button className="text-red-500">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Add Row Button */}
      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
        Add Item
      </button>
    </div>
  );
};

export default Table;
