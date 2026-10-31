import React, { useEffect, useState, lazy, Suspense } from "react";

import { useLocation, Navigate, Link } from "react-router";

import DashboardOverviewSkeleton from "../../components/Skeleton/DashboardOverviewSkeleton";
import DashboardQuicklinksCard from "./DashboardQuicklinksCard";

import Button from "../../components/Button/Button";
import Layout from "../../components/Layout";
import ErrorState from "../../components/ErrorState/ErrorState";
import useAuth from "../../hooks/useAuth";
import useStaggeredAnimation from "../../hooks/useStaggeredAnimation";
import { getAllSessions } from "../../utils/sessionService";
import handleAnthropicError from "../../utils/anthropicErrorHandler";
import { getAllDecks } from "../../utils/flashcardService";
import { getAllNotes } from "../../utils/noteService";
import handleGreeting from "../../utils/greetingHandler";
import firstNameFilter from "../../utils/firstNameFilter";

import "./Dashboard.css";
import BubbleBackground from "../../components/BubbleBg";

// Lazy loaded components
const DashboardOverviewCard = lazy(() => import("./DashboardOverviewCard"));

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const location = useLocation();
  const userName = user?.displayName || location.state?.userName;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [notes, sessions, flashcards] = await Promise.all([
          getAllNotes(user.uid),
          getAllSessions(user.uid),
          getAllDecks(user.uid),
        ]);
        setNotes(notes);
        setSessions(sessions);
        setFlashcards(flashcards);
      } catch (error) {
        setError(handleAnthropicError(error).message);
      } finally {
        setLoading(false);
      }
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(fetchData);
    } else {
      setTimeout(fetchData, 100);
    }
  }, [user]);

  useStaggeredAnimation({
    selector: ".animate-fade",
    animationClass: "fade-in",
    threshold: 0.2,
    staggerDelay: 50,
  });

  useStaggeredAnimation({
    selector: ".animate-slide",
    animationClass: "slide-up",
    threshold: 0.2,
    staggerDelay: 50,
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Layout userName={userName} />
      <div className="relative bg-transparent flex justify-center w-screen !pt-[7rem]">
        <BubbleBackground />
        <div className="md:w-[20%]" />
        <div className="dashboard__container">
          <h1 className="animate-fade dark:text-gray-100 text-3xl md:text-5xl !mb-6">
            Dashboard
          </h1>
          <section className="animate-slide dashboard-card w-full rounded-xl bg-gray-900/10/20 dark:bg-neutral-100/10 border border-sky-200/50 dark:border-none backdrop-blur shadow-md ">
            <h2 className="dark:text-gray-100 text-xl md:text-3xl">
              {handleGreeting(firstNameFilter(userName))}
            </h2>
            <p className="!mb-[1rem] md:text-lg dark:text-gray-100 ">
              Here's an overview of your study progress:
            </p>
            <Suspense fallback={<DashboardOverviewSkeleton />}>
              {loading ? (
                <DashboardOverviewSkeleton />
              ) : error ? (
                <ErrorState error={error} />
              ) : (
                <DashboardOverviewCard
                  sessions={sessions}
                  notes={notes}
                  flashcards={flashcards}
                  userName={userName}
                />
              )}
            </Suspense>
            <Button variant="orange" className="!mb-[1rem]">
              <Link to="/new-session" className="btn--link">
                New Session
              </Link>
            </Button>
          </section>
          <DashboardQuicklinksCard className="animate-slide" />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
