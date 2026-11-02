import React, { Suspense, useEffect, useState } from "react";

import { Link, useLocation } from "react-router";

import "./Decks.css";

import DecksList from "./DecksList";
import ErrorState from "../../components/ErrorState/ErrorState";
import Layout from "../../components/Layout";
import EmptyState from "../../components/EmptyState/EmptyState";
import Button from "../../components/Button/Button";
import useAuth from "../../hooks/useAuth";
import handleAnthropicError from "../../utils/anthropicErrorHandler";
import { getAllDecks } from "../../utils/flashcardService";
import SessionsListSkeleton from "../../components/Skeleton/SessionsListSkeleton";
import BubbleBackground from "../../components/BubbleBg";

/**
 * Decks component displays a list of user's flashcards.
 * It fetches flashcards from the database using the user's ID and displays them in a sorted list.
 * The component also handles loading and error states.
 * Users can navigate to create a new flashcard.
 */
const Decks = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { user } = useAuth();
  const userName = user?.displayName || location.state?.userName;

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const data = await getAllDecks(user.uid);
        setFlashcards(data);
      } catch (error) {
        setError(handleAnthropicError(error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [user]);

  useEffect(() => {
    const options = {
      threshold: 0.2,
    };
    const slideCallback = (entries, slideObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("slide-up");
          slideObserver.unobserve(entry.target);
        }
      });
    };

    const slideObserver = new IntersectionObserver(slideCallback, options);

    const fadeCallback = (entries, fadeObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in");
          fadeObserver.unobserve(entry.target);
        }
      });
    };

    const fadeObserver = new IntersectionObserver(fadeCallback, options);

    const slideAnimatedElements = document.querySelectorAll(".animate-slide");
    slideAnimatedElements.forEach((el) => slideObserver.observe(el));

    const fadeAnimatedElements = document.querySelectorAll(".animate-fade");
    fadeAnimatedElements.forEach((el) => fadeObserver.observe(el));
  });

  return (
    <div className="decks__wrapper">
      <Layout userName={userName} />
      <BubbleBackground />
      <div className="decks__container">
        <h1 className="dark:text-gray-100 text-3xl md:text-5xl !mb-6">Your Flashcards</h1>
        <Button variant="orange" className="">
          <Link to="/new-deck" className="btn--link">
            New Flashcards
          </Link>
        </Button>
        <div className="sessions__list">
          <Suspense fallback={<SessionsListSkeleton />}>
            {loading ? (
              <SessionsListSkeleton />
            ) : error ? (
              <ErrorState error={error} />
            ) : flashcards.length === 0 ? (
              <EmptyState page="flashcards" />
            ) : (
              <DecksList flashcards={flashcards} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Decks;
