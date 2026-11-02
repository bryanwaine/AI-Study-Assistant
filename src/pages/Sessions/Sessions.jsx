import { Suspense, useEffect, useState } from "react";

import { Link, useLocation } from "react-router";

import SessionsList from "./SessionsList";
import EmptyState from "../../components/EmptyState/EmptyState";
import Button from "../../components/Button/Button";
import Layout from "../../components/Layout";
import SessionsListSkeleton from "../../components/Skeleton/SessionsListSkeleton";
import ErrorState from "../../components/ErrorState/ErrorState";
import BubbleBackground from "../../components/BubbleBg";
import useAuth from "../../hooks/useAuth";
import useStaggeredAnimation from "../../hooks/useStaggeredAnimation";
import { getAllSessions } from "../../utils/sessionService";
import handleAnthropicError from "../../utils/anthropicErrorHandler";

import "./Sessions.css";

/**
 * Sessions component displays a list of user's sessions.
 * It fetches sessions from the database using the user's ID and displays them in a sorted list.
 * The component also handles loading and error states.
 * Users can navigate to create a new session.
 */
const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { user } = useAuth();
  const userName = user?.displayName || location.state?.userName;

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getAllSessions(user.uid);
        setSessions(data);
      } catch (error) {
        setError(handleAnthropicError(error).message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSessions();
    }
  }, [user]);

  useStaggeredAnimation({
    selector: ".animate-fade",
    animationClass: "fade-in",
    threshold: 0.2,
    staggerDelay: 50,
  });

  return (
    <>
      <Layout userName={userName} />
      <div className="sessions__wrapper">
        <BubbleBackground />
        <div className="sessions__container">
          <h1 className="dark:text-gray-100 text-3xl md:text-5xl !mb-6">
            Your Sessions
          </h1>
          <Button variant="orange" className="">
            <Link to="/new-session" className="btn--link">
              New Session
            </Link>
          </Button>
          <div className="sessions__list">
            <Suspense fallback={<SessionsListSkeleton />}>
              {loading ? (
                <SessionsListSkeleton />
              ) : error ? (
                <ErrorState error={error} />
              ) : sessions.length === 0 ? (
                <EmptyState page="sessions" />
              ) : (
                <SessionsList sessions={sessions} />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sessions;
