-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'Credentials',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT,
    "dob" TIMESTAMP(3),
    "age" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalInfo" (
    "id" BIGSERIAL NOT NULL,
    "weight" INTEGER,
    "height" INTEGER,
    "blood_pressure" TEXT,
    "alergies" TEXT[],
    "history" TEXT[],
    "userId" BIGINT NOT NULL,

    CONSTRAINT "MedicalInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescriptions" (
    "id" BIGSERIAL NOT NULL,
    "drugName" TEXT NOT NULL,
    "dates" TIMESTAMP(3)[],
    "frequency" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,

    CONSTRAINT "Prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymptomAnalysis" (
    "id" BIGSERIAL NOT NULL,
    "diets" JSONB NOT NULL,
    "advice" JSONB NOT NULL,
    "response" TEXT NOT NULL,

    CONSTRAINT "SymptomAnalysis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MedicalInfo" ADD CONSTRAINT "MedicalInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescriptions" ADD CONSTRAINT "Prescriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
