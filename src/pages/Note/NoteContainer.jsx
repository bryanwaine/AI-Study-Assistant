import React from "react";

import MarkdownRenderer from "../../components/MarkdownRenderer";
import useStaggeredAnimation from "../../hooks/useStaggeredAnimation";

const NoteContainer = ({ summary, metaData, aiMessageRef }) => {
  useStaggeredAnimation({
    selector: ".animate-slide",
    animationClass: "slide-up",
    threshold: 0.2,
    staggerDelay: 50,
  });

  useStaggeredAnimation({
    selector: ".animate-fade",
    animationClass: "fade-in",
    threshold: 0.2,
    staggerDelay: 50,
  });

  return (
    <div className="note__container">
      {metaData?.title && (
        <div className="animate-fade note__title dark:text-gray-100">
          {metaData.title.toUpperCase()}
        </div>
      )}
      <div className="note dark:text-gray-100">
        {summary?.map(
          (message) =>
            message.role === "assistant" && (
              <div key={message.id} className={`note__summary ${message.role}`}>
                <div ref={aiMessageRef}>
                  <MarkdownRenderer>{message.content}</MarkdownRenderer>
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default NoteContainer;
