# GraphQL-relay-tools

[![Build Status](https://travis-ci.org/excitement-engineer/graphql-relay-tools.svg?branch=master)](https://travis-ci.org/excitement-engineer/graphql-relay-tools)
[![npm version](https://badge.fury.io/js/graphql-relay-tools.svg)](https://badge.fury.io/js/graphql-relay-tools)
[![codecov](https://codecov.io/gh/excitement-engineer/graphql-relay-tools/branch/master/graph/badge.svg)](https://codecov.io/gh/excitement-engineer/graphql-relay-tools)


This is a library that allows the easy creation of Relay compliant servers using the GraphQL type language. This library should be used in combination with [GraphQL-tools](https://github.com/apollographql/graphql-tools) which provides the structure for building an executable graphQL schema using the GraphQL type language.

Curious how it works? Check out a live and editable example on [Launchpad](https://launchpad.graphql.com/1w4r8lx49).

## Getting Started

A basic understanding of GraphQL and of the [GraphQL-tools](https://github.com/apollographql/graphql-tools) library is needed to provide context for this library.

An overview of GraphQL in general is available in the [README](https://github.com/facebook/graphql/blob/master/README.md) for the [Specification for GraphQL](https://github.com/facebook/graphql).

This library is designed to work with the [GraphQL-tools](https://github.com/apollographql/graphql-tools) library.

An overview of the functionality that a Relay-compliant GraphQL server should provide is in the [GraphQL Relay Specification](https://facebook.github.io/relay/docs/graphql-relay-specification.html) on the [Relay website](https://facebook.github.io/relay/). That overview describes a simple set of examples that exist as [tests](src/__tests__) in this repository. A good way to get started with this repository is to walk through that documentation and the corresponding tests in this library together.

## Using Relay Library for GraphQL-tools

Install GraphQL.js, GraphQL-tools and GraphQL-relay-tools to get started

```sh
yarn add graphql graphql-tools graphql-relay-tools
```

When building a schema with [GraphQL-tools](https://github.com/apollographql/graphql-tools), the provided library functions can be used to simplify the creation of Relay patterns.

### Connections

Helper functions are provided for both building the GraphQL types for connections and for implementing the `resolve` method for fields returning those types.

- `connectionArgs` returns the arguments that fields should provide when they return a connection type that supports bidirectional pagination.
- `forwardConnectionArgs` returns the arguments that fields should provide when they return a connection type that only supports forward pagination.
- `backwardConnectionArgs` returns the arguments that fields should provide when they return a connection type that only supports backward pagination.
- `connectionDefinitions` returns a `connectionType`, given the name of a node type.
- `connectionFromArray` is a helper method that takes an array and the arguments from `connectionArgs`, does pagination and filtering, and returns an object in the shape expected by a `connectionType`'s `resolve` function.
- `connectionFromPromisedArray` is similar to `connectionFromArray`, but it takes a promise that resolves to an array, and returns a promise that resolves to the expected shape by `connectionType`.
- `cursorForObjectInConnection` is a helper method that takes an array and a member object, and returns a cursor for use in the mutation payload.
- `offsetToCursor` takes the index of a member object in an array and returns an opaque cursor for use in the mutation payload.
- `cursorToOffset` takes an opaque cursor (created with `offsetToCursor`) and returns the corresponding array index.

> Note, `connectionFromArray`, `connectionFromPromisedArray`, `cursorForObjectInConnection`, `offsetToCursor`, and `cursorToOffset` are taken directly from [GraphQL-relay.js](https://github.com/graphql/graphql-relay-js). Please refer to that library for the implementation of these helpers.

An example usage of these methods from the [test schema](src/__tests__/starWarsSchema.js):

```js
const { connectionType: ShipConnection } = connectionDefinitions({
  name: "Ship"
});

const factionType = `
type Faction {
  ships${connectionArgs()}: ShipConnection
} 
`;

const factionResolver = {
  ships: (faction, args) => 
    connectionFromArray(faction.ships.map(getShip), args)
};
```

This shows adding a `ships` field to the `Faction` object that is a connection. It uses `connectionDefinitions({name: "Ship"})` to create the connection type, adds `connectionArgs` as arguments on the field, and then implements the resolve function by passing the array of ships and the arguments to `connectionFromArray`.

### Object Identification

Helper functions are provided for both building the GraphQL types for nodes and for implementing global IDs around local IDs.

 - `nodeInterface` returns the `Node` interface that GraphQL types can implement.
 - `nodeField` returns the `node` root field to include on the Query type.
 - `nodesField` returns the `nodes` root field to include on the Query type.
 - `nodeDefinitions` returns the `node` and `nodes` root field resolver to include on the query type. To implement this, it takes a function to resolve an ID to an object.
 - `toGlobalId` takes a type name and an ID specific to that type name, and returns a "global ID" that is unique among all types.
 - `fromGlobalId` takes the "global ID" created by `toGlobalID`, and returns the type name and ID used to create it.
 - `globalIdResolver` creates the resolver for an `id` field on a node.

> Note, `toGlobalId` and `fromGlobalId`, are taken directly from [GraphQL-relay.js](https://github.com/graphql/graphql-relay-js). Please refer to that library for the implementation of these helpers.

An example usage of these methods from the [test schema](src/__tests__/starWarsSchema.js):

```js
const { nodeResolver } = nodeDefinitions(globalId => {
  const { type, id } = fromGlobalId(globalId);
  return data[type][id]
  }
});

const typeDefs = `
  type Faction implements Node {
    id: ID!
  } 
  
  type Query {
    ${nodeField}
  }
`;

const schema = makeExecutableSchema({
  typeDefs: [nodeInterface, typeDefs],
  resolvers: {
    Query: {
      node: nodeResolver
    },
    Node: {
      __resolveType: obj => (obj.ships ? "Faction" : "Ship")
    },
    Faction: {
      id: globalIdResolver()
    }
  }
});
```

This creates a `Faction` type that implements the `Node` interface and includes the `node` root field on the `Query` type using `nodeField`. `nodeDefinitions` constructs the `node` root field resolver; it uses `fromGlobalId` to resolve the IDs passed in the implementation of the function mapping ID to object. It then uses the `globalIdResolver` method to create the `id` field resolver on `Faction`. Finally, the `Node` interface resolver is implemented to resolve the type of a given object.

### Mutations

A helper function is provided for building mutations with single inputs and client mutation IDs.

 - `mutationWithClientMutationId` takes a name, input fields, output fields, and a mutation method to map from the input fields to the output fields, performing the mutation along the way. It then creates and returns the mutation GraphQL type, the field configuration that can be used as a top-level field on the mutation type and the resolver function for the mutation.

An example usage of these methods from the [test schema](src/__tests__/starWarsSchema.js):

```js
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

const typeDefs = `
  type Mutation {
    introduceShip${mutationField}
  }
`;

const schema = makeExecutableSchema({
  typeDefs: [ mutationType, typeDefs],
  resolvers: {
    Mutation: {
      introduceShip: mutationResolver
    }
  }
});
```

This code creates a mutation named `IntroduceShip`, which takes a faction ID and a ship name as input. It outputs the `Faction` and the `Ship` in question. `mutateAndGetPayload` then gets an object with a property for each input field, performs the mutation by constructing the new ship, then returns the new ship and the faction.

The mutation type, field and resolver returned by `mutationWithClientMutationId` are then integrated into the schema definition.

## Credit

This library is based heavily on the [GraphQL-relay.js](https://github.com/graphql/graphql-relay-js) library. The API in this library is very similar and the test cases provided by the library have been adapted for this library, credit goes to this library. Huge thanks to all the maintainers/contributors of that library for coming up with a great API. The license included in the library has been reproduced below.


> License from [GraphQL-relay.js](https://github.com/graphql/graphql-relay-js)
>
> For GraphQL software
>
> Copyright (c) 2015, Facebook, Inc. All rights reserved.
>
> Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:
>
> * Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
>
> * Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
>
> * Neither the name Facebook nor the names of its contributors may be used to
   endorse or promote products derived from this software without specific
   prior written permission.
>
> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

