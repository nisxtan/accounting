import React from "react";

const InvoiceSummary = ({ totals, billData, onUpdateBillData }) => {
  const {
    subTotal,
    discountAmount,
    taxableTotal,
    nonTaxableTotal,
    vatAmount,
    grandTotal,
  } = totals;
  return (
    <>
      <div className="bg-slate-400 border border-gray-200 rounded p-4 max-w-2xl ml-auto mr-5">
        {/* subtotal */}
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-700">Subtotal:</span>
          <span className="font-semibold">{subTotal.toFixed(2)}</span>
        </div>
        {/* discount */}
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-700">Discount:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={billData.discountPercent}
              onChange={(e) =>
                onUpdateBillData(
                  "discountPercent",
                  parseFloat(e.target.value) || 0
                )
              }
              className="w-20 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
              step="0.1"
            />
            <span className="text-gray-600">%</span>
            <span className="font-semibold w-20 text-right">
              {discountAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* After Discount */}
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-700">After Discount:</span>
          <span className="font-semibold">
            {(subTotal - discountAmount).toFixed(2)}
          </span>
        </div>

        {/* Taxable Amount */}
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-700">Taxable Amount:</span>
          <span className="font-semibold">{taxableTotal.toFixed(2)}</span>
        </div>

        {/* Non-Taxable Amount */}
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-700">Non-Taxable Amount:</span>
          <span className="font-semibold">{nonTaxableTotal.toFixed(2)}</span>
        </div>

        {/* VAT */}
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="text-gray-700">VAT:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={billData.vatPercent}
              onChange={(e) =>
                onUpdateBillData("vatPercent", parseFloat(e.target.value) || 13)
              }
              className="w-20 border border-gray-300 rounded px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
              step="0.1"
            />
            <span className="text-gray-600">%</span>
            <span className="font-semibold w-20 text-right">
              {vatAmount.toFixed(2)}
            </span>
          </div>
        </div>
        {/* Grand Total */}
        <div className="flex justify-between items-center py-3 mt-2">
          <span className="text-lg font-bold text-gray-800">Grand Total:</span>
          <span className="text-xl font-bold text-blue-600">
            {grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </>
  );
};

export default InvoiceSummary;
