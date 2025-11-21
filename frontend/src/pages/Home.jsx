// import {
//   AiFillBook,
//   AiFillCalendar,
//   AiFillHome,
//   AiFillMoneyCollect,
//   AiOutlineBarChart,
//   AiOutlineMenu,
//   AiOutlineShoppingCart,
//   AiOutlineUser,
//   AiOutlineUserAdd,
// } from "react-icons/ai";
// import { useBill } from "../hooks/useBill";
// import Table from "../components/Table";
// import InputComponent from "../components/InputComponent";
// import InvoiceSummary from "../components/InvoiceSummary";
// const Home = () => {
//   const {
//     items,
//     products,
//     billData,
//     totals,
//     addEmptyRow,
//     removeRow,
//     updateItem,
//     updateBillData,
//     saveBill,
//   } = useBill();

//   const handleSave = async () => {
//     try {
//       const result = await saveBill();
//       alert("Bill saved successfully!");
//       console.log("Saved bill:", result);
//       window.location.reload();
//     } catch (error) {
//       alert("Failed to save bill: " + error.message);
//     }
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       <header className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200">
//         <div className="flex items-center gap-3">
//           <AiOutlineMenu className="text-2xl text-gray-700" />
//           <div className="text-2xl font-semibold text-gray-900">AQUIDEN</div>
//         </div>
//         <div className="flex text-xl gap-6 text-gray-600">
//           <AiFillHome />
//           <AiOutlineShoppingCart />
//           <AiOutlineBarChart />
//           <AiFillMoneyCollect />
//           <AiFillMoneyCollect />
//         </div>
//         <div className="flex text-sm items-center gap-2 text-gray-700">
//           <AiOutlineUserAdd className="text-lg" />
//           <span>SuperAdmin</span>
//         </div>
//       </header>

//       <div className="flex justify-between items-center px-6 py-6 gap-4">
//         <InputComponent
//           icon={AiFillBook}
//           label="Invoice Number"
//           required={false}
//           value={billData.invoiceNumber}
//           disabled={true}
//         />
//         <InputComponent
//           icon={AiFillCalendar}
//           label="Sales Date"
//           required={true}
//           type="date"
//           value={billData.salesDate}
//           onChange={(e) => updateBillData("salesDate", e.target.value)}
//         />
//         <InputComponent
//           icon={AiOutlineUser}
//           label="Customer"
//           required={true}
//           value={billData.customer}
//           onChange={(e) => updateBillData("customer", e.target.value)}
//         />
//       </div>

//       <Table
//         items={items}
//         totals={totals}
//         products={products}
//         onUpdateItem={updateItem}
//         onRemoveRow={removeRow}
//         onAddRow={addEmptyRow}
//       />

//       <InvoiceSummary
//         totals={totals}
//         billData={billData}
//         onUpdateBillData={updateBillData}
//       />

//       <div className="flex justify-end mt-6 mr-5 mb-6">
//         <button
//           onClick={handleSave}
//           className="bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
//         >
//           Save Bill
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Home;

import React from "react";
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

const Home = () => {
  const {
    items,
    products,
    billData,
    totals,
    loading, // ⭐ Get loading state
    addEmptyRow,
    removeRow,
    updateItem,
    updateBillData,
    saveBill,
  } = useBill();

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

      // Reload page for new invoice number
      window.location.reload();
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
        />
        <InputComponent
          icon={AiOutlineUser}
          label="Customer"
          required={true}
          value={billData.customer}
          onChange={(e) => updateBillData("customer", e.target.value)}
        />
      </div>

      <div>
        <Table
          items={items}
          totals={totals}
          products={products}
          onUpdateItem={updateItem}
          onRemoveRow={removeRow}
          onAddRow={addEmptyRow}
        />
      </div>

      <div>
        <InvoiceSummary
          totals={totals}
          billData={billData}
          onUpdateBillData={updateBillData}
        />
      </div>

      <div className="flex justify-end mt-4 mr-5">
        <button
          onClick={handleSave}
          disabled={loading} //
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Loading..." : "Save Bill"}
        </button>
      </div>
    </div>
  );
};

export default Home;
