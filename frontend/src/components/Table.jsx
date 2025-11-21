import React from "react";
import { AiFillDelete } from "react-icons/ai";

const Table = ({
  items,
  products,
  totals,
  onUpdateItem,
  onRemoveRow,
  onAddRow,
}) => {
  const handleInputChange = (id, field, value) => {
    if (field === "unit") {
      // const currentItem = items.find((item) => item.id === id);
      // Auto-adjust quantity
      //   if (value === "dozen" && currentItem.unit === "pcs") {
      //     onUpdateItem(id, "quantity", 12); // 1 dozen = 12 pcs
      //   } else if (value === "pcs" && currentItem.unit === "dozen") {
      //     onUpdateItem(id, "quantity", 1); // 12 pcs = 1 dozen
      //   } else if (value === "box" && currentItem.unit === "pcs") {
      //     onUpdateItem(id, "quantity", 6); // 1 box = 6 pcs
      //   } else if (value === "pcs" && currentItem.unit === "box") {
      //     onUpdateItem(id, "quantity", 1); // 6 pcs = 1 box
      //   } else if (value === "box" && currentItem.unit === "dozen") {
      //     onUpdateItem(id, "quantity", 2); // 1 box = 2 dozen (if 1 box = 24 pcs)
      //   } else if (value === "dozen" && currentItem.unit === "box") {
      //     onUpdateItem(id, "quantity", 1); // 2 dozen = 1 box
      //   }
    }

    onUpdateItem(id, field, field === "isTaxable" ? value === "true" : value);
  };

  const getProductRate = (productId) => {
    const product = products.find((p) => p.id == productId);
    return product ? product.baseRate : 0;
  };

  return (
    <div className="w-full overflow-x-auto p-4">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-500 text-left text-sm font-semibold">
            <th className="p-2">PRODUCT*</th>
            <th className="p-2">QTY*</th>
            <th className="p-2">UNIT</th>
            <th className="p-2">IS TAXABLE</th>
            <th className="p-2">RATE*</th>
            <th className="p-2">DISC %</th>
            <th className="p-2">DISC AMT</th>
            <th className="p-2">TOTAL*</th>
            <th className="p-2">ACTION</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              {/* PRODUCT */}
              <td className="p-2">
                <select
                  value={item.productId}
                  onChange={(e) => {
                    const productId = e.target.value;
                    handleInputChange(item.id, "productId", productId);
                    if (productId) {
                      handleInputChange(
                        item.id,
                        "rate",
                        getProductRate(productId)
                      );
                    }
                  }}
                  className="w-full border border-black-300 rounded px-2 py-1"
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </td>

              {/* QTY */}
              <td className="p-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleInputChange(
                      item.id,
                      "quantity",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full border border-black-300 rounded px-2 py-1"
                  min="1"
                />
              </td>

              {/* UNIT */}
              <td className="p-2">
                <select
                  value={item.unit}
                  onChange={(e) =>
                    handleInputChange(item.id, "unit", e.target.value)
                  }
                  className="w-full border border-black-300 rounded px-2 py-1"
                >
                  <option value="pcs">Pcs</option>
                  <option value="dozen">Dozen</option>
                  <option value="box">Box</option>
                </select>
              </td>

              {/* IS TAXABLE */}
              <td className="p-2">
                <select
                  value={item.isTaxable}
                  onChange={(e) =>
                    handleInputChange(item.id, "isTaxable", e.target.value)
                  }
                  className="w-full border border-black-300 rounded px-2 py-1"
                >
                  <option value={true}>Yes</option>
                  <option value={false}>No</option>
                </select>
              </td>

              {/* RATE */}
              <td className="p-2">
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) =>
                    handleInputChange(
                      item.id,
                      "rate",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full border border-black-300 rounded px-2 py-1"
                  step="0.01"
                />
              </td>

              {/* DISCOUNT % */}
              <td className="p-2">
                <input
                  type="number"
                  value={item.discountPercent}
                  onChange={(e) =>
                    handleInputChange(
                      item.id,
                      "discountPercent",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full border border-black-300 rounded px-2 py-1"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </td>

              {/* DISC AMT */}
              <td className="p-2">
                <input
                  type="number"
                  value={
                    totals?.calculatedItems?.find(
                      (calcItem) => calcItem.id === item.id
                    )?.discountAmount || 0
                  }
                  disabled
                  className="w-full border border-black-300 rounded px-2 py-1 bg-gray-100"
                />
              </td>

              {/* TOTAL */}
              <td className="p-2">
                <input
                  type="number"
                  disabled
                  value={
                    totals?.calculatedItems?.find(
                      (calcItem) => calcItem.id === item.id
                    )?.finalTotal || 0
                  }
                  className="w-full border border-black-300 rounded px-2 py-1 bg-gray-100 font-semibold"
                />
              </td>

              {/* ACTION */}
              <td className="p-2 text-center">
                <button
                  onClick={() => onRemoveRow(item.id)}
                  className="text-red-500 text-xl hover:text-red-700"
                >
                  <AiFillDelete />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-4">
        <button
          onClick={onAddRow}
          className="bg-slate-700 text-white px-4 py-2 rounded shadow hover:bg-slate-500"
        >
          + Add Row
        </button>
      </div>
    </div>
  );
};

export default Table;
