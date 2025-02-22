import { prisma } from "./prisma/client.js"
import express from "express"
import fileUpload from "express-fileupload"
import userRoutes from "./routes/users.js"
import errorHandler from "./middlewares/errorHandler.js"
import dotenv from "dotenv"

BigInt.prototype.toJSON = function () {
  return this.toString();
};

function bootApp() {
  const PORT = process.env.PORT || 3000
  const app = express()
  app.use(express.json())
  app.use(fileUpload())
  app.use(express.static("public"))
  dotenv.config()

  app.use("/user", userRoutes)

  app.use(errorHandler)

  app.listen(PORT, () => {
    console.log("Server is running on port", PORT)
  })

}
async function main() {
  await prisma.$connect()
  bootApp()
}

main()