import React, { useState, useEffect } from "react";
import {
  AiOutlineMenu,
  AiFillHome,
  AiOutlineShoppingCart,
  AiOutlineBarChart,
  AiFillMoneyCollect,
  AiOutlineUser,
  AiOutlinePlus,
  AiOutlineLogout,
  AiFillBook,
  AiFillCalendar,
} from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { persistor } from "../redux/store";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import customerService from "../api/customerService";
import returnService from "../api/returnService";
import Table from "../components/Table";
import InputComponent from "../components/InputComponent";
import InvoiceSummary from "../components/InvoiceSummary";

const ReturnPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  // State for return
  const [returnNumber, setReturnNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [originalInvoiceData, setOriginalInvoiceData] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [step, setStep] = useState(1); // 1: Enter invoice, 2: View, 3: Edit

  // State for customers
  const [customerOptions, setCustomerOptions] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // Get return number on page load
  useEffect(() => {
    fetchReturnNumber();
    loadCustomers();
  }, []);

  const fetchReturnNumber = async () => {
    try {
      setLoading(true);
      const response = await returnService.getNewReturnNumber();
      console.log("Fetched number", response);
      setReturnNumber(response.returnNumber);
      setMessage("Return number generated successfully");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate return number");
    } finally {
      setLoading(false);
    }
  };

  // Load customers (same as Home.jsx)
  const loadCustomers = async (search = "") => {
    try {
      setIsLoadingCustomers(true);
      const response = await customerService.getAllCustomers({
        search: search,
        page: 1,
        limit: 20,
      });

      const options =
        response.data?.customers?.map((customer) => ({
          value: customer.id,
          label: `${customer.fullName}${
            customer.phone ? ` (${customer.phone})` : ""
          }${customer.email ? ` - ${customer.email}` : ""}`,
          customerData: customer,
        })) || [];

      setCustomerOptions(options);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomerOptions([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Load invoice when entered
  const handleLoadInvoice = async () => {
    if (!invoiceNumber.trim()) {
      setError("Please enter an invoice number");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await returnService.getInvoiceForReturn(invoiceNumber);
      // console.log("API Response for invoice", invoiceNumber, ":", response);
      // console.log("Response items:", response.items);
      // console.log("First item:", response.items[0]);
      setOriginalInvoiceData(response);
      setStep(2);

      // Transform to Table component format
      const itemsForTable = response.items.map((item) => ({
        id: item.id, // salesItemId
        productId: item.productId,
        productName: item.productName,
        quantity: item.originalQuantity, // Original sold quantity
        unit: item.unit,
        rate: item.rate, // Original rate
        isTaxable: item.isTaxable,
        discountPercent: 0, // Not applicable for returns

        // Return-specific fields
        availableToReturn: item.availableToReturn,
        returnedQuantity: 0, // Editable - start with 0
        refundRate: item.rate, // Editable - default to original rate
        reason: "", // Editable per item
        canReturn: item.canReturn,

        // For Table component display
        originalQuantity: item.originalQuantity,
        alreadyReturned: item.alreadyReturned,
      }));

      setReturnItems(itemsForTable);
      setMessage(`Invoice ${invoiceNumber} loaded successfully`);

      if (!response.canReturn) {
        setError("This invoice has no items available for return");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  // Update item field
  const updateItem = (itemId, field, value) => {
    setReturnItems((items) =>
      items.map((item) => {
        if (item.id === itemId) {
          // Special validation for returned quantity
          if (field === "returnedQuantity") {
            const newQty = Math.max(0, parseInt(value) || 0);
            const maxAllowed = item.availableToReturn;
            return {
              ...item,
              [field]: Math.min(newQty, maxAllowed),
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Remove row (not really needed for returns but kept for consistency)
  const removeRow = (itemId) => {
    setReturnItems((items) => items.filter((item) => item.id !== itemId));
  };

  // Add empty row (not applicable for returns)
  // const addEmptyRow = () => {
  //   console.log("Add row not applicable for returns");
  // };

  // Calculate totals for InvoiceSummary
  const calculateTotals = () => {
    const itemsWithReturn = returnItems.filter(
      (item) => item.returnedQuantity > 0
    );

    const subTotal = itemsWithReturn.reduce(
      (sum, item) => sum + item.returnedQuantity * item.refundRate,
      0
    );

    return {
      subTotal,
      discountAmount: 0,
      taxableTotal: itemsWithReturn
        .filter((item) => item.isTaxable)
        .reduce(
          (sum, item) => sum + item.returnedQuantity * item.refundRate,
          0
        ),
      nonTaxableTotal: itemsWithReturn
        .filter((item) => !item.isTaxable)
        .reduce(
          (sum, item) => sum + item.returnedQuantity * item.refundRate,
          0
        ),
      vatAmount: 0, // You can calculate VAT if needed
      grandTotal: subTotal,
      calculatedItems: itemsWithReturn.map((item) => ({
        id: item.id,
        discountAmount: 0,
        finalTotal: item.returnedQuantity * item.refundRate,
      })),
    };
  };

  // Prepare data for Table component
  const prepareTableData = () => {
    // Create originalQuantities and availableQuantities objects for Table
    const originalQuantities = {};
    const availableQuantities = {};

    returnItems.forEach((item) => {
      originalQuantities[item.id] = item.originalQuantity || item.quantity;
      availableQuantities[item.id] = item.availableToReturn;
    });

    return {
      originalQuantities,
      availableQuantities,
    };
  };

  // Proceed to return editing
  const handleProceedToReturn = () => {
    if (!originalInvoiceData?.canReturn) {
      setError("No items available for return");
      return;
    }
    setIsReadOnly(false);
    setStep(3);
  };

  // Submit return
  const handleSubmitReturn = async () => {
    const itemsToReturn = returnItems
      .filter((item) => item.returnedQuantity > 0)
      .map((item) => ({
        originalSalesItemId: item.id,
        returnedQuantity: item.returnedQuantity,
        refundRate: item.refundRate,
        reason: item.reason || "",
      }));

    if (itemsToReturn.length === 0) {
      setError("Please select at least one item to return (quantity > 0)");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter a reason for the return");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await returnService.createReturn({
        invoiceNumber,
        reason,
        items: itemsToReturn,
      });

      setMessage(
        `Return ${response.return.returnNumber} created successfully!`
      );
      setStep(4); // Success step

      // Reset form after success
      setTimeout(() => {
        setInvoiceNumber("");
        setOriginalInvoiceData(null);
        setReturnItems([]);
        setReason("");
        setIsReadOnly(true);
        setStep(1);
        fetchReturnNumber(); // Get new return number
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create return");
    } finally {
      setLoading(false);
    }
  };

  // Logout (same as Home.jsx)
  const handleLogout = () => {
    dispatch(logout());
    persistor.purge();
  };

  // Go back to view mode
  const handleBackToView = () => {
    setIsReadOnly(true);
    setStep(2);
  };

  // Reset form
  const handleReset = () => {
    setInvoiceNumber("");
    setOriginalInvoiceData(null);
    setReturnItems([]);
    setReason("");
    setIsReadOnly(true);
    setStep(1);
    setError("");
    setMessage("");
    fetchReturnNumber();
  };

  // Prepare table props
  const tableData = prepareTableData();

  useEffect(() => {
    // console.log("OID=:>", originalInvoiceData);
  }, [originalInvoiceData]);

  return (
    <div className="bg-slate-300 min-h-screen">
      {/* Header - Same as Home.jsx */}
      <header className="flex justify-between items-start px-6 py-3 gap-3">
        <div className="flex items-center gap-3">
          <AiOutlineMenu className="text-2xl mt-1" />
          <div className="text-2xl font-semibold mb-1">AQUIDEN</div>
        </div>
        <div className="flex text-2xl justify-between gap-5">
          <div>
            <AiFillHome />
          </div>
          <div>
            <AiOutlineShoppingCart />
          </div>
          <div>
            <AiOutlineBarChart />
          </div>
          <div>
            <AiFillMoneyCollect />
          </div>
          <div>
            <AiFillMoneyCollect />
          </div>
        </div>
        <div className="flex text-xl items-center gap-3">
          {user && (
            <div className="font-medium">
              Welcome, <span className="text-blue-600">{user.name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Logout"
          >
            <AiOutlineLogout />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </header>

      {/* Return Input Section */}
      <div className="flex justify-evenly items-center px-6 py-6 gap-3">
        <InputComponent
          icon={AiFillBook}
          label="Return Number"
          required={false}
          value={loading ? "Loading..." : returnNumber || ""}
          disabled={true}
        />

        {/* Return Date */}
        <InputComponent
          icon={AiFillCalendar}
          label="Return Date"
          required={true}
          type="date"
          value={new Date().toISOString().split("T")[0]}
          disabled={true}
        />

        {/* Invoice Number Input */}
        <div className="w-full max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Original Invoice Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="INV-0001"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && handleLoadInvoice()}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500"
              disabled={loading || step > 1}
            />
            <button
              onClick={handleLoadInvoice}
              disabled={loading || !invoiceNumber.trim() || step > 1}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? "Loading..." : "Load Invoice"}
            </button>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className="mx-6 mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          {message}
        </div>
      )}
      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Invoice Details Display */}
      {originalInvoiceData && step >= 2 && (
        <div className="mx-6 mb-4 p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                Invoice: {originalInvoiceData.invoiceNumber}
              </h3>
              <p className="text-gray-600">
                Customer: {originalInvoiceData.customer?.name}
              </p>
              <p className="text-gray-600">
                Date:{" "}
                {new Date(originalInvoiceData.salesDate).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-2">
                <span className="font-medium">Summary: </span>
                Sold: {originalInvoiceData.summary?.totalSold || 0} | Returned:{" "}
                {originalInvoiceData.summary?.totalReturned || 0} | Available:{" "}
                {originalInvoiceData.summary?.pendingReturn || 0}
              </div>

              {step === 2 && (
                <button
                  onClick={handleProceedToReturn}
                  disabled={!originalInvoiceData.canReturn || loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Proceed to Return
                </button>
              )}

              {step === 3 && (
                <div className="text-green-600 font-semibold">
                  Editing Return
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex mx-6 gap-6">
        <div className="flex-1">
          {originalInvoiceData && step >= 2 && (
            <Table
              items={returnItems}
              products={[]} // Not needed for returns
              totals={calculateTotals()}
              onUpdateItem={updateItem}
              onRemoveRow={removeRow}
              isReturnMode={true}
              isReadOnly={isReadOnly}
              originalQuantities={tableData.originalQuantities}
              availableQuantities={tableData.availableQuantities}
            />
          )}
        </div>

        {/* Right: Invoice Summary & Actions */}
        <div className="w-96">
          {originalInvoiceData && step >= 2 && (
            <>
              {/* Invoice Summary */}
              <InvoiceSummary
                totals={calculateTotals()}
                billData={{
                  discountPercent: 0, // No discount on returns
                  vatPercent: originalInvoiceData.items.some(
                    (item) => item.isTaxable
                  )
                    ? 13
                    : 0,
                }}
                onUpdateBillData={() => {}} // Not needed for returns
              />

              {/* Reason Input and Actions */}
              {step === 3 && (
                <div className="mt-4 p-4 bg-white rounded-lg shadow">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overall Return Reason{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is the customer returning these items?"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                      rows="3"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleSubmitReturn}
                      disabled={
                        loading ||
                        returnItems.filter((item) => item.returnedQuantity > 0)
                          .length === 0
                      }
                      className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400 font-semibold"
                    >
                      {loading ? "Submitting..." : "Submit Return"}
                    </button>

                    <button
                      onClick={handleBackToView}
                      disabled={loading}
                      className="w-full py-3 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      Back to View
                    </button>

                    <button
                      onClick={handleReset}
                      className="w-full py-3 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      Cancel Return
                    </button>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {step === 4 && (
                <div className="mt-4 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                  <div className="text-4xl text-green-500 mb-2">✓</div>
                  <h3 className="text-lg font-semibold text-green-700 mb-2">
                    Return Created Successfully!
                  </h3>
                  <p className="text-green-600 mb-4">
                    Return number: <strong>{returnNumber}</strong>
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Create Another Return
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnPage;
