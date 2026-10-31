import React, { useEffect, useRef, useState } from "react";

import {
  generateFlashcardsFromNotes,
  generateNoteSummary,
} from "../../anthropic";
import FileUploadProcessor from "../../components/FileUploadProcessor/FileUploadProcessor";
import Layout from "../../components/Layout";
import TypingIndicator from "../../components/TypingIndicator/TypingIndicator";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import Button from "../../components/Button/Button";
import ErrorState from "../../components/ErrorState/ErrorState";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import GenerateBtnGroup from "../Note/GenerateBtnGroup";
import GenerateFlashcards from "../../components/GenerateFlashcards/GenerateFlashcards";
import useAuth from "../../hooks/useAuth";
import handleAnthropicError from "../../utils/anthropicErrorHandler";
import { saveNote, updateNote } from "../../utils/noteService";
import { saveDeck } from "../../utils/flashcardService";
import createNoteWithSummary, { NOTE_TOO_LONG_MESSAGE } from "../../utils/createNoteWithSummary";
import { DEFAULT_CARDS, MAX_CARDS, MIN_CARDS, NOTE_MAX_CHARS } from "../../../shared/limits";

import "./NewNote.css";
import "../NewFlashcards/NewFlashcards.css";

const NewNote = () => {
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState(null);
  const [flashcardError, setFlashcardError] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [partialContent, setPartialContent] = useState("");
  const [fileUploadProps, setFileUploadProps] = useState({});
  const noteTooLong = (fileUploadProps.text?.length ?? 0) > NOTE_MAX_CHARS;
  const [generateFlashcards, setGenerateFlashcards] = useState(false);
  const [generateQuiz, setGenerateQuiz] = useState(false);
  const [showBottomRef, setShowBottomRef] = useState(false);
  const [topic, setTopic] = useState("");
  const [flashcardTopic, setFlashcardTopic] = useState("");
  const [deck, setDeck] = useState([]);
  const [notes, setNotes] = useState("");
  const [numberOfCards, setNumberOfCards] = useState(String(DEFAULT_CARDS));
  const [inputError, setInputError] = useState(null);
  ("");
  const [isCopied, setIsCopied] = useState(false);
  const [title, setTitle] = useState("");
  const [isResponseGenerated, setIsResponseGenerated] = useState(false);
  const { user } = useAuth();
  const userName = user?.displayName || location.state?.userName;
  const isTitleValid = title.trim().length > 0;
  const aiMessageRef = useRef(null);
  const inputSectionRef = useRef(null);
  const cardStackRef = useRef(null);
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToInputSection = () => {
    inputSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [loadingFlashcards]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToInputSection();
  }, [generateFlashcards, generateQuiz]);

  useEffect(() => {
    const callback = (entries, slideObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("slide-up");
          slideObserver.unobserve(entry.target);
        }
      });
    };

    const options = {
      threshold: 0.2,
    };

    const slideObserver = new IntersectionObserver(callback, options);

    const slideAnimatedElements = document.querySelectorAll(".animate-slide");
    slideAnimatedElements.forEach((el) => slideObserver.observe(el));
  });

  if (!user) return <Navigate to="/login" replace />;

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "title") {
      setTitle(value);
    }
    if (name === "numberOfCards") {
      setNumberOfCards(value);
    }
  };

  const handleCopy = () => {
    if (aiMessageRef.current) {
      navigator.clipboard.writeText(aiMessageRef.current.textContent);
    }
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const onInput = (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  };

  const handleGenerateFlashcards = () => {
    setGenerateQuiz(false);
    setGenerateFlashcards(true);
    setFlashcardTopic(topic.toUpperCase());
  };

  const handleGenerateQuiz = () => {
    setGenerateFlashcards(false);
    setGenerateQuiz(true);
    setFlashcardTopic(topic.toUpperCase());
  };

  const onSubmit = async (fileUploadProps) => {
    const { text, fileName, setDisplayFileName, setStatus } = fileUploadProps;
    setNotes(text);
    setTopic(title);
    setSummary([]);
    setIsResponseGenerated(false);

    if (!text || !isTitleValid) {
      console.log("No text or title provided");
      return;
    }
    setError(null);
    if (text.length > NOTE_MAX_CHARS) {
      setError(NOTE_TOO_LONG_MESSAGE);
      return;
    }
    try {
      setLoadingSummary(true);
      setIsResponseGenerated(true);
      // Show the user's text straight away; it is saved only with the summary.
      setSummary([...summary, { id: Date.now(), role: "user", content: text }]);
      const { noteId: savedNoteId, messages: finalSummary } = await createNoteWithSummary(
        { userId: user.uid, noteId, title, fileName, text, previousMessages: summary },
        { generateNoteSummary, saveNote, updateNote }
      );
      setNoteId(savedNoteId);
      const aiResponse = finalSummary.at(-1).content;
      const words = aiResponse.split(" ");
      let currentWord = 0;
      setPartialContent("");

      const interval = setInterval(() => {
        setPartialContent((prev) => prev + words[currentWord] + " ");
        currentWord++;

        if (currentWord >= words.length) {
          clearInterval(interval);
          setSummary(finalSummary);
          setPartialContent("");
          setLoadingSummary(false);
        }
      }, 30);
      setTitle("");
      setStatus(null);
      setDisplayFileName("");
    } catch (error) {
      setError(handleAnthropicError(error).message);
    } finally {
      setLoadingSummary(false);
    }
  };

  const onGenerateFlashcards = async () => {
    setInputError(null);
    if (numberOfCards < MIN_CARDS || numberOfCards > MAX_CARDS) {
      setInputError(`Please enter a number between ${MIN_CARDS} and ${MAX_CARDS}`);
      return;
    }
    setShowBottomRef(true);
    try {
      const cardTopic = topic;
      const cardCount = numberOfCards;
      setError(null);
      setLoadingFlashcards(true);
      const aiResponse = await generateFlashcardsFromNotes(
        notes,
        numberOfCards
      );
      const parsedResponse = JSON.parse(aiResponse);
      const flashcards = parsedResponse.map((card, index) => ({
        ...card,
        id: card.id || index + 1,
        topic: cardTopic,
      }));
      await saveDeck(user.uid, flashcards, cardTopic, cardCount);
      setDeck(flashcards);
      setLoadingFlashcards(false);
    } catch (error) {
      console.log(error);
      setLoadingFlashcards(false);
      setFlashcardError(handleAnthropicError(error).message);
    }
  };

  return (
    <div className="relative flex flex-col w-screen h-full">
      <Layout userName={userName} />
      <div className="animate-slide flex flex-col items-center w-full !pt-[4rem] !pb-[2rem]">
        <div className="w-full !p-[2rem]">
          <div
            className="flex justify-center items-center !py-[1rem] text-[1.5rem] font-bold text-center dark:text-gray-100"
          >
            Create a new note
          </div>
          <div className="w-full flex flex-col justify-center items-center gap-[2rem] !p-[2rem] bg-gray-900/10 dark:bg-gray-100/10 rounded-xl">
            <FileUploadProcessor
              onExtractedText={(
                text,
                fileName,
                setDisplayFileName,
                setStatus
              ) =>
                setFileUploadProps({
                  text,
                  fileName,
                  setDisplayFileName,
                  setStatus,
                })
              }
            />
            {fileUploadProps.text && (
              <p
                aria-live="polite"
                className={
                  noteTooLong
                    ? "text-red-600 dark:text-red-400"
                    : "text-neutral-600 dark:text-neutral-300"
                }
              >
                {fileUploadProps.text.length.toLocaleString("en-US")} /{" "}
                {NOTE_MAX_CHARS.toLocaleString("en-US")} characters
                {noteTooLong && " (too long to summarise)"}
              </p>
            )}
            <div className="new-note__title">
              <label htmlFor="title" className="dark:text-gray-100">Title</label>
              <input
                type="text"
                name="title"
                placeholder="Enter a title for your note"
                id="title"
                value={title}
                onChange={onChange}
                required
                className="bg-sky-100 dark:bg-black border border-neutral-200 dark:border-black dark:text-neutral-100"
              />
            </div>
            <Button
              variant="orange"
              disabled={
                !fileUploadProps.text || !isTitleValid || loadingSummary || noteTooLong
              }
              onClick={() => onSubmit(fileUploadProps)}
            >
              {loadingSummary ? "Generating summary..." : "Generate summary"}
            </Button>
          </div>
        </div>
        {loadingSummary && (
          <div className="note-summary__loading">
            <TypingIndicator />
          </div>
        )}
        {error && <ErrorState error={error} />}
        <div className="note-summary__wrapper">
          {isResponseGenerated && !loadingSummary && (
            <>
              <div className="note__title dark:text-gray-100">{topic.toUpperCase()}</div>
              <div className="note-summary__container text-sky-900 dark:text-sky-400">
                {summary.length > 0 &&
                  summary.map(
                    (obj) =>
                      obj.role === "assistant" && (
                        <div
                          key={obj.id}
                          className={`note-summary ${obj.role}`}
                        >
                          <div ref={aiMessageRef}>
                            <MarkdownRenderer>{obj.content}</MarkdownRenderer>
                          </div>
                        </div>
                      )
                  )}
                {partialContent && (
                  <div>
                    <MarkdownRenderer>{partialContent}</MarkdownRenderer>
                  </div>
                )}
              </div>
              <ActionButtons isCopied={isCopied} handleCopy={handleCopy} />
              <GenerateBtnGroup
                isCopied={isCopied}
                handleCopy={handleCopy}
                handleGenerateFlashcards={handleGenerateFlashcards}
                handleGenerateQuiz={handleGenerateQuiz}
                generateFlashcards={generateFlashcards}
                generateQuiz={generateQuiz}
              />
            </>
          )}
          {generateFlashcards && (
            <GenerateFlashcards
              topic={flashcardTopic}
              deck={deck}
              numberOfCards={numberOfCards}
              setNumberOfCards={setNumberOfCards}
              inputError={inputError}
              loadingFlashcards={loadingFlashcards}
              onChange={onChange}
              onInput={onInput}
              onGenerateFlashcards={onGenerateFlashcards}
              inputSectionRef={inputSectionRef}
              flashcardError={flashcardError}
              cardStackRef={cardStackRef}
            />
          )}
          {showBottomRef && (
            <div ref={bottomRef} style={{ height: "1px", width: "100%" }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default NewNote;
