-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('MANAGER', 'FIELD_ENGINEER', 'REVIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('PROCTOR', 'SAND_CONE');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT', 'COMPLETED', 'APPROVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'VIEWER',
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "type" "TestType" NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "location" TEXT,
    "notes" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctorData" (
    "id" TEXT NOT NULL,
    "cylinderMass" DOUBLE PRECISION NOT NULL,
    "soilCylinderMass" DOUBLE PRECISION NOT NULL,
    "cylinderVolume" DOUBLE PRECISION NOT NULL,
    "wetSoil" DOUBLE PRECISION NOT NULL,
    "drySoil" DOUBLE PRECISION NOT NULL,
    "tare" DOUBLE PRECISION NOT NULL,
    "moisturePercentage" DOUBLE PRECISION NOT NULL,
    "dryDensity" DOUBLE PRECISION NOT NULL,
    "optimalMoisture" DOUBLE PRECISION,
    "testId" TEXT NOT NULL,

    CONSTRAINT "ProctorData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SandConeData" (
    "id" TEXT NOT NULL,
    "jarInitialMass" DOUBLE PRECISION NOT NULL,
    "jarFinalMass" DOUBLE PRECISION NOT NULL,
    "sandDensity" DOUBLE PRECISION NOT NULL,
    "sandConeMass" DOUBLE PRECISION NOT NULL,
    "extractedSoil" DOUBLE PRECISION NOT NULL,
    "wetSoil" DOUBLE PRECISION NOT NULL,
    "drySoil" DOUBLE PRECISION NOT NULL,
    "tare" DOUBLE PRECISION NOT NULL,
    "moisturePercentage" DOUBLE PRECISION NOT NULL,
    "holeDensity" DOUBLE PRECISION NOT NULL,
    "dryDensity" DOUBLE PRECISION NOT NULL,
    "testId" TEXT NOT NULL,

    CONSTRAINT "SandConeData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_userId_groupId_key" ON "GroupMember"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ProctorData_testId_key" ON "ProctorData"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "SandConeData_testId_key" ON "SandConeData"("testId");

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctorData" ADD CONSTRAINT "ProctorData_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SandConeData" ADD CONSTRAINT "SandConeData_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;
