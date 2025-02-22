import model, { symptomPromptGenerator } from "./model.js"

export async function performSymptopChecknalysis({ user, data, files }) {
  //Generate the prompt ensure the data has the medication data
  const promptData = symptomPromptGenerator({ ...data, user })
  let messages = [
    {
      content: promptData,
      role: "user"
    }
  ]
  if (files && files.length > 0) {
    messages = [
      {
        role: "user",
        content: promptData
      },
      ...files.map(file => ({
        role: "user",
        type: "image",
        image: {
          data: file.data,
          media_type: file.type
        }
      }))
    ]
  }

  console.log({ messages })

  const response = await model.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8192,
    temperature: 1,
    system: "You are an AI Medical assistant whose response is only JSON. you will be provided the input data and you will output a detailed output in JSON. you will be provided the outpuut structure you are to use and follow that structure duly. The input data must structly be health related. your tone should match that of a doctor and let your response be personalized. you might be provided an image that will provide more info",
    messages,

  })
  console.log(response);

  if (response.stop_reason == "end_turn") {
    const data = JSON.parse(response.content[0].text)
    return data
  } else {
    return {
      err: "Unable to complete diagnosis, please try again"
    }
  }
}