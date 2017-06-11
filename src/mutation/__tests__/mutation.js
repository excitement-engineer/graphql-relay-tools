// @flow

import { makeExecutableSchema } from "graphql-tools";
import { graphql } from "graphql";

import { mutationWithClientMutationId } from "../";

const simpleMutation = mutationWithClientMutationId({
  name: "SimpleMutation",
  outputFields: `
    result: Int
  `,
  mutateAndGetPayload: () => ({ result: 1 })
});

const simpleMutationWithInput = mutationWithClientMutationId({
  name: "SimpleMutationWithInput",
  inputFields: `
    input: Int
  `,
  outputFields: `
    output: Int
  `,
  mutateAndGetPayload: ({ input }) => ({ output: input })
});

const simplePromiseMutation = mutationWithClientMutationId({
  name: "SimplePromiseMutation",
  outputFields: `
    result: Int
  `,
  mutateAndGetPayload: () => Promise.resolve({ result: 1 })
});

const simpleContextMutation = mutationWithClientMutationId({
  name: "SimpleContextMutation",
  outputFields: `
    result: Int
  `,
  mutateAndGetPayload: (params, context) => context
});

const simpleRootValueMutation = mutationWithClientMutationId({
  name: "SimpleRootValueMutation",
  outputFields: `
    result: Int
  `,
  mutateAndGetPayload: (params, context, { rootValue }) => rootValue
});

const schemaDef = `
  type Query {
    query: String
  }
  
  type Mutation {
    simpleMutation${simpleMutation.mutationField}
    simpleMutationWithInput${simpleMutationWithInput.mutationField}
    simplePromiseMutation${simplePromiseMutation.mutationField}
    simpleContextMutation${simpleContextMutation.mutationField}
    simpleRootValueMutation${simpleRootValueMutation.mutationField}
  }
`;
const schema = makeExecutableSchema({
  typeDefs: [
    schemaDef,
    simpleMutation.inputType,
    simpleMutation.outputType,
    simpleMutationWithInput.inputType,
    simpleMutationWithInput.outputType,
    simplePromiseMutation.inputType,
    simplePromiseMutation.outputType,
    simpleContextMutation.inputType,
    simpleContextMutation.outputType,
    simpleRootValueMutation.inputType,
    simpleRootValueMutation.outputType
  ],
  resolvers: {
    Mutation: {
      simpleMutation: simpleMutation.mutationResolver,
      simpleMutationWithInput: simpleMutationWithInput.mutationResolver,
      simplePromiseMutation: simplePromiseMutation.mutationResolver,
      simpleContextMutation: simpleContextMutation.mutationResolver,
      simpleRootValueMutation: simpleRootValueMutation.mutationResolver
    }
  }
});

describe("mutationWithClientMutationId()", () => {
  it("requires an argument", async () => {
    const query = `
        mutation M {
          simpleMutation {
            result
          }
        }
      `;
    expect(await graphql(schema, query)).toMatchSnapshot();
  });

  it("returns the same client mutation ID", async () => {
    const query = `
      mutation M {
        simpleMutation(input: {clientMutationId: "abc"}) {
          result
          clientMutationId
        }
      }
    `;

    expect(await graphql(schema, query)).toEqual({
      data: {
        simpleMutation: {
          result: 1,
          clientMutationId: "abc"
        }
      }
    });
  });

  it("supports mutation with input", async () => {
    const query = `
      mutation M {
        simpleMutationWithInput(input: {input: 5}) {
          output
        }
      }
      `;

    expect(await graphql(schema, query)).toEqual({
      data: {
        simpleMutationWithInput: {
          output: 5
        }
      }
    });
  });

  it("supports promise mutations", async () => {
    const query = `
      mutation M {
        simplePromiseMutation(input: {clientMutationId: "abc"}) {
          result
          clientMutationId
        }
      }
    `;

    expect(await graphql(schema, query)).toEqual({
      data: {
        simplePromiseMutation: {
          result: 1,
          clientMutationId: "abc"
        }
      }
    });
  });

  it("can access context", async () => {
    const query = `
      mutation M {
        simpleContextMutation(input: {clientMutationId: "abc"}) {
          result
          clientMutationId
        }
      }
    `;

    expect(await graphql(schema, query, null, { result: 2 })).toEqual({
      data: {
        simpleContextMutation: {
          result: 2,
          clientMutationId: "abc"
        }
      }
    });
  });

  it("can access rootValue", async () => {
    const query = `
      mutation M {
        simpleRootValueMutation(input: {clientMutationId: "abc"}) {
          result
          clientMutationId
        }
      }
    `;

    expect(await graphql(schema, query, { result: 1 })).toEqual({
      data: {
        simpleRootValueMutation: {
          result: 1,
          clientMutationId: "abc"
        }
      }
    });
  });

  describe("introspection", () => {
    it("contains correct input", async () => {
      const query = `{
        __type(name: "SimpleMutationInput") {
          name
          kind
          inputFields {
            name
            type {
              name
              kind
            }
          }
        }
      }`;

      expect(await graphql(schema, query)).toEqual({
        data: {
          __type: {
            name: "SimpleMutationInput",
            kind: "INPUT_OBJECT",
            inputFields: [
              {
                name: "clientMutationId",
                type: {
                  name: "String",
                  kind: "SCALAR"
                }
              }
            ]
          }
        }
      });
    });

    it("contains correct payload", async () => {
      const query = `{
        __type(name: "SimpleMutationPayload") {
          name
          kind
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }`;

      expect(await graphql(schema, query)).toEqual({
        data: {
          __type: {
            name: "SimpleMutationPayload",
            kind: "OBJECT",
            fields: [
              {
                name: "result",
                type: {
                  name: "Int",
                  kind: "SCALAR"
                }
              },
              {
                name: "clientMutationId",
                type: {
                  name: "String",
                  kind: "SCALAR"
                }
              }
            ]
          }
        }
      });
    });
  });
});
