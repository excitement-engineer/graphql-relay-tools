// @flow

import { makeExecutableSchema } from "graphql-tools";
import { graphql } from "graphql";
import {
  nodeInterface,
  nodeField,
  globalIdResolver,
  nodeDefinitions
} from "../";

const userData = {
  "1": {
    id: 1,
    name: "John Doe"
  },
  "2": {
    id: 2,
    name: "Jane Smith"
  }
};

describe("Node definition", () => {
  it("retrieves the definition", done => {
    const { nodeResolver } = nodeDefinitions((id, context, info) => {
      try {
        expect(context).toEqual({
          foo: "bar"
        });
        expect(info.schema).toEqual(schema);
        done();
      } catch (e) {
        done.fail(e);
      }
      return userData[id];
    });

    const schemaDef = `
      type User implements Node {
        id: ID!
        name: String
      }
      
      type Query {
        ${nodeField}
      }
    `;

    const schema = makeExecutableSchema({
      typeDefs: [schemaDef, nodeInterface],
      resolvers: {
        Query: {
          node: nodeResolver
        },
        Node: {
          __resolveType: () => "User"
        }
      }
    });
    const query = `{
      node(id: "1") {
        id
      }
    }`;
    const context = {
      foo: "bar"
    };
    graphql(schema, query, null, context);
  });
});
