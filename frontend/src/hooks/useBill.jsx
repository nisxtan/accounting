// import { useState, useEffect } from "react";
// import { productService } from "../services/productApi";
// import billService from "../api/billServices";

// export const useBill = () => {
//   // Generate invoice number
//   const generateInvoiceNumber = () => {
//     const timestamp = Date.now();
//     return `INV-${timestamp}`;
//   };

//   const [items, setItems] = useState([
//     {
//       id: Date.now() + Math.random(),
//       productId: "",
//       quantity: 1,
//       unit: "pcs",
//       rate: 0,
//       discountPercent: 0,
//       isTaxable: true,
//     },
//   ]);

//   const [products, setProducts] = useState([]);
//   const [billData, setBillData] = useState({
//     salesDate: new Date().toISOString().split("T")[0],
//     customer: "",
//     discountPercent: 0,
//     vatPercent: 13,
//     invoiceNumber: generateInvoiceNumber(),
//   });

//   useEffect(() => {
//     loadProducts();
//   }, []);

//   const loadProducts = async () => {
//     try {
//       const productsData = await productService.getAll();
//       setProducts(productsData);
//     } catch (error) {
//       console.error("Failed to load products:", error);
//     }
//   };

//   const addEmptyRow = () => {
//     const newItem = {
//       id: Date.now() + Math.random(),
//       productId: "",
//       quantity: 1,
//       unit: "pcs",
//       rate: 0,
//       discountPercent: 0,
//       isTaxable: true,
//     };
//     setItems((prev) => [...prev, newItem]);
//   };

//   const removeRow = (id) => {
//     setItems((prev) => prev.filter((item) => item.id !== id));
//   };

//   const updateItem = (id, field, value) => {
//     setItems((prev) =>
//       prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
//     );
//   };

//   const updateBillData = (field, value) => {
//     setBillData((prev) => ({ ...prev, [field]: value }));
//   };

//   // ✅ SIMPLE CALCULATIONS: qty × rate
//   const calculateBillTotals = () => {
//     let subTotal = 0;

//     const calculatedItems = items.map((item) => {
//       // ✅ SIMPLE: quantity × rate (no unit conversion in calculations)
//       const initialTotal = item.quantity * item.rate;
//       const discountAmount = initialTotal * (item.discountPercent / 100);
//       const finalTotal = initialTotal - discountAmount;

//       subTotal += finalTotal;

//       return {
//         ...item,
//         initialTotal,
//         discountAmount,
//         finalTotal,
//       };
//     });

//     // Bill-level discount
//     calculatedItems.forEach((item) => {
//       const billDiscountAmount =
//         item.finalTotal * (billData.discountPercent / 100);
//       const afterBillDiscount = item.finalTotal - billDiscountAmount;
//       item.billDiscountAmount = billDiscountAmount;
//       item.afterBillDiscount = afterBillDiscount;
//     });

//     // VAT calculation
//     calculatedItems.forEach((item) => {
//       if (item.isTaxable) {
//         item.vatAmount = item.afterBillDiscount * (billData.vatPercent / 100);
//         item.afterVat = item.afterBillDiscount + item.vatAmount;
//       } else {
//         item.vatAmount = 0;
//         item.afterVat = item.afterBillDiscount;
//       }
//     });

//     // Aggregate totals
//     const discountAmount = calculatedItems.reduce(
//       (sum, i) => sum + i.billDiscountAmount,
//       0
//     );
//     const taxableTotal = calculatedItems
//       .filter((i) => i.isTaxable)
//       .reduce((sum, i) => sum + i.afterBillDiscount, 0);
//     const nonTaxableTotal = calculatedItems
//       .filter((i) => !i.isTaxable)
//       .reduce((sum, i) => sum + i.afterBillDiscount, 0);
//     const vatAmount = calculatedItems.reduce((sum, i) => sum + i.vatAmount, 0);
//     const grandTotal = calculatedItems.reduce((sum, i) => sum + i.afterVat, 0);

//     return {
//       subTotal,
//       discountAmount,
//       taxableTotal,
//       nonTaxableTotal,
//       vatAmount,
//       grandTotal,
//       calculatedItems,
//     };
//   };

//   const saveBill = async () => {
//     try {
//       const billPayload = {
//         ...billData,
//         items: items.filter((item) => item.productId && item.rate > 0),
//       };
//       const savedBill = await billService.create(billPayload);
//       return savedBill;
//     } catch (error) {
//       console.error("Failed to save bill:", error);
//       throw error;
//     }
//   };

//   const totals = calculateBillTotals();

//   return {
//     items,
//     products,
//     billData,
//     totals,
//     addEmptyRow,
//     removeRow,
//     updateItem,
//     updateBillData,
//     saveBill,
//   };
// };

import { useState, useEffect } from "react";
import { productService } from "../services/productApi";
import billService from "../api/billServices";
import { useCallback } from "react";
// import { generateInvoiceNumber } from "../../../backend/src/services/bill.service";

export const useBill = () => {
  const [items, setItems] = useState([
    {
      id: Date.now() + Math.random(),
      productId: "",
      quantity: 1,
      unit: "pcs",
      rate: 0,
      discountPercent: 0,
      isTaxable: true,
    },
  ]);

  const [products, setProducts] = useState([]);
  const [billData, setBillData] = useState({
    salesDate: new Date().toISOString().split("T")[0],
    customer: "",
    discountPercent: 0,
    vatPercent: 13,
    invoiceNumber: "", //comes from backend
  });

  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const productsData = await productService.getAll();
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  }, []);

  //Get invoice number from backend API
  const getInvoiceNumberFromBackend = useCallback(async () => {
    try {
      const response = await billService.getNewInvoiceNumber();
      console.log("Invoice number received:", response.data.invoiceNumber);

      setBillData((prev) => ({
        ...prev,
        invoiceNumber: response.data.invoiceNumber,
      }));
    } catch (error) {
      console.error("Failed to get invoice number:", error);
      // Fallback
      setBillData((prev) => ({
        ...prev,
        invoiceNumber: `INV-${Date.now()}`,
      }));
    }
  }, []);

  // Load invoice number on page load
  useEffect(() => {
    let mounted = true;
    const initializeBill = async () => {
      try {
        await loadProducts();
        if (!mounted) return;
        await getInvoiceNumberFromBackend();
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initializeBill();
    return () => {
      mounted = false;
    };
  }, [loadProducts, getInvoiceNumberFromBackend]);

  //listen for cross-tab invoice updates
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key == "invoice-updated") {
        getInvoiceNumberFromBackend().catch((err) => {
          console.error(
            "Failed to refresh invoice number after storage event",
            err
          );
        });
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [getInvoiceNumberFromBackend]);
  const addEmptyRow = () => {
    const newItem = {
      id: Date.now() + Math.random(),
      productId: "",
      quantity: 1,
      unit: "pcs",
      rate: 0,
      discountPercent: 0,
      isTaxable: true,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeRow = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const updateBillData = (field, value) => {
    setBillData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateBillTotals = () => {
    let subTotal = 0;

    const calculatedItems = items.map((item) => {
      const initialTotal = item.quantity * item.rate;
      const discountAmount = initialTotal * (item.discountPercent / 100);
      const finalTotal = initialTotal - discountAmount;

      subTotal += finalTotal;

      return {
        ...item,
        initialTotal,
        discountAmount,
        finalTotal,
      };
    });

    calculatedItems.forEach((item) => {
      const billDiscountAmount =
        item.finalTotal * (billData.discountPercent / 100);
      const afterBillDiscount = item.finalTotal - billDiscountAmount;
      item.billDiscountAmount = billDiscountAmount;
      item.afterBillDiscount = afterBillDiscount;
    });

    calculatedItems.forEach((item) => {
      if (item.isTaxable) {
        item.vatAmount = item.afterBillDiscount * (billData.vatPercent / 100);
        item.afterVat = item.afterBillDiscount + item.vatAmount;
      } else {
        item.vatAmount = 0;
        item.afterVat = item.afterBillDiscount;
      }
    });

    const discountAmount = calculatedItems.reduce(
      (sum, i) => sum + i.billDiscountAmount,
      0
    );
    const taxableTotal = calculatedItems
      .filter((i) => i.isTaxable)
      .reduce((sum, i) => sum + i.afterBillDiscount, 0);
    const nonTaxableTotal = calculatedItems
      .filter((i) => !i.isTaxable)
      .reduce((sum, i) => sum + i.afterBillDiscount, 0);
    const vatAmount = calculatedItems.reduce((sum, i) => sum + i.vatAmount, 0);
    const grandTotal = calculatedItems.reduce((sum, i) => sum + i.afterVat, 0);

    return {
      subTotal,
      discountAmount,
      taxableTotal,
      nonTaxableTotal,
      vatAmount,
      grandTotal,
      calculatedItems,
    };
  };

  const saveBill = async () => {
    try {
      const billPayload = {
        ...billData, // Includes backend-generated invoice number
        items: items.filter((item) => item.productId && item.rate > 0),
      };

      const savedBill = await billService.create(billPayload);
      
      try {
        localStorage.setItem("invoice-updated", Date.now().toString());
      } catch (e) {
        console.warn("could not write to localStorage ", e);
      }
      await getInvoiceNumberFromBackend();
      return savedBill;
    } catch (error) {
      console.error("Failed to save bill:", error);
      throw error;
    }
  };

  const totals = calculateBillTotals();

  return {
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
    getInvoiceNumberFromBackend,
  };
};
