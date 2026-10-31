import React, { lazy, Suspense } from "react";

import { Link, NavLink } from "react-router";
import { DashboardOutlined } from "@mui/icons-material";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";

import ErrorState from "../ErrorState/ErrorState";
import MenuListSkeleton from "../Skeleton/MenuListSkeleton";

import "./Menu.css";
import Button from "../Button/Button";

// Lazy loaded components
const MenuSessionsList = lazy(() => import("./MenuSessionsList"));

const Menu = (props) => {
  const { menuOpen, setMenuOpen, sessions, loading, error } = props;

  const onClick = () => {
    setMenuOpen(false);
  };
  return (
    <div
      className="menu bg-gray-100/90 md:bg-gray-200/90 dark:bg-neutral-900/90 border-r border-gray-400 dark:border-gray-700 backdrop-blur-md w-[85%] md:w-[20%]"
      data-menu-open={menuOpen}
    >
      <div className=" w-[90%] bg-white dark:bg-transparent flex border border-sky-900 dark:border-sky-400 rounded-xl !px-2 !mb-4">
        <button
          className="text-sky-900 dark:text-sky-400"
          id="search__button"
          aria-label="search button"
          aria-labelledby="search button"
        >
          <SearchOutlinedIcon fontSize="small" />
        </button>
        <input
          type="text"
          placeholder="Search"
          className="search__input w-full !p-2 text-neutral-900 dark:text-neutral-100"
        />
      </div>
      <div className="w-[90%]">
        <Button variant="orange" className="" onClick={onClick}>
          <Link to="/new-session" className="btn--link">
            New Session
          </Link>
        </Button>
      </div>
      <ul className="menu__list">
        <li className="menu__item">
          <NavLink
            className={({ isActive }) =>
              `menu__navlink ${
                isActive
                  ? "bg-gray-900/10 dark:bg-black rounded-xl w-full h-full"
                  : ""
              }`
            }
            to="/dashboard"
            onClick={onClick}
          >
            <div className="w-full flex items-center gap-2 text-sky-900 dark:text-sky-400">
              <DashboardOutlined fontSize="small" className="icon" />
              <span className="menu__list-name">Dashboard</span>
            </div>
          </NavLink>
        </li>
        <li className="menu__item">
          <NavLink
            className={({ isActive }) =>
              `menu__navlink ${
                isActive
                  ? "bg-gray-900/10 dark:bg-black rounded-xl w-full h-full"
                  : ""
              }`
            }
            to="/sessions"
            onClick={onClick}
          >
            <div className="w-full flex items-center gap-2 text-sky-900 dark:text-sky-400">
              <HistoryIcon fontSize="small" className="icon" />
              <span className="menu__list-name">Sessions</span>
            </div>
          </NavLink>
        </li>
        <li className="menu__item">
          <NavLink
            className={({ isActive }) =>
              `menu__navlink ${
                isActive
                  ? "bg-gray-900/10 dark:bg-black rounded-xl w-full h-full"
                  : ""
              }`
            }
            to="/notes"
            onClick={onClick}
          >
            <div className="w-full flex items-center gap-2 text-sky-900 dark:text-sky-400">
              <DescriptionOutlinedIcon fontSize="small" className="icon" />
              <span className="menu__list-name">Notes</span>
            </div>
          </NavLink>
        </li>
        <li className="menu__item">
          <NavLink
            className={({ isActive }) =>
              `menu__navlink ${
                isActive
                  ? "bg-gray-900/10 dark:bg-black rounded-xl w-full h-full"
                  : ""
              }`
            }
            to="/quizzes"
            onClick={onClick}
          >
            <div className="w-full flex items-center gap-2 text-sky-900 dark:text-sky-400">
              <QuizOutlinedIcon fontSize="small" className="icon" />
              <span className="menu__list-name">Quizzes</span>
            </div>
          </NavLink>
        </li>
        <li className="menu__item">
          <NavLink
            className={({ isActive }) =>
              `menu__navlink ${
                isActive
                  ? "bg-gray-900/10 dark:bg-black rounded-xl w-full h-full"
                  : ""
              }`
            }
            to="/decks"
            onClick={onClick}
          >
            <div className="w-full flex items-center gap-2 text-sky-900 dark:text-sky-400">
              <StyleOutlinedIcon className="icon" />
              <span className="menu__list-name">Flashcards</span>
            </div>
          </NavLink>
        </li>
      </ul>
      {sessions.length > 0 && (
        <>
          <h3 className=" text-sm self-start !mt-4 !ml-4 text-sky-900 dark:text-sky-400 font-bold">
            SESSION HISTORY
          </h3>
          <Suspense fallback={<MenuListSkeleton />}>
            {loading ? (
              <MenuListSkeleton />
            ) : error ? (
              <ErrorState error={error} />
            ) : (
              <MenuSessionsList
                sessions={sessions}
                loading={loading}
                error={error}
                onClick={onClick}
              />
            )}
          </Suspense>
        </>
      )}
    </div>
  );
};

export default Menu;
