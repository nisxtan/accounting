import React from "react";
import { AiFillBook } from "react-icons/ai";

const InputComponent = ({
  icon: Icon = AiFillBook,
  label = "Invoice Number",
  required = false,
  type = "text",
  placeholder = "",
  value,
  onChange,
  name,
  disabled = false,
  className = "",
}) => {
  return (
    // <div className="  flex-1  h-20  bg-amber-50 px-3  border border-black-100">
    //   {/* top row */}
    //   <div className="flex flex-col gap-2 items-start pt-1 ">
    //     <div className="flex gap-2 items-center ">
    //       <span>
    //         <AiFillBook />
    //       </span>
    //       <span>Invoice Number</span>
    //       <span className="bg-amber-600 text-white px-2 py-1 rounded-lg text-xs font-medium">
    //         Required
    //       </span>
    //     </div>
    //     {/* input box */}
    //     <div className="w-full">
    //       <input
    //         type="text"
    //         className="align-center w-full border border-amber-300 rounded px-2 py-1"
    //       />
    //     </div>
    //   </div>
    // </div>
    <div
      className={`flex-1 h-20 bg-amber-50 px-3 border border-black-100 ${className}`}
    >
      <div className="flex flex-col gap-2 items-start pt-1">
        <div className="flex gap-2 items-center">
          <span>
            <Icon />
          </span>
          <span>{label}</span>
          {required && (
            <span className="bg-amber-600 text-white px-2 py-1 rounded-lg text-xs font-medium">
              Required
            </span>
          )}
        </div>
        <div className="w-full">
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="align-center w-full border border-amber-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black-50"
          />
        </div>
      </div>
    </div>
  );
};

export default InputComponent;
