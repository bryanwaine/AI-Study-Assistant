import React from "react";

import { NavLink } from "react-router";

import sortSessionsByTime from "../../utils/sortSessionsByTime";

const MenuSessionsList = ({
  sessions,
  loading,
  error,
  onClick,
}) => {
  return (
    <ul className="menu__list">
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {sortSessionsByTime(sessions).map((session) => (
        <li className="menu__item" key={session.id}>
          <NavLink
            className={({ isActive }) =>
              `menu__navlink ${
                isActive
                  ? "bg-gray-900/10 dark:bg-black rounded-xl w-full h-full"
                  : ""
              }`
            }
           
            onClick={onClick}
            to={`/sessions/${session.id}`}
          >
            <div className="menu__list-item">
              <span className=" w-full text-sm text-sky-900 dark:text-sky-400 truncate overflow-hidden whitespace-nowrap">
                {session.metadata.title}
              </span>
            </div>
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export default MenuSessionsList;
