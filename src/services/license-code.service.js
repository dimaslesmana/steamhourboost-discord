const { prisma } = require('./prisma.service');
const { logger } = require('../utils/logger');

class LicenseCode {
  static async insert(codes, licenseType) {
    try {
      await prisma.$transaction(
        codes.map((code) => (
          prisma.licenseCodes.create({
            data: {
              code,
              licenseType: {
                connect: { id: licenseType },
              },
            },
          })
        )),
      );
    } catch (error) {
      logger.error(error);
      throw new Error('Failed to insert new license code to database');
    }
  }

  static async getCode(licenseCode) {
    try {
      return await prisma.licenseCodes.findFirst({
        where: {
          code: licenseCode,
        },
        include: {
          licenseType: true,
        },
      });
    } catch (error) {
      logger.error(error);
      throw new Error('Failed to get license code from database');
    }
  }

  static async getCodeById(licenseCodeId) {
    try {
      return await prisma.licenseCodes.findFirst({
        where: {
          id: licenseCodeId,
        },
        include: {
          licenseType: true,
        },
      });
    } catch (error) {
      logger.error(error);
      throw new Error('Failed to get license code from database');
    }
  }

  static async updateCodeStatus(licenseCode, status) {
    try {
      return await prisma.licenseCodes.update({
        where: { code: licenseCode },
        data: { isUsed: status },
      });
    } catch (error) {
      logger.error(error);
      throw new Error('Failed to update license code status in database');
    }
  }
}

module.exports = LicenseCode;
