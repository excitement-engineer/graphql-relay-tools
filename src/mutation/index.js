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

type MutationConfig = {
  name: string,
  inputFields?: string,
  outputFields?: string,
  mutateAndGetPayload: mutationFn
};

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
