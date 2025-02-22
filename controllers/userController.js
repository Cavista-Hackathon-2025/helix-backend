
import { hash, compare } from "bcrypt"
import { prisma } from "../prisma/client.js"
import jwt from "jsonwebtoken"
import { sendEmail } from "../utils/mailer.js"
import path from "path"
import { performSymptopChecknalysis } from "../ai/function.js"

export const getUserDetails = (req, res, next) => {
  try {
    const user = res.locals.user
    return res.json(user)
  } catch (error) {
    next(error)
  }
}

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ err: "All fields are required" })
    }
    const formerUser = await prisma.user.findFirst({ where: { email } })
    if (formerUser) {
      return res.status(400).json({ err: "Sorry, This email has been taken" })
    }
    await sendEmail({
      to: email,
      subject: "Welcome to Helix",
      template: path.resolve("templates/welcome.ejs"),
      data: {
        name
      },
    })
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hash(password, 10),
        phone,
        medicalInfos: {
          create: {}
        }
      },
    })
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.json({ user, token })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ err: "All fields are required" })
    }
    const user = await prisma.user.findFirst({ where: { email } })
    if (!user) {
      return res.status(400).json({ err: "User does not exist" })
    }
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ err: "Invalid credentials" })
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.json({ user, token })
  } catch (error) {
    next(error)
  }
}

export const setMedicals = async (req, res, next) => {
  try {
    const user = res.locals.user
    const { weight, height, blood_pressure, alergies, history } = req.body
    console.log(req.body)
    await prisma.medicalInfo.updateMany({
      where: {
        userId: user.id
      },
      data: {
        weight,
        height,
        blood_pressure,
        alergies,
        history
      }
    })
    const updatedUser = await prisma.user.findUnique({
      where: {
        id: user.id
      }, include: {
        medicalInfos: true
      }
    })
    return res.json({ user: updatedUser })
  } catch (error) {
    next(error)
  }
}

export const getAIAnalysis = async (req, res, next) => {
  try {
    const { user } = res.locals
    let files = [];
    if (req.files) {
      if (Array.isArray(req.files.file)) {
        for (const file of req.files.file) {
          const imageBuffer = file.data;
          const webpBuffer = await sharp(imageBuffer)
            .webp()
            .toBuffer();
          files.push(webpBuffer.toString('base64'));
        }
      } else if (req.files.file) {
        const imageBuffer = req.files.file.data;
        const webpBuffer = await sharp(imageBuffer)
          .webp()
          .toBuffer();
        files.push(webpBuffer.toString('base64'));
      }
    }
    const data = await performSymptopChecknalysis({ data: { ...req.body, user }, files })
    await prisma.symptomAnalysis.create({
      data: {
        user: {
          connect: {
            id: user.id
          }
        },
        advice: data.advice,
        diets: data.diets,
        response: data.response,
        title: data.title
      }
    })
  } catch (error) {
    next(error)
  }
}