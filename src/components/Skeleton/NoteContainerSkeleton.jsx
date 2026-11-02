import React from "react";

import "./Skeleton.css";
import useStaggeredAnimation from "../../hooks/useStaggeredAnimation";

const NoteContainerSkeleton = () => {
  useStaggeredAnimation({
    selector: ".animate-slide",
    animationClass: "slide-up",
    threshold: 0.2,
    staggerDelay: 50,
  });

  const renderSkeletonParagraphs = () => {
    let paragraphs = [];
    for (let i = 0; i < 25; i++) {
      paragraphs.push(<p className="skeleton skeleton__paragraph" key={i} />);
    }
    return paragraphs;
  };
  return (
    <div className="skeleton-note__container">
      <div className="skeleton skeleton__title note__title" />
      <div className="skeleton-note">{renderSkeletonParagraphs()}</div>
      <div className="skeleton skeleton__footer action-buttons-wrapper" />
    </div>
  );
};

export default NoteContainerSkeleton;
