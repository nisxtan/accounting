import React from "react";
import { AiFillDelete } from "react-icons/ai";
import ProductSelect from "./ProductSelect";

const Table = ({
  items,
  products,
  totals,
  onUpdateItem,
  onRemoveRow,
  onAddRow,

  isReturnMode = false, // Default: sales mode
  isReadOnly = false, // Default: editable
  originalQuantities = {}, // For showing original sold quantities
  availableQuantities = {}, // For showing available to return
}) => {
  const handleInputChange = (id, field, value) => {
    // Don't update if in read-only mode
    if (isReadOnly) return;

    if (field === "unit") {
    }

    // For returns, validate return quantity doesn't exceed available
    if (isReturnMode && field === "returnedQuantity") {
      const currentItem = items.find((item) => item.id === id);
      const maxAvailable = availableQuantities[id] || 0;
      const newValue = Math.max(0, parseInt(value) || 0);
      value = Math.min(newValue, maxAvailable);
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
          <tr className="bg-slate-400 text-left text-sm font-semibold">
            {/* PRODUCT */}
            <th className="p-2">PRODUCT*</th>

            {/* QUANTITY COLUMNS - DIFFERENT FOR SALES VS RETURNS */}
            {isReturnMode ? (
              <>
                <th className="p-2">ORIGINAL QTY</th>
                <th className="p-2">AVAILABLE</th>
                <th className="p-2">RETURN QTY*</th>
              </>
            ) : (
              <th className="p-2">QTY*</th>
            )}

            <th className="p-2">UNIT</th>
            <th className="p-2">IS TAXABLE</th>

            {/* RATE COLUMNS - DIFFERENT FOR SALES VS RETURNS */}
            {isReturnMode ? (
              <>
                <th className="p-2">ORIGINAL RATE</th>
                <th className="p-2">REFUND RATE*</th>
              </>
            ) : (
              <th className="p-2">RATE*</th>
            )}

            <th className="p-2">DISC %</th>
            <th className="p-2">DISC AMT</th>

            {/* TOTAL - DIFFERENT FOR RETURNS */}
            <th className="p-2">{isReturnMode ? "REFUND AMOUNT" : "TOTAL*"}</th>

            {/* REASON FOR RETURNS */}
            {isReturnMode && <th className="p-2">REASON</th>}

            <th className="p-2">ACTION</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            // Find calculated item for totals
            const calculatedItem = totals?.calculatedItems?.find(
              (calcItem) => calcItem.id === item.id
            );

            // For returns, get original and available quantities
            const originalQty =
              originalQuantities[item.id] || item.quantity || 0;
            const availableQty =
              availableQuantities[item.id] || item.availableToReturn || 0;
            const canReturn = item.canReturn !== false;

            return (
              <tr key={item.id} className="border-b">
                {/* PRODUCT - Read-only for returns */}
                <td className="p-2">
                  {isReturnMode ? (
                    // Read-only display for returns
                    <div className="py-2 font-medium">
                      {item.productName || "Product"}
                    </div>
                  ) : (
                    // Editable dropdown for sales
                    <div className="flex gap-2">
                      <ProductSelect
                        products={products}
                        value={item.productId || ""}
                        onChange={(productId) => {
                          handleInputChange(item.id, "productId", productId);
                          if (productId) {
                            handleInputChange(
                              item.id,
                              "rate",
                              getProductRate(productId)
                            );
                          }
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                  )}
                </td>

                {/* QUANTITY FIELDS */}
                {isReturnMode ? (
                  <>
                    {/* ORIGINAL QTY (read-only) */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={originalQty}
                        disabled
                        className="w-full border border-black-300 rounded px-2 py-1 bg-gray-100"
                      />
                    </td>

                    {/* AVAILABLE TO RETURN (read-only) */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={availableQty}
                        disabled
                        className={`w-full border border-black-300 rounded px-2 py-1 ${
                          availableQty > 0 ? "bg-green-50" : "bg-gray-100"
                        }`}
                      />
                    </td>

                    {/* RETURN QTY (editable) */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.returnedQuantity || 0}
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "returnedQuantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className={`w-full border border-black-300 rounded px-2 py-1 ${
                          !canReturn ? "bg-gray-100" : ""
                        }`}
                        min="0"
                        max={availableQty}
                        disabled={!canReturn || isReadOnly}
                      />
                    </td>
                  </>
                ) : (
                  /* SALES QTY (editable) */
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
                      disabled={isReadOnly}
                    />
                  </td>
                )}

                {/* UNIT */}
                <td className="p-2">
                  {isReturnMode ? (
                    // Read-only for returns
                    <div className="py-2">{item.unit || "Pcs"}</div>
                  ) : (
                    // Editable for sales
                    <select
                      value={item.unit}
                      onChange={(e) =>
                        handleInputChange(item.id, "unit", e.target.value)
                      }
                      className="w-full border border-black-300 rounded px-2 py-1"
                      disabled={isReadOnly}
                    >
                      <option value="pcs">Pcs</option>
                      <option value="dozen">Dozen</option>
                      <option value="box">Box</option>
                    </select>
                  )}
                </td>

                {/* IS TAXABLE */}
                <td className="p-2">
                  {isReturnMode ? (
                    // Read-only for returns
                    <div className="py-2">{item.isTaxable ? "Yes" : "No"}</div>
                  ) : (
                    // Editable for sales
                    <select
                      value={item.isTaxable}
                      onChange={(e) =>
                        handleInputChange(item.id, "isTaxable", e.target.value)
                      }
                      className="w-full border border-black-300 rounded px-2 py-1"
                      disabled={isReadOnly}
                    >
                      <option value={true}>Yes</option>
                      <option value={false}>No</option>
                    </select>
                  )}
                </td>

                {/* RATE FIELDS */}
                {isReturnMode ? (
                  <>
                    {/* ORIGINAL RATE (read-only) */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.rate || 0}
                        disabled
                        className="w-full border border-black-300 rounded px-2 py-1 bg-gray-100"
                      />
                    </td>

                    {/* REFUND RATE (editable) */}
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.refundRate || item.rate || 0}
                        onChange={(e) =>
                          handleInputChange(
                            item.id,
                            "refundRate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full border border-black-300 rounded px-2 py-1"
                        step="0.01"
                        disabled={isReadOnly}
                      />
                    </td>
                  </>
                ) : (
                  /* SALES RATE (editable) */
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
                      disabled={isReadOnly}
                    />
                  </td>
                )}

                {/* DISCOUNT % */}
                <td className="p-2">
                  {isReturnMode ? (
                    // Read-only or maybe not applicable for returns
                    <div className="py-2">-</div>
                  ) : (
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
                      disabled={isReadOnly}
                    />
                  )}
                </td>

                {/* DISC AMT */}
                <td className="p-2">
                  <input
                    type="number"
                    value={calculatedItem?.discountAmount || 0}
                    disabled
                    className="w-full border border-black-300 rounded px-2 py-1 bg-gray-100"
                  />
                </td>

                {/* TOTAL / REFUND AMOUNT */}
                <td className="p-2">
                  <input
                    type="number"
                    disabled
                    value={
                      isReturnMode
                        ? (item.returnedQuantity || 0) *
                          (item.refundRate || item.rate || 0)
                        : calculatedItem?.finalTotal || 0
                    }
                    className="w-full border border-black-300 rounded px-2 py-1 bg-gray-100 font-semibold"
                  />
                </td>

                {/* REASON (for returns only) */}
                {isReturnMode && (
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.reason || ""}
                      onChange={(e) =>
                        handleInputChange(item.id, "reason", e.target.value)
                      }
                      placeholder="Reason for return"
                      className="w-full border border-black-300 rounded px-2 py-1"
                      disabled={isReadOnly}
                    />
                  </td>
                )}

                {/* ACTION */}
                <td className="p-2 text-center">
                  {isReturnMode ? (
                    // For returns, you might not want delete, or only delete if quantity is 0
                    <span className="text-gray-400">-</span>
                  ) : (
                    <button
                      onClick={() => onRemoveRow(item.id)}
                      className="text-red-500 text-xl hover:text-red-700"
                      disabled={isReadOnly}
                    >
                      <AiFillDelete />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ADD ROW BUTTON - Only for sales */}
      {!isReturnMode && (
        <div className="flex justify-end mt-4">
          <button
            onClick={onAddRow}
            className="bg-slate-700 text-white px-4 py-2 rounded shadow hover:bg-slate-500"
            disabled={isReadOnly}
          >
            + Add Row
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;
