import React, { useState } from "react";
import productService from "../api/productService";
import {
  AiOutlineClose,
  AiOutlineCheck,
  AiOutlineDollar,
} from "react-icons/ai";
import { FiPackage, FiLayers } from "react-icons/fi";

const AddProductModal = ({ isOpen, onClose, onProductAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    baseRate: "",
    isTaxable: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const productData = {
        name: formData.name.trim(),
        quantity: parseInt(formData.quantity) || 0,
        baseRate: parseFloat(formData.baseRate) || 0,
        isTaxable: formData.isTaxable,
      };

      const newProduct = await productService.create(productData);

      // Show success animation
      setSuccess(true);

      setTimeout(() => {
        onProductAdded(newProduct);

        // Reset form
        setFormData({
          name: "",
          quantity: "",
          baseRate: "",
          isTaxable: true,
        });
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all duration-300 animate-slideUp"
        style={{
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-green-600 to-blue-500 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <FiPackage className="text-2xl text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Add New Product</h2>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <AiOutlineClose className="text-xl" />
            </button>
          </div>

          {/* Decorative wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 40" className="w-full">
              <path
                fill="#ffffff"
                d="M0,20 C320,40 420,0 740,20 C1060,40 1160,0 1440,20 L1440,40 L0,40 Z"
              />
            </svg>
          </div>
        </div>

        {/* Success overlay */}
        {success && (
          <div className="absolute inset-0 bg-green-500/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 animate-fadeIn">
            <div className="text-center">
              <div className="bg-white rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4 animate-bounce">
                <AiOutlineCheck className="text-4xl text-green-500" />
              </div>
              <p className="text-white text-xl font-semibold">Product Added!</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product Name */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiPackage className="text-green-600" />
              Product Name
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 group-hover:border-gray-300"
              placeholder="Enter product name"
            />
          </div>

          {/* Quantity and Base Rate in Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiLayers className="text-green-600" />
                Quantity
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 group-hover:border-gray-300"
                placeholder="0"
              />
            </div>

            {/* Base Rate */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <AiOutlineDollar className="text-green-600" />
                Rate (Rs)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="baseRate"
                value={formData.baseRate}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 group-hover:border-gray-300"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Taxable Toggle */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-100">
            <label className="flex items-center cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="isTaxable"
                  checked={formData.isTaxable}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-cyan-500 transition-all duration-300 shadow-inner"></div>
                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-7 shadow-md"></div>
              </div>
              <span className="ml-4 text-sm font-semibold text-gray-700">
                Taxable Product
                {formData.isTaxable && (
                  <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    VAT Applied
                  </span>
                )}
              </span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-lg">⚠️</span>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 text-gray-700 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <AiOutlineCheck className="text-lg" />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AddProductModal;
