// @flow

/**
 * An flow type alias for cursors in this implementation.
 */
export type ConnectionCursor = string;

/**
 * A flow type designed to be exposed as `PageInfo` over GraphQL.
 */
export type PageInfo = {
  startCursor: ?ConnectionCursor,
  endCursor: ?ConnectionCursor,
  hasPreviousPage: ?boolean,
  hasNextPage: ?boolean
};

/**
 * A flow type designed to be exposed as a `Connection` over GraphQL.
 */
export type Connection<T> = {
  edges: Array<Edge<T>>;
  pageInfo: PageInfo;
};

/**
 * A flow type designed to be exposed as a `Edge` over GraphQL.
 */
export type Edge<T> = {
  node: T;
  cursor: ConnectionCursor;
};

/**
 * A flow type describing the arguments a connection field receives in GraphQL.
 */
export type ConnectionArguments = {
  before?: ?ConnectionCursor;
  after?: ?ConnectionCursor;
  first?: ?number;
  last?: ?number;
};

/**
 * A flow type describing the arguments a forward connection field receives in GraphQL.
 */
export type ForwardConnectionArguments = {
  after?: ?ConnectionCursor;
  first?: ?number
}

/**
 * A flow type describing the arguments a backwards connection field receives in GraphQL.
 */
export type BackwardConnectionArguments = {
  before?: ?ConnectionCursor;
  last?: ?number;
}