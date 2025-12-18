import React from "react";
import { AiOutlineClose } from "react-icons/ai";

const ReturnDetailModal = ({ bill, onClose }) => {
  if (!bill) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const hasReturns = bill.returns && bill.returns.length > 0;
  const totalRefunded = hasReturns
    ? bill.returns.reduce((sum, ret) => sum + (ret.totalRefundAmount || 0), 0)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-red-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">
              Return Details: {bill.invoiceNumber}
            </h2>
            <p className="text-sm opacity-90 mt-1">
              Customer: {bill.customer?.fullName || "N/A"} | Total Returns:{" "}
              {hasReturns ? bill.returns.length : 0}
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-red-700 rounded-full p-2 transition-colors"
          >
            <AiOutlineClose size={22} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {hasReturns ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-600 font-medium">
                    Total Returns
                  </p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {bill.returns.length}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-sm text-gray-600 font-medium">
                    Total Items Returned
                  </p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {bill.returns.reduce(
                      (sum, ret) =>
                        sum +
                        (ret.returnItems?.reduce(
                          (itemSum, item) => itemSum + (item.returnedQuantity || 0),
                          0
                        ) || 0),
                      0
                    )}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <p className="text-sm text-gray-600 font-medium">
                    Total Refunded
                  </p>
                  <p className="text-2xl font-bold text-red-700 mt-1">
                    Rs. {formatCurrency(totalRefunded)}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {bill.returns.map((returnRecord, index) => (
                  <div
                    key={returnRecord.id || index}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-50 p-4 flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800">
                          Return #{returnRecord.returnNumber}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Date:</span>{" "}
                        {formatDate(returnRecord.returnDate)}
                        <span className="ml-4 font-semibold">
                          Refund:{" "}
                          <span className="text-red-600">
                            Rs. {formatCurrency(returnRecord.totalRefundAmount)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      {returnRecord.returnItems &&
                      returnRecord.returnItems.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-3 text-left text-gray-700 font-medium">
                                  Product Name
                                </th>
                                <th className="p-3 text-right text-gray-700 font-medium">
                                  Original Qty
                                </th>
                                <th className="p-3 text-right text-gray-700 font-medium">
                                  Returned Qty
                                </th>
                                <th className="p-3 text-center text-gray-700 font-medium">
                                  Unit
                                </th>
                                <th className="p-3 text-right text-gray-700 font-medium">
                                  Original Rate (Rs.)
                                </th>
                                <th className="p-3 text-right text-gray-700 font-medium">
                                  Refund Rate (Rs.)
                                </th>
                                <th className="p-3 text-right text-gray-700 font-medium">
                                  Refund Amount (Rs.)
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {returnRecord.returnItems.map(
                                (item, itemIndex) => {
                                  // Get product name from different possible sources
                                  const productName = 
                                    item.product?.name || 
                                    item.productName || 
                                    item.originalSalesItem?.product?.name || 
                                    "Unknown Product";
                                  
                                  return (
                                    <tr
                                      key={item.id || itemIndex}
                                      className="border-t hover:bg-gray-50"
                                    >
                                      <td className="p-3 font-medium">
                                        {productName}
                                      </td>
                                      <td className="p-3 text-right">
                                        {item.originalQuantity}
                                      </td>
                                      <td className="p-3 text-right font-semibold">
                                        {item.returnedQuantity}
                                      </td>
                                      <td className="p-3 text-center">
                                        {item.unit}
                                      </td>
                                      <td className="p-3 text-right">
                                        {formatCurrency(item.originalRate)}
                                      </td>
                                      <td className="p-3 text-right">
                                        {formatCurrency(item.refundRate)}
                                      </td>
                                      <td className="p-3 text-right font-bold text-red-600">
                                        {formatCurrency(item.refundAmount)}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t">
                              <tr>
                                <td
                                  colSpan="6"
                                  className="p-3 text-right font-semibold text-gray-700"
                                >
                                  Total Refund for this Return:
                                </td>
                                <td className="p-3 text-right font-bold text-red-700">
                                  Rs.{" "}
                                  {formatCurrency(
                                    returnRecord.totalRefundAmount
                                  )}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">
                          No return items found
                        </p>
                      )}

                      {returnRecord.reason && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm">
                            <span className="font-medium text-yellow-800">
                              Return Reason:
                            </span>{" "}
                            <span className="text-yellow-700">
                              {returnRecord.reason}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                  Overall Returns Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded border">
                    <p className="text-sm text-gray-600 mb-1">
                      Number of Returns
                    </p>
                    <p className="text-xl font-bold text-blue-700">
                      {bill.returns.length}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <p className="text-sm text-gray-600 mb-1">
                      Total Items Returned
                    </p>
                    <p className="text-xl font-bold text-green-700">
                      {bill.returns.reduce(
                        (sum, ret) =>
                          sum +
                          (ret.returnItems?.reduce(
                            (itemSum, item) => itemSum + (item.returnedQuantity || 0),
                            0
                          ) || 0),
                        0
                      )}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <p className="text-sm text-gray-600 mb-1">
                      Total Refund Amount
                    </p>
                    <p className="text-xl font-bold text-red-700">
                      Rs. {formatCurrency(totalRefunded)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    This invoice has {bill.returns.length} return record(s) with a total refund of{" "}
                    <span className="font-bold text-red-600">
                      Rs. {formatCurrency(totalRefunded)}
                    </span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-3">
                No return records found
              </div>
              <p className="text-gray-400">
                This invoice has no associated returns.
              </p>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            Print Summary
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnDetailModal;