export default function ErrorHandler(error, req, res, next) {
  console.log(error)
  res.status(500).json({ err: "An error occured, please try again" })
}