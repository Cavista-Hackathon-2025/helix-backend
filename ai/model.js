import Anthropic from "@anthropic-ai/sdk";
export default new Anthropic({
  // defaults to process.env["ANTHROPIC_API_KEY"]
  apiKey: process.env.ANTHROPIC_KEY,
});

export function symptomPromptGenerator(data) {
  return `
    Input: ${JSON.stringify(data)}
Successful Output format: title(a suitable title), diets(an array of suggested diet each diet suggestions will have two keys name and reason), advice(Same for diets), response(a very much detailed HTML response styled with tailwindcss), symptoms(an array of symptoms), serverity:(a number between 1-3 where 1 is mild and 3 is severe),

Errored Output Format: err: the details of the error.The type of errors includes: General Input errors, User inputing value not each field not  strict

NOTE: Your response must be very very detailed. and catching of errors must be script 

  `
}

export function prescriptionSchedulingPromt(data) {
  return `Data: ${JSON.stringify(data)}`
}


