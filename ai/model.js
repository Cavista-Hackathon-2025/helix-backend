import Anthropic from "@anthropic-ai/sdk";
export default new Anthropic({
  // defaults to process.env["ANTHROPIC_API_KEY"]
  apiKey: process.env.ANTHROPIC_KEY,
});

export function symptomPromptGenerator(data) {
  return `
    Input: ${JSON.stringify(data)}
Successful Output format: title(a suitable title), diets(an array of suggested diet each diet suggestions will have two keys name and reason), advice(Same for diets), response(a very much detailed HTML response styled with tailwindcss

Errored Output Format: err: the details of the error.The type of errors n  General Input errors, User inputing value not each field not  strict

NOTE: Your response must be very very detailed. and catching of errors must be script 

  `
}


