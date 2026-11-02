import React, { useEffect } from "react";
import BubbleBackground from "../../components/BubbleBg";
import EmptyState from "../../components/EmptyState/EmptyState";
import Layout from "../../components/Layout";
import useAuth from "../../hooks/useAuth";

import "./Quizzes.css";

const Quizzes = () => {
  const { user } = useAuth();
  const userName = user?.displayName || location.state?.userName;

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
    <div className="quizzes__wrapper">
      <Layout userName={userName} />
      <BubbleBackground />
      <div className="quizzes__container">
        <h1 className="dark:text-gray-100 text-3xl md:text-5xl !mb-6">
          Your Quizzes
        </h1>
        <EmptyState page="quizzes" />
      </div>
    </div>
  );
};

export default Quizzes;
