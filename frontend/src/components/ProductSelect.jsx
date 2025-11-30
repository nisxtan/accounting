// ProductSelect.jsx
import React from "react";
import Select from "react-select";

const ProductSelect = ({ products, value, onChange }) => {
  const options = products.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  const selectedOption =
    options.find((opt) => opt.value === String(value)) || null;

  return (
    <Select
      value={selectedOption}
      onChange={(option) => onChange(option ? option.value : "")}
      options={options}
      isSearchable
      isClearable
      placeholder="Select Product"
      className="w-full"
      menuPortalTarget={document.body}
      menuPlacement="auto"
      styles={{
        menuPortal: (base) => ({
          ...base,
          zIndex: 99999,
        }),

        menu: (base) => ({
          ...base,
          zIndex: 99999,
        }),

        control: (base) => ({
          ...base,
          minHeight: "38px",
          borderColor: "#cbd5e1",
          boxShadow: "none",
          "&:hover": { borderColor: "#94a3b8" },
        }),
      }}
    />
  );
};

export default ProductSelect;
