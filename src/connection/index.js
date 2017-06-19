// @flow

/**
 * Copyright (c) 2017, Dirk-Jan Rutten
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * The common page info type used by all connections.
 */
const pageInfoType = `
  # Information about pagination in a connection.'
  type PageInfo {
    # When paginating forwards, the cursor to continue.
    endCursor: String
    # When paginating forwards, are there more items?
    hasNextPage: Boolean!
    # When paginating backwards, are there more items?
    hasPreviousPage: Boolean!
    # When paginating backwards, the cursor to continue.
    startCursor: String
  }
`;

type ConnectionConfig = {
  name: string,
  nodeType?: ?string,
  edgeFields?: ?string,
  connectionFields?: ?string
};

type ConnectionDefinition = {
  connectionType: string
};

/**
 * Returns the type for a connection with the given name,
 * and whose nodes are of the specified type.
 */
const connectionDefinitions = (
  config: ConnectionConfig
): ConnectionDefinition => {
  const { name, edgeFields, connectionFields, nodeType } = config;

  const connectionNode = nodeType ? nodeType : name;

  const connectionType = `
    # An edge in a connection.
    type ${name}Edge {
      # A cursor for use in pagination.
      cursor: String!
      # The item at the end of the edge
      node: ${connectionNode}
      ${edgeFields ? edgeFields : ""}
    }
  
    # A connection to a list of items.
    type ${name}Connection {
      # A list of edges.
      edges: [${name}Edge]
      # Information to aid in pagination.
      pageInfo: PageInfo!
      ${connectionFields ? connectionFields : ""}
    }
  `;

  return { connectionType };
};

const flattenArgs = additionalArgs => {
  let args = "";
  if (additionalArgs) {
    args = additionalArgs.reduce((acc, cur) => {
      return `${acc} ${cur},`;
    }, ",");
    args = args.slice(0, -1);
  }
  return args;
};

/*
 * Returns the arguments appropriate to include on a field
 * whose return type is a connection type with forward pagination.
 *
 * Additional fields may be passed as an argument. These 
 * will be added to the connection argument.
 */
const connectionArgs = (additionalArgs?: ?Array<string>): string => {
  let args = "";
  if (additionalArgs) {
    args = flattenArgs(additionalArgs);
  }

  return `(
    # Returns the first n elements from the list.
    first: Int, 
    # Returns the elements in the list that come after the specified cursor.
    after: String, 
    # Returns the last n elements from the list.
    last: Int, 
    # Returns the elements in the list that come before the specified cursor.
    before: String${args})`;
};

/*
 * Returns the arguments appropriate to include on a field
 * whose return type is a connection type with forward pagination.
 * 
 * Additional fields may be passed as an argument. These 
 * will be added to the connection argument.
 */
const forwardConnectionArgs = (additionalArgs?: ?Array<string>): string => {
  let args = "";
  if (additionalArgs) {
    args = flattenArgs(additionalArgs);
  }
  return `(first: Int, after: String${args})`;
};

/*
 * Returns the arguments appropriate to include on a field
 * whose return type is a connection type with backwards pagination.
 * 
 * Additional fields may be passed as an argument. These 
 * will be added to the connection argument.
 */
const backwardConnectionArgs = (additionalArgs?: ?Array<string>): string => {
  let args = "";
  if (additionalArgs) {
    args = flattenArgs(additionalArgs);
  }
  return `(last: Int, before: String${args})`;
};

export {
  pageInfoType,
  connectionDefinitions,
  connectionArgs,
  forwardConnectionArgs,
  backwardConnectionArgs
};

// Expose some helpful utilities directly from graphql-relay.
export {
  connectionFromArray,
  connectionFromArraySlice,
  connectionFromPromisedArray,
  connectionFromPromisedArraySlice,
  cursorForObjectInConnection,
  cursorToOffset,
  getOffsetWithDefault,
  offsetToCursor
} from "graphql-relay";
