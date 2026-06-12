const fs = require("fs");
const path = require("path");

async function main() {
  process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const { createEmptyStore } = require("../src/store-shared");
  const { ensurePrismaStoreSchema } = require("../src/prisma-bootstrap");

  const storePath = path.join(__dirname, "..", "data", "store.json");
  const raw = fs.existsSync(storePath) ? fs.readFileSync(storePath, "utf8") : "{}";
  const store = { ...createEmptyStore(), ...JSON.parse(raw || "{}") };
  const empty = createEmptyStore();
  const collectionKeys = Object.keys(empty).filter((key) => key !== "users");

  try {
    await ensurePrismaStoreSchema(prisma);

    for (const user of store.users || []) {
      await prisma.internalUser.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          role: user.role,
          passwordHash: user.passwordHash,
          isActive: user.isActive !== false,
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          passwordHash: user.passwordHash,
          isActive: user.isActive !== false,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
        }
      });
    }

    for (const key of collectionKeys) {
      await prisma.storeCollection.upsert({
        where: { key },
        update: { payload: JSON.stringify(store[key] || []) },
        create: { key, payload: JSON.stringify(store[key] || []) }
      });
    }

    console.log("JSON store migrated to Prisma successfully.");
    console.log(JSON.stringify({
      users: (store.users || []).length,
      collections: collectionKeys.length
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("JSON -> Prisma migration failed.");
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
