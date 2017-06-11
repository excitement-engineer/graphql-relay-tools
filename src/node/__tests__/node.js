// @flow

import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";

import { nodeInterface, nodeField, nodesField, nodeDefinitions } from "../";

const { nodeResolver, nodesResolver } = nodeDefinitions(id => {
  if (userData[id]) {
    return userData[id];
  }
  if (photoData[id]) {
    return photoData[id];
  }
});

const typeDefs = `
  type User implements Node {
    id: ID!
    name: String
  }
  
  type Photo implements Node {
    id: ID!
    width: Int
  }
  
  type Query {
    ${nodeField}
    ${nodesField}
  }
`;

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

const photoData = {
  "3": {
    id: 3,
    width: 300
  },
  "4": {
    id: 4,
    width: 400
  }
};

const schema = makeExecutableSchema({
  typeDefs: [typeDefs, nodeInterface],
  resolvers: {
    Node: {
      __resolveType: obj => {
        if (userData[obj.id]) {
          return "User";
        }
        if (photoData[obj.id]) {
          return "Photo";
        }
      }
    },
    Query: {
      node: nodeResolver,
      nodes: nodesResolver
    }
  }
});

describe("Node interface and fields", () => {
  describe("refetchability", () => {
    it("gets the correct ID for users", async () => {
      const query = `{
        node(id: "1") {
          id
        }
      }`;

      expect(await graphql(schema, query)).toEqual({
        data: {
          node: {
            id: "1"
          }
        }
      });
    });

    it("gets the correct IDs for users", async () => {
      const query = `{
        nodes(ids: ["1", "2"]) {
          id
        }
      }`;

      expect(await graphql(schema, query)).toEqual({
        data: {
          nodes: [
            {
              id: "1"
            },
            {
              id: "2"
            }
          ]
        }
      });
    });

    it("gets the correct ID for photos", async () => {
      const query = `{
        node(id: "4") {
          id
        }
      }`;

      expect(await graphql(schema, query)).toEqual({
        data: {
          node: {
            id: "4"
          }
        }
      });
    });

    it("gets the correct IDs for photos", async () => {
      const query = `{
        nodes(ids: ["3", "4"]) {
          id
        }
      }`;

      expect(await graphql(schema, query)).toEqual({
        data: {
          nodes: [
            {
              id: "3"
            },
            {
              id: "4"
            }
          ]
        }
      });
    });

    it("gets the correct IDs for multiple types", async () => {
      const query = `{
        nodes(ids: ["1", "3"]) {
          id
        }
      }`;

      expect(await graphql(schema, query)).toEqual({
        data: {
          nodes: [
            {
              id: "1"
            },
            {
              id: "3"
            }
          ]
        }
      });
    });

    it("gets the correct name for users", async () => {
      const query = `{
        node(id: "1") {
          id
          ... on User {
            name
          }
        }
      }`;

      return expect(await graphql(schema, query)).toEqual({
        data: {
          node: {
            id: "1",
            name: "John Doe"
          }
        }
      });
    });

    it("gets the correct width for photos", async () => {
      const query = `{
        node(id: "4") {
          id
          ... on Photo {
            width
          }
        }
      }`;

      return expect(await graphql(schema, query)).toEqual({
        data: {
          node: {
            id: "4",
            width: 400
          }
        }
      });
    });

    it("gets the correct type name for users", async () => {
      const query = `{
        node(id: "1") {
          id
          __typename
        }
      }`;

      return expect(await graphql(schema, query)).toEqual({
        data: {
          node: {
            id: "1",
            __typename: "User"
          }
        }
      });
    });

    it("gets the correct type name for photos", async () => {
      const query = `{
        node(id: "4") {
          id
          __typename
        }
      }`;

      return expect(await graphql(schema, query)).toEqual({
        data: {
          node: {
            id: "4",
            __typename: "Photo"
          }
        }
      });
    });

    it("ignores photo fragments on user", async () => {
      const query = `{
        node(id: "1") {
          id
          ... on Photo {
            width
          }
        }
      }`;

      return expect(await graphql(schema, query)).toEqual({
        data: {
          node: {
            id: "1"
          }
        }
      });
    });

    it("returns null for bad IDs", async () => {
      const query = `{
        node(id: "5") {
          id
        }
      }`;

      return expect(await graphql(schema, query)).toEqual({
        data: {
          node: null
        }
      });
    });

    it("returns nulls for bad IDs", async () => {
      const query = `{
        nodes(ids: ["3", "5"]) {
          id
        }
      }`;

      return expect(await graphql(schema, query)).toEqual({
        data: {
          nodes: [
            {
              id: "3"
            },
            null
          ]
        }
      });
    });
  });

  describe("introspection", () => {
    it("has the correct node interface", async () => {
      const query = `{
        __type(name: "Node") {
          name
          description
          kind
          fields {
            name
            description
            type {
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }`;
      expect(await graphql(schema, query)).toMatchSnapshot();
    });
    it("has correct node and nodes root fields", async () => {
      const query = `{
        __schema {
          queryType {
            fields {
              name
              description
              type {
                name
                kind
              }
              args {
                name
                description
                type {
                  kind
                  ofType {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      }`;

      expect(await graphql(schema, query)).toMatchSnapshot();
    });
  });
});
