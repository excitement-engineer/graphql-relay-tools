// @flow

/**
 * Copyright (c) 2017, Dirk-Jan Rutten
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { GraphQLResolveInfo, GraphQLFieldResolver } from "graphql";
import { toGlobalId } from "graphql-relay";

const nodeInterface = `
  # An object with an ID
  interface Node {
    # The id of the object.
    id: ID!
  }
`;

const nodeField = `
  # Fetches an object given its ID
  node(
    # The ID of an object
    id: ID!
  ): Node
`;

const nodesField = `
  # Fetches objects given their IDs
  nodes(
    # The IDs of objects
    ids: [ID!]!
  ): [Node]! 
`;

function globalIdResolver(
  typeName?: ?string,
  idFetcher?: (object: any, context: any, info: GraphQLResolveInfo) => string
): GraphQLFieldResolver<any, any> {
  return (obj, args, context, info) =>
    toGlobalId(
      typeName || info.parentType.name,
      idFetcher ? idFetcher(obj, context, info) : obj.id
    );
}

type GraphQLNodeResolvers = {
  nodeResolver: GraphQLFieldResolver<any, any>,
  nodesResolver: GraphQLFieldResolver<any, any>
};

function nodeDefinitions<TContext>(
  idFetcher: (id: string, context: TContext, info: GraphQLResolveInfo) => any
): GraphQLNodeResolvers {
  return {
    nodeResolver: (obj, { id }, context, info) => idFetcher(id, context, info),
    nodesResolver: (obj, { ids }, context, info) =>
      Promise.all(ids.map(id => Promise.resolve(idFetcher(id, context, info))))
  };
}

export {
  nodeInterface,
  nodeField,
  nodesField,
  globalIdResolver,
  nodeDefinitions
};

export {
  // Utilities for creating global IDs.
  fromGlobalId,
  toGlobalId
} from "graphql-relay";
