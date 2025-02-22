export default function ErrorHandler(error, req, res, next) {
  console.log(error)
  res.json({ err: "An error occured, please try again" })
}