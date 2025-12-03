import React from "react";
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
} from "react-icons/ai";
import InputComponent from "../components/InputComponent";
import InvoiceSummary from "../components/InvoiceSummary";
import Table from "../components/Table";
import { useBill } from "../hooks/useBill";
import { useState } from "react";
import AddProductModal from "../components/AddProductModal";
import { Link, Navigate, useNavigate } from "react-router-dom";
// import useNavigate from "react-router-dom";
const Home = () => {
  const navigate = useNavigate();
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
  const handleProductAdded = async (newProduct) => {
    await loadProducts();
    console.log("products reloaded");
  };

  const handleAddProductClick = () => {
    setProductModal(true);
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
        <!-- Header -->
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

        <!-- Customer Info -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-slate-700 mb-2">Bill To:</h2>
          <p class="text-slate-800 font-medium">${billData.customer}</p>
        </div>

        <!-- Items Table -->
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

        <!-- Summary -->
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

        <!-- Footer -->
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
    console.log("🔍 DEBUG - downloadExcel called with:", {
      billData: billData?.invoiceNumber,
      itemsCount: items?.length,
      productsCount: products?.length,
      products: products,
    });
    // Create workbook
    const wb = XLSX.utils.book_new();

    // ========== INVOICE SHEET ==========
    const invoiceData = [];

    // Header Section
    invoiceData.push(["AQUIDEN INVOICE", "", "", "", "", ""]);
    invoiceData.push(["", "", "", "", "", ""]);

    // Invoice Info
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

    invoiceData.push([""]); // Empty row

    // Items Table Header
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

    // Items Data
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

    invoiceData.push([""]); // Empty row

    // Summary Section
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

    invoiceData.push([""]); // Empty row

    // Grand Total
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

    invoiceData.push([""]); // Empty row
    invoiceData.push(["Thank you for your business!"]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(invoiceData);

    // ========== FORMATTING ==========
    // Column widths (adjust based on content)
    const colWidths = [
      { wch: 6 }, // S.N.
      { wch: 25 }, // Product
      { wch: 10 }, // Quantity
      { wch: 8 }, // Unit
      { wch: 12 }, // Rate
      { wch: 12 }, // Discount %
      { wch: 10 }, // Taxable
      { wch: 15 }, // Item Total
    ];

    ws["!cols"] = colWidths;

    // Merge cells for header
    ws["!merges"] = [
      // Merge header row
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      // Merge customer row
      { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } },
      { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } },
      // Merge thank you message
      {
        s: { r: invoiceData.length - 2, c: 0 },
        e: { r: invoiceData.length - 2, c: 7 },
      },
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `Invoice_${billData.invoiceNumber}`);

    // ========== EXPORT ==========
    const fileName = `Invoice_${billData.invoiceNumber}_${billData.customer}_${billData.salesDate}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);

    return fileName;
  };

  const handleSave = async () => {
    // Validation
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
      //print the bill
      printBill(billData, items, totals);
      // Reload page for new invoice number
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      alert("Failed to save bill: " + error.message);
    }
  };

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
        </div>
      </header>

      <div className="flex justify-evenly items-center px-6 py-6 gap-3">
        <InputComponent
          icon={AiFillBook}
          label="Invoice Number"
          required={false}
          value={loading ? "Loading..." : billData.invoiceNumber} // ⭐ Show loading
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
        <InputComponent
          icon={AiOutlineUser}
          label="Customer"
          required={true}
          value={billData.customer}
          onChange={(e) => updateBillData("customer", e.target.value)}
        />
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
        {" "}
        <div className="flex justify-end mt-4 mr-5">
          <button
            onClick={async () => {
              await handleSave();
              downloadExcel(billData, items, totals, products);
            }}
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
            disabled={loading} //
            className="bg-cyan-800 text-white px-8 py-3 mb-3 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Save Bill"}
          </button>
        </div>
      </div>

      <AddProductModal
        isOpen={productModal}
        onClose={() => setProductModal(false)}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
};

export default Home;
