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

type mutationFn = (
  object: any,
  ctx: any,
  info: GraphQLResolveInfo
) => Promise<any> | any;

/**
 * A description of a mutation consumable by mutationWithClientMutationId
 * to create a MutationDefinition 
 *
 * The inputFields and outputFields should not include `clientMutationId: String`,
 * as this will be provided automatically.
 *
 * An input object will be created containing the input fields, and an
 * object will be created containing the output fields.
 *
 * mutateAndGetPayload will receieve an Object with a key for each
 * input field, and it should return an Object with a key for each
 * output field. It may return synchronously, or return a Promise.
 */
type MutationConfig = {
  name: string,
  inputFields?: string,
  outputFields?: string,
  mutateAndGetPayload: mutationFn
};

/**
 * The definition of the mutation created by mutationWithClientMutationId.
 *
 * The mutationType is the graphQL language type definition 
 * of the input and payload of the mutation.
 *
 * The mutationField contains the arguments and the return type 
 * of the mutation. This should be inserted next to the mutation 
 * name in the root Mutation type.
 *
 * The mutationResolver is the resolver responsible for performing
 * the actual mutation.
 */
type MutationDefinition = {
  mutationType: string,
  mutationField: string,
  mutationResolver: GraphQLFieldResolver<any, any>
};

const mutationWithClientMutationId = (
  config: MutationConfig
): MutationDefinition => {
  const { name, inputFields, outputFields, mutateAndGetPayload } = config;

  const mutationType = `
    input ${name}Input {
      ${inputFields ? inputFields : ""}
      clientMutationId: String
    }
    type ${name}Payload {
      ${outputFields ? outputFields : ""}
      clientMutationId: String
    }
  `;

  const mutationField = `(input: ${name}Input!): ${name}Payload`;

  const mutationResolver = (_, { input }, context, info) => {
    return Promise.resolve(
      mutateAndGetPayload(input, context, info)
    ).then(payload => {
      payload.clientMutationId = input.clientMutationId;
      return payload;
    });
  };

  return { mutationType, mutationField, mutationResolver };
};

export { mutationWithClientMutationId };
