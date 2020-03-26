import {
  CardState,
  getIntervalSequenceForSchedule,
  MetabookActionOutcome,
  MetabookSpacedRepetitionSchedule,
  PromptType,
  updateCardStateForReviewMarking,
} from "metabook-core";
import React, { ReactNode, useCallback, useState } from "react";
import { Button } from "react-native";
import testCardProps from "./__fixtures__/testCardProps";
import Card from "./Card";
import { ReviewMarkingInteractionState } from "./QuestionProgressIndicator";
import { number } from "@storybook/addon-knobs";

const testIntervalSequence = getIntervalSequenceForSchedule("default");

export default {
  title: "Card",
  component: Card,
};

export const basic = () => (
  <TestCard
    showsNeedsRetryNotice={false}
    shouldLabelApplicationPrompts={false}
  />
);

function TestCard(props: {
  showsNeedsRetryNotice: boolean;
  shouldLabelApplicationPrompts: boolean;
}) {
  const { showsNeedsRetryNotice, shouldLabelApplicationPrompts } = props;
  return (
    <div style={{ height: 600, position: "relative" }}>
      <h2>{JSON.stringify(props)}</h2>
      <WithReviewState
        initialBestLevel={null}
        initialCurrentLevel={number("initial current level", 0)}
        intervalSequence={testIntervalSequence}
        schedule="aggressiveStart"
        promptType={
          shouldLabelApplicationPrompts ? "applicationPrompt" : "basic"
        }
      >
        {(cardState, reviewMarkingInteractionState) =>
          [false, true].map((isRevealed, index) => (
            <div
              key={index}
              className="CardDynamicsContainer"
              style={{ marginTop: 128, left: index * 400 + 50 }}
            >
              <Card
                {...testCardProps}
                isRevealed={isRevealed}
                promptType={
                  shouldLabelApplicationPrompts ? "applicationPrompt" : "basic"
                }
                cardState={{
                  ...cardState,
                  needsRetry: showsNeedsRetryNotice,
                }}
                reviewMarkingInteractionState={reviewMarkingInteractionState}
                showsNeedsRetryNotice={showsNeedsRetryNotice}
                shouldLabelApplicationPrompts={shouldLabelApplicationPrompts}
              />
            </div>
          ))
        }
      </WithReviewState>
    </div>
  );
}

function createCardState(
  intervalSequence: typeof testIntervalSequence,
  level: number,
  bestLevel: number | null,
): CardState {
  const interval = intervalSequence[level].interval;
  return {
    interval,
    bestInterval:
      bestLevel === null ? null : intervalSequence[bestLevel].interval,
    dueTimestampMillis: Date.now(),
    needsRetry: false,
    orderSeed: 0,
  };
}

function WithReviewState(props: {
  initialBestLevel: number | null;
  initialCurrentLevel: number;
  intervalSequence: typeof testIntervalSequence;
  schedule: MetabookSpacedRepetitionSchedule;
  promptType: PromptType;
  children: (
    cardState: CardState,
    reviewMarkingInteractionState: ReviewMarkingInteractionState | null,
  ) => ReactNode;
}) {
  const [cardState, setCardState] = useState<CardState>(
    createCardState(
      props.intervalSequence,
      props.initialCurrentLevel,
      props.initialBestLevel,
    ),
  );

  /*
  // for knobs
  useEffect(() => {
    setBestLevel(props.initialBestLevel);
  }, [props.initialBestLevel]);
  useEffect(() => {
    setCurrentLevel(props.initialCurrentLevel);
  }, [props.initialCurrentLevel]);
*/
  const [
    reviewMarkingInterationState,
    setReviewMarkingInterationState,
  ] = useState<ReviewMarkingInteractionState | null>(null);

  const onHoverDidChange = useCallback(
    (isHovering: boolean, outcome: MetabookActionOutcome) => {
      if (isHovering) {
        if (!reviewMarkingInterationState) {
          setReviewMarkingInterationState({
            outcome,
            status: "pending",
          });
        }
      } else {
        if (
          reviewMarkingInterationState &&
          reviewMarkingInterationState.status === "pending"
        ) {
          setReviewMarkingInterationState(null);
        }
      }
    },
    [reviewMarkingInterationState],
  );

  return (
    <div
      style={{
        display: "flex",
        width: 800,
        justifyContent: "space-between",
        margin: 16,
      }}
    >
      <div>{props.children(cardState, reviewMarkingInterationState)}</div>
      <Button
        title="Mark remembered"
        onPress={() => {
          setReviewMarkingInterationState({
            outcome: "remembered",
            status: "committed",
          });
        }}
      />

      <Button
        title="Mark forgotten"
        onPress={() => {
          setReviewMarkingInterationState({
            outcome: "forgotten",
            status: "committed",
          });
        }}
      />

      <Button
        title="Next round"
        onPress={() => {
          const currentOutcome =
            (reviewMarkingInterationState &&
              reviewMarkingInterationState.status === "committed" &&
              reviewMarkingInterationState.outcome) ||
            null;
          if (!currentOutcome) {
            return;
          }
          setCardState(
            updateCardStateForReviewMarking({
              baseCardState: cardState,
              cardType: props.promptType,
              actionOutcome: currentOutcome,
              schedule: props.schedule,
              reviewTimestampMillis: Date.now(),
              generatedOrderSeed: 0,
            }),
          );
          setReviewMarkingInterationState(null);
        }}
      />

      <Button
        title="Reset"
        onPress={() => {
          setReviewMarkingInterationState(null);
          setCardState(
            createCardState(
              props.intervalSequence,
              props.initialCurrentLevel,
              props.initialBestLevel,
            ),
          );
        }}
      />
    </div>
  );
}
