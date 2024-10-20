import { PrismaClient } from '@prisma/client';

export default class DBService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createSecureFile(
    hashedPassCode: string,
    sharedKey: string,
    fileId: string
  ) {
    return await this.prisma.securefile.create({
      data: {
        hashedPassCode,
        sharedKey,
        fileId,
      },
    });
  }

  async getSecureFile(sharedKey: string) {
    return await this.prisma.securefile.findUnique({
      where: {
        sharedKey,
      },
    });
  }

  async getAllFiles() {
    return await this.prisma.securefile.findMany();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}
