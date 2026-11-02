import React from "react";
import TypingIndicator from "../TypingIndicator/TypingIndicator";
import ErrorState from "../ErrorState/ErrorState";
import Button from "../Button/Button";
import CardStack from "../Cardstack/CardStack";
import { MAX_CARDS, MIN_CARDS } from "../../../shared/limits";

import "./GenerateFlashcards.css";

const GenerateFlashcards = ({
  topic,
  deck,
  numberOfCards,
  inputError,
  loadingFlashcards,
  onChange,
  onInput,
  onGenerateFlashcards,
  inputSectionRef,
  flashcardError,
}) => {
  return (
    <>
      <div className="generate-section__wrapper">
        <div className="generate-section__container card--white">
          <div
            ref={inputSectionRef}
            className="flex justify-center items-center !py-[1rem] text-[1.5rem] font-bold text-center dark:text-gray-100"
          >
            Generate Flashcards
          </div>
          <div className="w-full flex flex-col items-center gap-[1rem] !p-[2rem] bg-gray-900/10 dark:bg-gray-100/10 rounded-xl">
            <div className="generate-section__input__title">
              <label htmlFor="note-topic" className="dark:text-gray-100">Title</label>
              <input
                type="text"
                name="note-topic"
                id="note-topic"
                defaultValue={topic}
                required
                disabled
                className="bg-gray-900/10 dark:bg-black border border-neutral-200 dark:border-black dark:text-neutral-100"
              />
            </div>
            <div className="generate-section__input__card-count">
              <label htmlFor="numberOfCards" className="dark:text-gray-100">Number of cards</label>
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                name="numberOfCards"
                id="number-of-cards"
                placeholder={`Enter a number between ${MIN_CARDS} and ${MAX_CARDS}`}
                className={`bg-gray-900/10 dark:bg-black border border-neutral-200 dark:border-black dark:text-neutral-100 ${inputError && "input-error"}`}
                value={numberOfCards}
                onChange={onChange}
                onInput={onInput}
                required
              />
              {inputError && <span className="error">{inputError}</span>}
            </div>

            <Button
              variant="orange"
              type="submit"
              className="!mt-[1rem]"
              disabled={!topic || !numberOfCards || loadingFlashcards}
              aria-label="Generate flashcards"
              onClick={() => onGenerateFlashcards(topic, numberOfCards)}
            >
              {loadingFlashcards ? "Generating Flashcards..." : "Generate Flashcards"}
            </Button>
          </div>
        </div>
      </div>
      {loadingFlashcards && (
        <div className="deck-wrapper__loading">
          <TypingIndicator />
        </div>
      )}
      {!loadingFlashcards && deck.length > 0 && (
        <div className="generate-flashcards__wrapper">
          <div className="generate-flashcards__container">
            <div className="generate-flashcards__deck__wrapper">
              <h2 className="generate-flashcards__deck-title">
                {deck[0].topic.toUpperCase()}
              </h2>
              <CardStack cards={deck} />
            </div>
            {flashcardError && <ErrorState error={flashcardError} />}
          </div>
        </div>
      )}
    </>
  );
};

export default GenerateFlashcards;
