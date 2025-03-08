import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { generateImage } from "../functions/generateImage/resource";
import { getNews } from "../functions/getNews/resource";
import { readKnowledgebase } from "../functions/readKnowledgebase/resource";
console.log("resource.ts")
const schema = a.schema({
  Story: a
    .model({
      title: a.string().required(),
      story: a.string().required(),
    })
    .authorization((allow) => [allow.authenticated()]),
  chat: a
    .conversation({
      aiModel: a.ai.model("Claude 3 Haiku"),
      systemPrompt:
        "You are a vacation finder. You will assist " +
        "the user in finding a vacatiom that matches the story string, " +
        "title string or id.",

      tools: [
        a.ai.dataTool({
          name: "listStories",
          description:
            "This lists all stories from the Story model. " +
            "Use it to find stories with the story field " +
            "and display them to user.",
          model: a.ref("Story"),
          modelOperation: "list",
        }),
        a.ai.dataTool({
          name: "getNews",
          description:
            "Help generate a story prompt using " +
            "the current news.  User will provide a category",
          query: a.ref("getNews"),
        }),
        a.ai.dataTool({
          name: "readKnowledgebase",
          description:
            "Help generate a vacation prompt using " +
            "when user asks about an existing vacation",
          query: a.ref("readKnowledgebase"),
        }),
      ],
    })
    .authorization((allow) => allow.owner()),
  summarizer: a
    .generation({
      aiModel: a.ai.model("Claude 3 Haiku"),
      systemPrompt:
        "You are a helpful assistant that summarizes vacations. " +
        "Give a concise summary of the supplied vacation. " +
        "The summary should be one or two sentences long",
      inferenceConfiguration: {
        temperature: 0.7,
        topP: 1,
        maxTokens: 400,
      },
    })
    .arguments({
      story: a.string(),
    })
    .returns(
      a.customType({
        summary: a.string(),
      })
    )
    .authorization((allow) => [allow.authenticated()]),
  generateStory: a
    .generation({
      aiModel: a.ai.model("Claude 3 Haiku"),
      systemPrompt:
        "Generate a vacation itinerary based on the users interests and a title that's fun and exciting, " +
        " The story should be a " +
        "fun but detailed vacation itinerary. The title should be interesting and " +
        "short with date of travel and destination. If no date is spceified just use the users name and destination in the title",
    })
    .arguments({
      description: a.string(),
    })
    .returns(
      a.customType({
        story: a.string().required(),
        title: a.string().required(),
      })
    )
    .authorization((allow) => allow.authenticated()),
  generateImage: a
    .query()
    .arguments({
      prompt: a.string(),
    })
    .returns(a.string().array())
    .handler(a.handler.function(generateImage))
    .authorization((allow) => [allow.authenticated()]),
  getNews: a
    .query()
    .arguments({
      category: a.string(),
    })
    .returns(
      a.customType({
        title: a.string(),
        description: a.string(),
      })
    )
    .authorization((allow) => allow.authenticated())
    .handler(a.handler.function(getNews)),
  //knowledgeBase: a
  //  .query()
  //  .arguments({ input: a.string() })
  //  .handler(
  //    a.handler.custom({
  //      dataSource: "KnowledgeBaseDataSource",
  //      entry: "./kbResolver.js",
  //    })
   // )
   // .returns(a.string())
   // .authorization((allow) => [allow.authenticated()]),
  readKnowledgebase: a
    .query()
    .arguments({
       prompt: a.string(),
    })
    .returns(
      a.customType({
        resultText: a.string()
      })
    )
    .handler(a.handler.function(readKnowledgebase))
    .authorization((allow) => [allow.authenticated()]),
});
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});