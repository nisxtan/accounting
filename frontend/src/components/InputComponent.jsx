import { AiFillBook } from "react-icons/ai";

const InputComponent = ({
  icon: Icon = <AiFillBook />,
  label = "Invoice Number",
  required = false,
  type = "text",
  placeholder = "",
  value,
  onChange,
  name,
  max,
  disabled = false,
  className = "",
}) => {
  return (
    <div
      className={`flex-1 bg-white border border-gray-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">
            <Icon size={16} />
          </span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {required && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-medium">
              Required
            </span>
          )}
        </div>
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          max={max}
          className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>
    </div>
  );
};

export default InputComponent;
