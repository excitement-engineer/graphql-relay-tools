// @flow

/**
 * Copyright (c) 2017, Dirk-Jan Rutten
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

//TODO: Add input checks and validation.
//TODO: Check if descriptions work.
//TODO: How to deal with deprecation messages...
//TODO: Add credit to graphql-relay implementation.
//TODO: Write docs
//TODO: Add comments to the code
//TODO: Add Graphql-relay and graphql as a peer dependency.
//TODO: Export flow files from library.

// Helper for creating node definitions
export {
  nodeInterface,
  nodeField,
  nodesField,
  globalIdResolver,
  nodeDefinitions,
  // Utilities for creating global IDs.
  fromGlobalId,
  toGlobalId
} from "./node";

// Helpers for creating connection types in the schema
export {
  pageInfoType,
  connectionDefinitions,
  connectionArgs,
  forwardConnectionArgs,
  backwardConnectionArgs,
  // Helpers for creating connections from arrays
  connectionFromArray,
  connectionFromArraySlice,
  connectionFromPromisedArray,
  connectionFromPromisedArraySlice,
  cursorForObjectInConnection,
  cursorToOffset,
  getOffsetWithDefault,
  offsetToCursor
} from "./connection";

export type {
  PageInfo,
  Connection,
  Edge,
  ConnectionCursor,
  ConnectionArguments,
  ForwardConnectionArguments,
  BackwardConnectionArguments
} from "./connection/types";

// Helper for creating mutations with client mutation IDs
export { mutationWithClientMutationId } from "./mutation";
