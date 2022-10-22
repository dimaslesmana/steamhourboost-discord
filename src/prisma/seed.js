const { PrismaClient } = require('@prisma/client');
const environments = require('../environments');
const { LicenseType } = require('../types');
const prisma = new PrismaClient();

const exampleDiscordId = environments.DISCORD_ADMIN_ID;
const exampleLicenseCode = 'AB3D-EF7H-9JKL-MNOP';

async function seedLicenseType() {
  const licenseTypeData = [
    { id: LicenseType.Free, name: 'Free' },
    { id: LicenseType.Premium, name: 'Premium' },
  ];

  for (const licenseType of licenseTypeData) {
    await prisma.licenseType.upsert({
      where: { id: licenseType.id },
      update: licenseType,
      create: licenseType,
    });
  }
}

async function seedLicenseCode() {
  await prisma.licenseCodes.upsert({
    where: { code: exampleLicenseCode },
    update: { code: exampleLicenseCode, licenseTypeId: LicenseType.Free },
    create: { code: exampleLicenseCode, licenseTypeId: LicenseType.Free },
  });
}

async function seedDiscordAccount() {
  await prisma.discordAccounts.upsert({
    where: { discordId: exampleDiscordId },
    update: {},
    create: {
      discordId: exampleDiscordId,
      licenseCode: {
        connect: { code: exampleLicenseCode },
      },
    },
  });

  // Update license status after being used by a user
  await prisma.licenseCodes.update({
    where: { code: exampleLicenseCode },
    data: {
      isUsed: true,
    },
  });
}

async function main() {
  await seedLicenseType();
  await seedLicenseCode();
  // await seedDiscordAccount();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
