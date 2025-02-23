import { Router } from "express"
import { register, login, setMedicals, getUserDetails, getAIAnalysis, getAIPrescriptionSchedule, fetchDiagnosisHistory } from "../controllers/userController.js"
import UserAuth from "../middlewares/userAuth.js"
const router = Router()

router.get("/", [UserAuth, getUserDetails])
router.post("/register", register)
router.post("/login", login)
router.patch("/medicals", [UserAuth, setMedicals])
router.post("/symptom-analysis", [UserAuth, getAIAnalysis])
router.post("/prescription-scheduling", [UserAuth, getAIPrescriptionSchedule])
router.get("/diagnosis", [UserAuth, fetchDiagnosisHistory])

export default router