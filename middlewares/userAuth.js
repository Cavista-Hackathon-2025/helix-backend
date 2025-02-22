import { prisma } from "../prisma/client.js"
import jwt from "jsonwebtoken"

export default async function UserAuth(req, res, next) {
  const headers = req.headers
  const { token } = headers
  if (!token) {
    return res.status(401).json({ err: "Unauthorized" })
  }

  const data = jwt.verify(token, process.env.JWT_SECRET)
  const user = await prisma.user.findUnique({
    where: {
      id: data.id
    },
    include: {
      medicalInfos: true
    }
  })
  if (!user) {
    return res.status(401).json({ err: "Unauthorized" })
  }
  res.locals.user = user;
  next()
}