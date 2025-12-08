import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  AiFillBook,
  AiFillCalendar,
  AiFillHome,
  AiFillMoneyCollect,
  AiOutlineBarChart,
  AiOutlineMenu,
  AiOutlineShoppingCart,
  AiOutlineUser,
  AiOutlineUserAdd,
  AiOutlineLogout,
  AiOutlineSearch,
  AiOutlinePlus,
} from "react-icons/ai";
import InputComponent from "../components/InputComponent";
import InvoiceSummary from "../components/InvoiceSummary";
import Table from "../components/Table";
import { useBill } from "../hooks/useBill";
import { useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import AddProductModal from "../components/AddProductModal";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import customerService from "../api/customerService";

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    items,
    products,
    billData,
    totals,
    loading,
    addEmptyRow,
    removeRow,
    updateItem,
    updateBillData,
    saveBill,
    loadProducts,
  } = useBill();

  const [productModal, setProductModal] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const handleProductAdded = async (newProduct) => {
    await loadProducts();
    console.log("products reloaded");
  };

  const handleAddProductClick = () => {
    setProductModal(true);
  };

  const handleAddCustomerClick = () => {
    setCustomerModal(true);
  };

  // Logout function using Redux
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Load customers from API
  const loadCustomers = async (search = "") => {
    try {
      setIsLoadingCustomers(true);
      const response = await customerService.getAllCustomers({
        search: search,
        page: 1,
        limit: 20,
      });

      // Transform API response to react-select options format
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

  // Handle customer search input change
  const handleCustomerSearch = (inputValue) => {
    setSearchInput(inputValue);
    if (inputValue.trim().length > 1) {
      loadCustomers(inputValue);
    } else if (inputValue.trim().length === 0) {
      loadCustomers("");
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (selectedOption) => {
    if (selectedOption) {
      updateBillData("customer", selectedOption.customerData.fullName);
      updateBillData("customerId", selectedOption.value);
    } else {
      updateBillData("customer", "");
      updateBillData("customerId", null);
    }
  };

  // Handle new customer form input change
  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle save new customer
  const handleSaveNewCustomer = async () => {
    if (!newCustomer.fullName.trim()) {
      alert("Customer name is required!");
      return;
    }

    try {
      setIsCreatingCustomer(true);
      const response = await customerService.createCustomer({
        ...newCustomer,
        status: true,
      });

      //  Access the nested customer object
      const customerData = response.customer || response;

      // Create new option for select
      const newOption = {
        value: customerData.id,
        label: `${customerData.fullName}${
          customerData.phone ? ` (${customerData.phone})` : ""
        }${customerData.email ? ` - ${customerData.email}` : ""}`,
        customerData: customerData,
      };

      // Update customer options
      setCustomerOptions((prev) => [newOption, ...prev]);

      // Set the selected customer
      updateBillData("customer", customerData.fullName);
      updateBillData("customerId", customerData.id);

      // Reset form and close modal
      setNewCustomer({
        fullName: "",
        email: "",
        phone: "",
        address: "",
      });
      setCustomerModal(false);

      alert("Customer added successfully!");
    } catch (error) {
      console.error("Failed to create customer:", error);
      alert(error.error || "Failed to create customer. Please try again.");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Quick create customer from input
  const handleCreateNewCustomer = async (inputValue) => {
    try {
      const newCustomerData = {
        fullName: inputValue.trim(),
        phone: "",
        email: "",
        address: "",
        status: true,
      };

      const response = await customerService.createCustomer(newCustomerData);

      const newOption = {
        value: response.id,
        label: `${response.fullName}${
          response.phone ? ` (${response.phone})` : ""
        }${response.email ? ` - ${response.email}` : ""}`,
        customerData: response,
      };

      setCustomerOptions((prev) => [newOption, ...prev]);
      updateBillData("customer", response.fullName);
      updateBillData("customerId", response.id);

      return newOption;
    } catch (error) {
      console.error("Failed to create customer:", error);
      alert("Failed to create new customer. Please try again.");
      return null;
    }
  };

  const printBill = (billData, items, totals) => {
    const printWindow = window.open("", "_blank");

    const printContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${billData.invoiceNumber}</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="p-8 bg-white">
      <div class="max-w-4xl mx-auto">
        <div class="border-b-2 border-blue-500 pb-6 mb-6">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-3xl font-bold text-slate-800">INVOICE</h1>
              <p class="text-lg text-slate-600">${billData.invoiceNumber}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-slate-500">Date: ${billData.salesDate}</p>
              <p class="text-sm text-slate-500">Printed: ${new Date().toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}</p>
            </div>
          </div>
        </div>

        <div class="mb-8">
          <h2 class="text-lg font-semibold text-slate-700 mb-2">Bill To:</h2>
          <p class="text-slate-800 font-medium">${billData.customer}</p>
        </div>

        <div class="mb-8">
          <h2 class="text-lg font-semibold text-slate-700 mb-4">Items</h2>
          <table class="w-full border-collapse border border-slate-300">
            <thead>
              <tr class="bg-slate-100">
                <th class="border border-slate-300 p-3 text-left">Product</th>
                <th class="border border-slate-300 p-3 text-left">Qty</th>
                <th class="border border-slate-300 p-3 text-left">Unit</th>
                <th class="border border-slate-300 p-3 text-left">Rate</th>
                <th class="border border-slate-300 p-3 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .filter((item) => item.productId && item.rate > 0)
                .map((item) => {
                  const calculatedItem = totals.calculatedItems?.find(
                    (calcItem) => calcItem.id === item.id
                  );
                  const product = products.find((p) => p.id == item.productId);
                  return `
                  <tr>
                    <td class="border border-slate-300 p-3">${
                      product?.name || "N/A"
                    }</td>
                    <td class="border border-slate-300 p-3">${
                      item.quantity
                    }</td>
                    <td class="border border-slate-300 p-3">${item.unit}</td>
                    <td class="border border-slate-300 p-3">${item.rate}</td>
                    <td class="border border-slate-300 p-3">${
                      calculatedItem?.finalTotal || 0
                    }</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="border-t border-slate-300 pt-6">
          <div class="max-w-xs ml-auto">
            <div class="flex justify-between mb-2">
              <span class="text-slate-600">Subtotal:</span>
              <span class="font-medium">${totals.subTotal}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-slate-600">Discount (${
                billData.discountPercent
              }%):</span>
              <span class="font-medium">${totals.discountAmount}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-slate-600">Taxable Amount:</span>
              <span class="font-medium">${totals.taxableTotal}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-slate-600">Non-Taxable Amount:</span>
              <span class="font-medium">${totals.nonTaxableTotal}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-slate-600">VAT (${billData.vatPercent}%):</span>
              <span class="font-medium">${totals.vatAmount}</span>
            </div>
            <div class="flex justify-between border-t border-slate-300 pt-2 mt-2">
              <span class="text-lg font-semibold text-slate-800">Grand Total:</span>
              <span class="text-lg font-bold text-blue-600">${
                totals.grandTotal
              }</span>
            </div>
          </div>
        </div>

        <div class="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-400">
          Thank you for your business!
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const downloadExcel = (billData, items, totals, products) => {
    const wb = XLSX.utils.book_new();
    const invoiceData = [];

    invoiceData.push(["AQUIDEN INVOICE", "", "", "", "", ""]);
    invoiceData.push(["", "", "", "", "", ""]);

    invoiceData.push([
      "Invoice Number:",
      billData.invoiceNumber,
      "",
      "Date:",
      billData.salesDate,
      "",
    ]);

    invoiceData.push([
      "Customer:",
      billData.customer,
      "",
      "Printed:",
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      "",
    ]);

    invoiceData.push([""]);

    invoiceData.push([
      "S.N.",
      "Product",
      "Quantity",
      "Unit",
      "Rate (Rs.)",
      "Discount %",
      "Taxable",
      "Item Total (Rs.)",
    ]);

    let serial = 1;
    items
      .filter((item) => item.productId && item.rate > 0)
      .forEach((item) => {
        const product = products.find((p) => p.id == item.productId);
        const calculatedItem = totals.calculatedItems?.find(
          (calcItem) => calcItem.id === item.id
        );

        invoiceData.push([
          serial++,
          product?.name || "N/A",
          item.quantity,
          item.unit,
          item.rate,
          `${item.discountPercent}%`,
          item.isTaxable ? "Yes" : "No",
          calculatedItem?.finalTotal || 0,
        ]);
      });

    invoiceData.push([""]);

    invoiceData.push(["BILL SUMMARY", "", "", "", "", "", "", ""]);
    invoiceData.push(["Subtotal:", "", "", "", "", "", "", totals.subTotal]);

    invoiceData.push([
      `Discount (${billData.discountPercent}%):`,
      "",
      "",
      "",
      "",
      "",
      "",
      totals.discountAmount,
    ]);

    invoiceData.push([
      "Taxable Amount:",
      "",
      "",
      "",
      "",
      "",
      "",
      totals.taxableTotal,
    ]);

    invoiceData.push([
      "Non-Taxable Amount:",
      "",
      "",
      "",
      "",
      "",
      "",
      totals.nonTaxableTotal,
    ]);

    invoiceData.push([
      `VAT (${billData.vatPercent}%):`,
      "",
      "",
      "",
      "",
      "",
      "",
      totals.vatAmount,
    ]);

    invoiceData.push([""]);

    invoiceData.push([
      "GRAND TOTAL:",
      "",
      "",
      "",
      "",
      "",
      "",
      totals.grandTotal,
    ]);

    invoiceData.push([""]);
    invoiceData.push(["Thank you for your business!"]);

    const ws = XLSX.utils.aoa_to_sheet(invoiceData);

    const colWidths = [
      { wch: 6 },
      { wch: 25 },
      { wch: 10 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
    ];

    ws["!cols"] = colWidths;

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } },
      { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } },
      {
        s: { r: invoiceData.length - 2, c: 0 },
        e: { r: invoiceData.length - 2, c: 7 },
      },
    ];

    XLSX.utils.book_append_sheet(wb, ws, `Invoice_${billData.invoiceNumber}`);

    const fileName = `Invoice_${billData.invoiceNumber}_${billData.customer}_${billData.salesDate}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);

    return fileName;
  };

  const handleSave = async () => {
    if (!billData.customer || billData.customer.trim() === "") {
      alert("Customer name is required!");
      return;
    }

    const hasValidItems = items.some((item) => item.productId && item.rate > 0);
    if (!hasValidItems) {
      alert("Please add at least one product to the bill!");
      return;
    }

    try {
      const result = await saveBill();
      alert("Bill saved successfully!");
      console.log("Saved bill:", result);
      printBill(billData, items, totals);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      alert("Failed to save bill: " + error.message);
    }
  };

  const handleDownloadExcel = async () => {
    if (!billData.customer || billData.customer.trim() === "") {
      alert("Customer name is required!");
      return;
    }

    const hasValidItems = items.some((item) => item.productId && item.rate > 0);
    if (!hasValidItems) {
      alert("Please add at least one product to the bill!");
      return;
    }

    try {
      const result = await saveBill();
      alert("Bill saved successfully!");
      console.log("Saved bill:", result);
      downloadExcel(billData, items, totals, products);
      printBill(billData, items, totals);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      alert("Failed to save bill: " + error.message);
    }
  };

  // Find current selected customer option
  const currentCustomerOption =
    customerOptions.find((option) => option.value === billData.customerId) ||
    (billData.customer
      ? {
          value: null,
          label: billData.customer,
          customerData: { fullName: billData.customer },
        }
      : null);

  return (
    <div className="bg-slate-300 min-h-screen">
      <header className="flex justify-between items-start px-6 py-3 gap-3">
        <div className="flex items-center gap-3">
          <AiOutlineMenu className="text-2xl mt-1." />
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
        <div className="flex text-xl items-center gap-3 ">
          <div>
            <AiOutlineUserAdd />
          </div>
          <div>SuperAdmin </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Logout"
          >
            <AiOutlineLogout />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex justify-evenly items-center px-6 py-6 gap-3">
        <InputComponent
          icon={AiFillBook}
          label="Invoice Number"
          required={false}
          value={loading ? "Loading..." : billData.invoiceNumber}
          disabled={true}
        />
        <InputComponent
          icon={AiFillCalendar}
          label="Sales Date"
          required={true}
          type="date"
          value={billData.salesDate}
          onChange={(e) => updateBillData("salesDate", e.target.value)}
          max={new Date().toISOString().split("T")[0]}
        />

        {/* Customer Dropdown with Search and Add Button */}
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Customer <span className="text-red-500">*</span>
            </label>
            <button
              onClick={handleAddCustomerClick}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <AiOutlinePlus className="text-xs" />
              <span>Add Customer</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Select
                value={currentCustomerOption}
                onChange={handleCustomerSelect}
                onInputChange={handleCustomerSearch}
                options={customerOptions}
                isLoading={isLoadingCustomers}
                isClearable
                isSearchable
                placeholder="Search or select customer..."
                noOptionsMessage={() => "Type to search customers..."}
                formatCreateLabel={(inputValue) =>
                  `Create new: "${inputValue}"`
                }
                onCreateOption={handleCreateNewCustomer}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#d1d5db",
                    borderRadius: "0.375rem",
                    padding: "0.125rem",
                    minHeight: "42px",
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 50,
                  }),
                }}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <AiOutlineUser />
              </div>
            </div>
          </div>
          {billData.customerId && (
            <p className="text-xs text-gray-500 mt-1">
              Customer ID: {billData.customerId}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-0 justify-end">
        <div className="px-4">
          <button
            onClick={handleAddProductClick}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 mb-4"
          >
            + Add New Product
          </button>
        </div>

        <div className="px-4">
          <a
            href="/list"
            target="_self"
            rel="noopener noreferrer"
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 mb-4 inline-block rounded"
          >
            View Bills list
          </a>
        </div>
      </div>

      <div>
        <Table
          items={items}
          totals={totals}
          products={products}
          onUpdateItem={updateItem}
          onRemoveRow={removeRow}
          onAddRow={addEmptyRow}
          onAddProduct={handleAddProductClick}
        />
      </div>

      <div>
        <InvoiceSummary
          totals={totals}
          billData={billData}
          onUpdateBillData={updateBillData}
        />
      </div>

      <div className="flex justify-end ">
        <div className="flex justify-end mt-4 mr-5">
          <button
            onClick={handleDownloadExcel}
            disabled={loading}
            className="bg-cyan-800 text-white px-8 py-3 mb-3 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading || !products || products.length === 0
              ? "Loading..."
              : "Download Excel"}
          </button>
        </div>
        <div className="flex justify-end mt-4 mr-5">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-cyan-800 text-white px-8 py-3 mb-3 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Save Bill"}
          </button>
        </div>
      </div>

      {/* Customer Modal - Moved to bottom */}
      {customerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Add New Customer
              </h2>
              <button
                onClick={() => setCustomerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={newCustomer.fullName}
                  onChange={handleNewCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={newCustomer.phone}
                  onChange={handleNewCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={newCustomer.email}
                  onChange={handleNewCustomerChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={newCustomer.address}
                  onChange={handleNewCustomerChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setCustomerModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isCreatingCustomer}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewCustomer}
                disabled={isCreatingCustomer || !newCustomer.fullName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isCreatingCustomer ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddProductModal
        isOpen={productModal}
        onClose={() => setProductModal(false)}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
};

export default Home;
