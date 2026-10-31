import React from "react";

import './TextInput.css';

const TextInput = (props) => {
  const { label, type, id, name, handleChange, className, renderError , value} = props;
  return (
    <div className="text-input-wrapper ">
      <label htmlFor="email" className="dark:text-gray-100">{label}</label>
      <input
        type={type}
        id={id}
        name={name}
        className={`${className} bg-gray-900/10 dark:bg-black border border-neutral-200 dark:border-black dark:text-neutral-100`}
        onChange={handleChange}
        value={value}
        required
      />
      <ul className="error-list">
        {renderError}
      </ul>
    </div>
  );
};

export default TextInput;
