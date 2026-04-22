import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const accommodations = await prisma.accommodation.findMany({
    select: {
      name: true,
      imageFileName: true,
    },
  });

  console.log(JSON.stringify(accommodations, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());