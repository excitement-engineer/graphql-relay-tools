// @flow

import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";

import {
  nodeInterface,
  nodeField,
  fromGlobalId,
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

const photoData = {
  "1": {
    photoId: 1,
    width: 300
  },
  "2": {
    photoId: 2,
    width: 400
  }
};

const postData = {
  "1": {
    id: 1,
    text: "lorem"
  },
  "2": {
    id: 2,
    text: "ipsum"
  }
};

const schemaDef = `
  type User implements Node {
    id: ID!
    name: String
  }
  
  type Photo implements Node {
    id: ID!
    width: Int
  }
  
  type Post implements Node {
    id: ID!
    text: String
  }
  
  type Query {
    ${nodeField}
    allObjects: [Node]
  }
`;

const { nodeResolver } = nodeDefinitions(globalId => {
  const { type, id } = fromGlobalId(globalId);
  if (type === "User") {
    return userData[id];
  }
  if (type === "Photo") {
    return photoData[id];
  }
  if (type === "Post") {
    return postData[id];
  }
});

const schema = makeExecutableSchema({
  typeDefs: [schemaDef, nodeInterface],
  resolvers: {
    Node: {
      __resolveType: obj => {
        if (obj.name) {
          return "User";
        }
        if (obj.photoId) {
          return "Photo";
        }
        if (obj.text) {
          return "Post";
        }
      }
    },
    Query: {
      node: nodeResolver,
      allObjects: () => [
        userData[1],
        userData[2],
        photoData[1],
        photoData[2],
        postData[1],
        postData[2]
      ]
    },
    User: {
      id: globalIdResolver("User")
    },
    Photo: {
      id: globalIdResolver("Photo", obj => obj.photoId)
    },
    Post: {
      id: globalIdResolver()
    }
  }
});

describe("global ID fields", () => {
  it("gives different IDs", async () => {
    const query = `{
      allObjects {
        id
      }
    }`;

    expect(await graphql(schema, query)).toEqual({
      data: {
        allObjects: [
          {
            id: "VXNlcjox"
          },
          {
            id: "VXNlcjoy"
          },
          {
            id: "UGhvdG86MQ=="
          },
          {
            id: "UGhvdG86Mg=="
          },
          {
            id: "UG9zdDox"
          },
          {
            id: "UG9zdDoy"
          }
        ]
      }
    });
  });

  it("refetches the IDs", async () => {
    const query = `{
      user: node(id: "VXNlcjox") {
        id
        ... on User {
          name
        }
      },
      photo: node(id: "UGhvdG86MQ==") {
        id
        ... on Photo {
          width
        }
      },
      post: node(id: "UG9zdDox") {
        id
        ... on Post {
          text
        }
      }
    }`;

    expect(await graphql(schema, query)).toEqual({
      data: {
        user: {
          id: "VXNlcjox",
          name: "John Doe"
        },
        photo: {
          id: "UGhvdG86MQ==",
          width: 300
        },
        post: {
          id: "UG9zdDox",
          text: "lorem"
        }
      }
    });
  });
});
