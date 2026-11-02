import React, { useState } from "react";

import "./PasswordInput.css";

const PasswordInput = (props) => {
  const { handleChange, className, value, renderError } = props;

  const [showPassword, setShowPassword] = useState(false);

  false;
  return (
    <div className="password-input-wrapper">
      <label htmlFor="password" className="dark:text-gray-100">
        Password
      </label>
      <div className="password-input-container">
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          name="password"
          className={`${className} bg-gray-900/10 dark:bg-black border border-neutral-200 dark:border-black dark:text-neutral-100`}
          onChange={handleChange}
          value={value}
          required
        />
        <span
          role="button"
          tabIndex="0"
          aria-label={showPassword ? "hide password" : "show password"}
          onClick={() => setShowPassword((prev) => !prev)}
          className="password-toggle text-sky-900 dark:text-sky-400"
        >
          {showPassword ? "hide" : "show"}
        </span>
      </div>
      {renderError}
    </div>
  );
};

export default PasswordInput;
