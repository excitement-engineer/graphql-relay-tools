import { StarWarsSchema } from "../starWarsSchema";
import { graphql } from "graphql";

describe("Star Wars mutations", () => {
  it("mutates the data set", async () => {
    const mutation = `
      mutation AddBWingQuery($input: IntroduceShipInput!) {
        introduceShip(input: $input) {
          ship {
            id
            name
          }
          faction {
            name
          }
          clientMutationId
        }
      }
    `;
    const params = {
      input: {
        shipName: "B-Wing",
        factionId: "1",
        clientMutationId: "abcde"
      }
    };
    const expected = {
      introduceShip: {
        ship: {
          id: "U2hpcDo5",
          name: "B-Wing"
        },
        faction: {
          name: "Alliance to Restore the Republic"
        },
        clientMutationId: "abcde"
      }
    };
    const result = await graphql(StarWarsSchema, mutation, null, null, params);
    expect(result).toEqual({ data: expected });
  });
});
