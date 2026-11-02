import React from "react";
import { Link } from "react-router";
import { NavigateNext } from "@mui/icons-material";

const DashboardQuicklinksCard = (props) => {
  return (
    <section className={`${props.className} dashboard-card rounded-xl bg-gray-900/10/20 dark:bg-neutral-100/10 border  border-sky-200/50 dark:border-none  backdrop-blur shadow-md `}>
      <h2 className="text-xl md:text-2xl font-bold dark:text-gray-100">Quick Links</h2>
      <div className="dashboard__quicklinks">
        <Link to="/new-session" className=" dashboard__quicklink md:text-lg text-sky-900 dark:text-sky-400 ">
          <p>Ask a Question</p>
          <NavigateNext />
        </Link>
        <Link to="/new-note" className=" dashboard__quicklink md:text-lg text-sky-900 dark:text-sky-400 ">
          <p>Create a Note</p>
          <NavigateNext />
        </Link>
        <Link to="/new-quiz" className=" dashboard__quicklink md:text-lg text-sky-900 dark:text-sky-400 ">
          <p>Take a Quiz</p>
          <NavigateNext />
        </Link>
        <Link to="/new-deck" className=" dashboard__quicklink md:text-lg text-sky-900 dark:text-sky-400 ">
          <p>Create a deck of Flashcards</p>
          <NavigateNext />
        </Link>
      </div>
    </section>
  );
};

export default DashboardQuicklinksCard;
