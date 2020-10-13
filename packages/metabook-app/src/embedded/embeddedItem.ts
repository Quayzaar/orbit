import {
  AttachmentIDReference,
  PromptField,
  QAPrompt,
  qaPromptType,
} from "metabook-core";
import {
  EmbeddedItem,
  EmbeddedItem,
  EmbeddedPromptField,
  EmbeddedQAPrompt,
} from "metabook-embedded-support";
import {
  AttachmentResolutionMap,
  promptReviewItemType,
  ReviewItem,
} from "metabook-ui";

function getPromptFieldFromEmbeddedPromptField(
  embeddedPromptField: EmbeddedPromptField,
  attachmentURLsToIDReferences: Map<string, AttachmentIDReference>,
): PromptField | Error {
  try {
    return {
      contents: embeddedPromptField.contents,
      attachments:
        embeddedPromptField.attachmentURLs?.map((attachmentURL) => {
          const attachmentIDReference = attachmentURLsToIDReferences.get(
            attachmentURL,
          );
          if (attachmentIDReference) {
            return attachmentIDReference;
          } else {
            throw new Error(
              `Attachment map contains no data for URL: ${attachmentURL}`,
            );
          }
        }) ?? [],
    };
  } catch (error) {
    return error;
  }
}

function getPromptFromEmbeddedQAPrompt(
  embeddedQAPrompt: EmbeddedQAPrompt,
  attachmentURLsToIDReferences: Map<string, AttachmentIDReference>,
): QAPrompt | Error {
  const question = getPromptFieldFromEmbeddedPromptField(
    embeddedQAPrompt.question,
    attachmentURLsToIDReferences,
  );
  if (question instanceof Error) {
    return question;
  }
  const answer = getPromptFieldFromEmbeddedPromptField(
    embeddedQAPrompt.answer,
    attachmentURLsToIDReferences,
  );
  if (answer instanceof Error) {
    return answer;
  }

  return {
    promptType: qaPromptType,
    question,
    answer,
  };
}

export function getReviewItemFromEmbeddedItem(
  embeddedItem: EmbeddedItem,
  attachmentURLsToIDReferences: Map<string, AttachmentIDReference>,
  attachmentResolutionMap: AttachmentResolutionMap,
): ReviewItem | Error {
  switch (embeddedItem.type) {
    case qaPromptType:
      const prompt = getPromptFromEmbeddedQAPrompt(
        embeddedItem,
        attachmentURLsToIDReferences,
      );
      if (prompt instanceof Error) {
        return prompt;
      }
      return {
        prompt,
        promptParameters: null,
        promptState: null,
        reviewItemType: promptReviewItemType,
        attachmentResolutionMap,
      };
    default:
      return new Error(`Unsupported item type ${embeddedItem.type}`);
  }
}

export function getAttachmentURLsInEmbeddedItem(
  embeddedItem: EmbeddedItem,
): string[] {
  switch (embeddedItem.type) {
    case qaPromptType:
      return [
        ...(embeddedItem.question.attachmentURLs ?? []),
        ...(embeddedItem.answer.attachmentURLs ?? []),
      ];
    default:
      throw new Error(`Unsupported item type ${embeddedItem.type}`);
  }
}
