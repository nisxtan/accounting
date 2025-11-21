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
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md ml-auto mr-5">
      <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
        <span className="text-sm text-gray-600">Subtotal:</span>
        <span className="text-sm font-medium text-gray-800">
          {subTotal.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
        <span className="text-sm text-gray-600">Discount:</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={billData.discountPercent}
            onChange={(e) =>
              onUpdateBillData(
                "discountPercent",
                Number.parseFloat(e.target.value) || 0
              )
            }
            className="w-16 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-300"
            min="0"
            max="100"
            step="0.1"
          />
          <span className="text-sm text-gray-600">%</span>
          <span className="text-sm font-medium text-gray-800 w-14 text-right">
            {discountAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
        <span className="text-sm text-gray-600">After Discount:</span>
        <span className="text-sm font-medium text-gray-800">
          {(subTotal - discountAmount).toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
        <span className="text-sm text-gray-600">Taxable Amount:</span>
        <span className="text-sm font-medium text-gray-800">
          {taxableTotal.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
        <span className="text-sm text-gray-600">Non-Taxable Amount:</span>
        <span className="text-sm font-medium text-gray-800">
          {nonTaxableTotal.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
        <span className="text-sm text-gray-600">VAT:</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={billData.vatPercent}
            onChange={(e) =>
              onUpdateBillData(
                "vatPercent",
                Number.parseFloat(e.target.value) || 13
              )
            }
            className="w-16 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-300"
            min="0"
            max="100"
            step="0.1"
          />
          <span className="text-sm text-gray-600">%</span>
          <span className="text-sm font-medium text-gray-800 w-14 text-right">
            {vatAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center py-3 mt-3 pt-3 border-t border-gray-200">
        <span className="text-sm font-semibold text-gray-800">
          Grand Total:
        </span>
        <span className="text-lg font-bold text-gray-900">
          {grandTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default InvoiceSummary;
