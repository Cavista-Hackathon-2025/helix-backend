import model, { prescriptionSchedulingPromt, symptomPromptGenerator } from "./model.js"

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
      {
        role: "user",
        content: files.map(file => {
          return ({
            type: "image",
            source: {
              type: "base64",
              media_type: "image/webp",
              data: file
            }
          })
        })
      }
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

export async function performPresriptionScheduling({ data, file, date }) {
  //Generate the prompt ensure the data has the medication data
  const promptData = prescriptionSchedulingPromt({ ...data })
  let messages = []
  if (file) {
    messages = [
      {
        role: "user",
        content: promptData
      },
      {
        role: "user",
        content: [{
          type: "image",
          source: {
            type: "base64",
            media_type: "image/webp",
            data: file
          }
        }]
      }
    ]
  } else {
    messages = [
      {
        content: promptData,
        role: "user"
      }
    ]
  }


  const response = await model.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8192,
    temperature: 1,
    system: `You are an AI medical prescription scheduling system. you will recieve the details of the prescription either as text or image or as both. since you are part of a system your response is purely in json your response will have a key called result which is an array of objects and each object containing three keys drugName, ics(Generated content that shud be on an ICS file that automatically adds he reminders on the calendar, frequency,dates(an array of dates so we can render it on our calendar). and another key called combinedICS which will do as the name is a singular ICS data that i can send to the user. set the Organizer of the combinedICS to be "Helix AI" make sure the response you are giving are not before ${date}. if no schedule comes during or after ${date} throw an error that the prescription is too old. if you encounter any error resond with a singular string key called err referring to the details of your error`,
    messages,
  })

  if (response.stop_reason == "end_turn") {
    const data = JSON.parse(response.content[0].text)
    console.log(data)
    return data
  } else {
    return {
      err: "Unable to complete diagnosis, please try again"
    }
  }

}