
import { hash, compare } from "bcrypt"
import { prisma } from "../prisma/client.js"
import jwt from "jsonwebtoken"
import { sendEmail } from "../utils/mailer.js"
import path from "path"
import { performPresriptionScheduling, performSymptopChecknalysis } from "../ai/function.js"
import sharp from "sharp"
import fs from "fs/promises"

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
    const prompt = JSON.parse(req.body.prompt)
    const data = await performSymptopChecknalysis({ data: { ...prompt, user }, files })
    if (data.err) {
      return res.status(400).json({ err: data.err })
    }
    const analysis = await prisma.symptomAnalysis.create({
      data: {
        userId: user.id,
        advice: data.advice,
        diets: data.diets,
        response: data.response,
        title: data.title,
        symptoms: data.symptoms,
        severity: data.severity
      }
    })
    res.json({ data: analysis });
  } catch (error) {
    next(error)
  }
}

export const getAIPrescriptionSchedule = async (req, res, next) => {
  try {
    const { user } = res.locals
    let imageBase64 = null
    if (req.files?.image) {
      const imageBuffer = req.files.image.data
      const webpBuffer = await sharp(imageBuffer)
        .webp()
        .toBuffer()
      imageBase64 = webpBuffer.toString('base64')
    }
    const prescription = req.body.prescriptions ? JSON.parse(req.body.prescriptions) : "Check the attached image"
    const response = await performPresriptionScheduling({ data: { prescription, user }, file: imageBase64, date: new Date().toDateString() })
    if (response.err) {
      return res.status(400).json({ err: response.err })
    }
    await prisma.prescriptions.createMany({
      data: response.result.map(item => ({
        drugName: item.drugName,
        frequency: item.frequency,
        dates: item.dates.map(d => new Date(d)),
        ics: item.ics,
        userId: user.id
      }))
    })
    const icsFileContent = response.combinedICS;
    const tempFilePath = `/tmp/prescription_${Date.now()}.ics`;
    await fs.writeFile(tempFilePath, icsFileContent);

    await sendEmail({
      to: user.email,
      subject: 'Your Prescription Schedule',
      template: './templates/prescriptionSchedule.ejs',
      data: { name: user.name },
      attachments: [{
        filename: 'prescription_schedule.ics',
        path: tempFilePath
      }]
    });

    await fs.unlink(tempFilePath);
    res.json({ message: 'Prescription schedule sent successfully' });
  } catch (error) {
    next(error)
  }
}

export const fetchDiagnosisHistory = async (req, res, next) => {
  try {
    const { user } = res.locals
    console.log(user)

    const page = parseInt(req.query.page) || 1
    const perPage = 3
    const skip = (page - 1) * perPage

    const [diagnosisHistory, total] = await Promise.all([
      prisma.symptomAnalysis.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: perPage,
        skip: skip,
        select: {
          title: true,
          id: true,
          symptoms: true,
          severity: true,
          createdAt: true,
        }
      }),
      prisma.symptomAnalysis.count({
        where: {
          userId: user.id
        }
      })
    ])

    const totalPages = Math.ceil(total / perPage)


    res.json({
      diagnosisHistory,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        hasMore: page < totalPages
      }
    })
  } catch (error) {
    next(error)
  }
}