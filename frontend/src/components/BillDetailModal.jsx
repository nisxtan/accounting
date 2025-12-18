import React from "react";
import { AiOutlineClose } from "react-icons/ai";

const BillDetailModal = ({ bill, onClose }) => {
  if (!bill) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Invoice: {bill.invoiceNumber}</h2>
          <button onClick={onClose} className="hover:bg-blue-700 rounded p-1">
            <AiOutlineClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-gray-600">Customer</p>
              <p className="font-semibold">
                {bill.customer?.fullName || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Date</p>
              <p className="font-semibold">
                {new Date(bill.salesDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-center">Unit</th>
                  <th className="p-2 text-right">Rate</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items && bill.items.length > 0 ? (
                  bill.items.map((item, index) => (
                    <tr key={item.id || index} className="border-t">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{item.product?.name || "N/A"}</td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-center">{item.unit}</td>
                      <td className="p-2 text-right">
                        Rs. {item.rate.toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-medium">
                        Rs. {item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded p-4 max-w-sm ml-auto">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {bill.subTotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount ({bill.discountPercent}%):</span>
                <span>- Rs. {bill.discountAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT ({bill.vatPercent}%):</span>
                <span>Rs. {bill.vatAmount?.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Grand Total:</span>
                <span className="text-green-600">
                  Rs. {bill.grandTotal?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillDetailModal;
