// @flow

import { makeExecutableSchema } from "graphql-tools";
import { connectionFromArray } from "graphql-relay";
import {
  nodeInterface,
  nodeDefinitions,
  globalIdResolver,
  nodeField,
  nodesField,
  pageInfoType,
  connectionDefinitions,
  connectionArgs,
  mutationWithClientMutationId,
  fromGlobalId
} from "../";

import {
  getFaction,
  getShip,
  getRebels,
  getEmpire,
  createShip
} from "./starWarsData.js";

/**
 * Using our shorthand to describe type systems, the type system for our
 * test will be the following:
 *
 * interface Node {
 *   id: ID!
 * }
 *
 * type Faction implements Node {
 *   id: ID!
 *   name: String
 *   ships: ShipConnection
 * }
 *
 * type Ship implements Node {
 *   id: ID!
 *   name: String
 * }
 *
 * type ShipConnection {
 *   edges: [ShipEdge]
 *   pageInfo: PageInfo!
 * }
 *
 * type ShipEdge {
 *   cursor: String!
 *   node: Ship
 * }
 *
 * type PageInfo {
 *   hasNextPage: Boolean!
 *   hasPreviousPage: Boolean!
 *   startCursor: String
 *   endCursor: String
 * }
 *
 * type Query {
 *   rebels: Faction
 *   empire: Faction
 *   node(id: ID!): Node
 *   nodes(ids: ID!): [Node]!
 * }
 *
 * input IntroduceShipInput {
 *   clientMutationId: string
 *   shipName: string!
 *   factionId: ID!
 * }
 *
 * type IntroduceShipPayload {
 *   clientMutationId: string
 *   ship: Ship
 *   faction: Faction
 * }
 *
 * type Mutation {
 *   introduceShip(input IntroduceShipInput!): IntroduceShipPayload
 * }
 */

const { connectionType } = connectionDefinitions({
  name: "Ship"
});

const { nodeResolver, nodesResolver } = nodeDefinitions(globalId => {
  const { type, id } = fromGlobalId(globalId);
  if (type === "Faction") {
    return getFaction(id);
  }
  if (type === "Ship") {
    return getShip(id);
  }
});

const {
  mutationType,
  mutationField,
  mutationResolver
} = mutationWithClientMutationId({
  name: "IntroduceShip",
  inputFields: `
    shipName: String!
    factionId: ID!
  `,
  outputFields: `
    ship: Ship
    faction: Faction
  `,
  mutateAndGetPayload: input => {
    const { shipName, factionId } = input;
    const newShip = createShip(shipName, factionId);
    return {
      ship: getShip(newShip.id),
      faction: getFaction(factionId)
    };
  }
});

const schema = `
  type Faction implements Node {
    id: ID!
    name: String
    ships${connectionArgs()}: ShipConnection
  } 
  
  type Ship implements Node {
     id: ID!
     name: String
  }
  
  type Query {
    rebels: Faction
    empire: Faction
    ${nodeField}
    ${nodesField}
  }
  
  type Mutation {
    introduceShip${mutationField}
  }
`;

export const StarWarsSchema = makeExecutableSchema({
  typeDefs: [nodeInterface, schema, connectionType, pageInfoType, mutationType],
  resolvers: {
    Query: {
      rebels: getRebels,
      empire: getEmpire,
      node: nodeResolver,
      nodes: nodesResolver
    },
    Mutation: {
      introduceShip: mutationResolver
    },
    Node: {
      __resolveType: obj => (obj.ships ? "Faction" : "Ship")
    },
    Faction: {
      id: globalIdResolver(),
      ships: (faction, args) =>
        connectionFromArray(faction.ships.map(getShip), args)
    },
    Ship: {
      id: globalIdResolver()
    }
  }
});
