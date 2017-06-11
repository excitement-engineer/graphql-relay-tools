// @flow

import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";

import {
  pageInfoType,
  connectionDefinitions,
  connectionArgs,
  forwardConnectionArgs,
  backwardConnectionArgs,
  connectionFromArray
} from "../";

const allUsers = [
  { name: "Dan", friends: [1, 2, 3, 4] },
  { name: "Nick", friends: [0, 2, 3, 4] },
  { name: "Lee", friends: [0, 1, 3, 4] },
  { name: "Joe", friends: [0, 1, 2, 4] },
  { name: "Tim", friends: [0, 1, 2, 3] }
];

const { connectionType: friendConnection } = connectionDefinitions({
  name: "Friend",
  nodeType: "User",
  edgeFields: `friendshipTime: String`,
  connectionFields: `totalCount: Int`
});

const { connectionType: userConnection } = connectionDefinitions({
  name: "User"
});

const schemaDef = `
  type User {
    name: String,
    friends${connectionArgs([
      `
      # Sort your friends in alphabetical order
      sort: Boolean
      `,
      `
      # Retrieve only nearby friends
      onlyNearbyFriends: Boolean
      `
    ])}: FriendConnection
    friendsForward${forwardConnectionArgs([`sort: Boolean`])}: UserConnection
    friendsBackward${backwardConnectionArgs([])}: UserConnection
  }

  type Query {
    user: User
  }
`;

const schema = makeExecutableSchema({
  typeDefs: [schemaDef, pageInfoType, friendConnection, userConnection],
  resolvers: {
    Query: {
      user: () => allUsers[0]
    },
    User: {
      friends: (user, args) => connectionFromArray(user.friends, args),
      friendsForward: (user, args) => connectionFromArray(user.friends, args),
      friendsBackward: (user, args) => connectionFromArray(user.friends, args)
    },
    FriendConnection: {
      totalCount: () => allUsers.length - 1
    },
    FriendEdge: {
      node: edge => allUsers[edge.node],
      friendshipTime: () => "Yesterday"
    },
    UserEdge: {
      node: edge => allUsers[edge.node]
    }
  }
});

describe("connectionDefinition()", () => {
  describe("connection fetching", () => {
    it("includes connection and edge fields", async () => {
      const query = `
      query FriendsQuery {
        user {
          friends(first: 2) {
            totalCount
            edges {
              friendshipTime
              node {
                name
              }
            }
          }
        }
      }
    `;
      const expected = {
        user: {
          friends: {
            totalCount: 4,
            edges: [
              {
                friendshipTime: "Yesterday",
                node: {
                  name: "Nick"
                }
              },
              {
                friendshipTime: "Yesterday",
                node: {
                  name: "Lee"
                }
              }
            ]
          }
        }
      };
      const result = await graphql(schema, query);
      expect(result).toEqual({ data: expected });
    });

    it("works with forwardConnectionArgs", async () => {
      const query = `
      query FriendsQuery {
        user {
          friendsForward(first: 2) {
            edges {
              node {
                name
              }
            }
          }
        }
      }
    `;
      const expected = {
        user: {
          friendsForward: {
            edges: [
              {
                node: {
                  name: "Nick"
                }
              },
              {
                node: {
                  name: "Lee"
                }
              }
            ]
          }
        }
      };
      const result = await graphql(schema, query);
      expect(result).toEqual({ data: expected });
    });

    it("works with backwardConnectionArgs", async () => {
      const query = `
      query FriendsQuery {
        user {
          friendsBackward(last: 2) {
            edges {
              node {
                name
              }
            }
          }
        }
      }
    `;
      const expected = {
        user: {
          friendsBackward: {
            edges: [
              {
                node: {
                  name: "Joe"
                }
              },
              {
                node: {
                  name: "Tim"
                }
              }
            ]
          }
        }
      };
      const result = await graphql(schema, query);
      expect(result).toEqual({ data: expected });
    });
  });

  describe("connection args", () => {});

  describe("introspection", () => {
    it("has the correct argument structure", async () => {
      const query = `{
        __type(name: "User") {
            fields {
              name
              args {
                name
                description
                type {
                  kind
                  name
                }
              }
            }
        }
      }`;

      expect(await graphql(schema, query)).toMatchSnapshot();
    });
    it("has the correct page info structure", async () => {
      const query = `{
        __type(name: "PageInfo") {
          name
          description
          kind
          fields {
            name
            description
            type {
              kind
              name
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

    it("has the correct connection structure", async () => {
      const query = `{
        __type(name: "UserConnection") {
          fields {
            name
            type {
              name
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

    it("has the correct edge structure", async () => {
      const query = `{
        __type(name: "UserEdge") {
          fields {
            name
            type {
              name
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
  });
});
