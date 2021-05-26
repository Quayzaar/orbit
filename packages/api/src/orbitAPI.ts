import {
  ActionLog,
  ActionLogID,
  AttachmentID,
  AttachmentIDReference,
  Prompt,
  PromptID,
  PromptState,
  PromptTaskID,
} from "@withorbit/core";
import { BlobLike } from "./genericHTTPAPI";
import { RequiredSpec } from "./util/requiredSpec";

// Meant to conform to genericHTTPAPI/Spec, but I can't declare conformance without running into obscure Typescript limitations.
type SpecLegacy = {
  "/attachments/:id": {
    GET: {
      params: {
        id: AttachmentID;
      };
      response: void;
    };
  };
};

export type ValidatableSpec = {
  "/taskStates"?: {
    GET?: {
      query:
        | ({
            /**
             * @minimum 1
             * @TJS-type integer
             */
            limit?: number;
          } & (
            | {
                createdAfterID?: PromptTaskID;
              }
            | {
                /**
                 * @TJS-type integer
                 */
                dueBeforeTimestampMillis: number;
              }
          ))
        | { ids: PromptTaskID[] };
      response?: ResponseList<"taskState", PromptTaskID, PromptState>;
    };
  };

  "/actionLogs"?: {
    GET?: {
      query: {
        /**
         * @minimum 1
         * @default 100
         * @TJS-type integer
         */
        limit?: number;
        createdAfterID?: ActionLogID;
      };
      response?: ResponseList<"actionLog", ActionLogID, ActionLog>;
    };

    PATCH?: {
      contentType: JSONContentType;
      body: {
        id: ActionLogID;
        data: ActionLog;
      }[];
      response?: null;
    };
  };

  "/taskData"?: {
    GET?: {
      query: { ids: PromptID[] };
      response?: ResponseList<"taskData", PromptID, Prompt>;
    };
    PATCH?: {
      contentType: JSONContentType;
      body: { id: PromptID; data: Prompt }[];
      response?: null;
    };
  };

  "/attachments"?: {
    /**
     * encode with multipart/form-data, with the file in part named "file"
     * make sure to include Content-Type heading for your attachment
     * returns application/json encoded ResponseObject<"attachmentIDReference", AttachmentID, AttachmentIDReference>
     */
    POST?: {
      // NOTE: Content-type must use regex to be validated since additional data is usually
      // included alongside the contentType (i.e. the form-data length)
      /**
       * @TJS-type string
       * @TJS-pattern multipart/form-data
       */
      contentType: "multipart/form-data";
      /**
       * @additionalProperties true
       */
      body: {
        /**
         * @ignore
         */
        file: BlobLike;
      };
      response?: ResponseObject<
        "attachmentIDReference",
        AttachmentID,
        AttachmentIDReference
      >;
    };
  };
};

export type Spec = RequiredSpec<ValidatableSpec> & SpecLegacy;

/**
 * @TJS-type string
 * @TJS-pattern application/json
 */
type JSONContentType = "application/json";

export type ResponseList<
  ObjectTypeString extends string,
  IDType extends string,
  DataType
> = {
  objectType: "list";
  hasMore: boolean;
  data: ResponseObject<ObjectTypeString, IDType, DataType>[];
};

export type ResponseObject<
  ObjectType extends string,
  IDType extends string,
  DataType
> = {
  objectType: ObjectType;
  /**
   * @TJS-type string
   */
  id: IDType;
  data: DataType;
};
