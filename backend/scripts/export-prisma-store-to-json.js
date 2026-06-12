const fs = require("fs");
const path = require("path");

async function main() {
  process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const { createEmptyStore } = require("../src/store-shared");
  const { ensurePrismaStoreSchema } = require("../src/prisma-bootstrap");

  try {
    await ensurePrismaStoreSchema(prisma);

    const empty = createEmptyStore();
    const collectionKeys = Object.keys(empty).filter((key) => key !== "users");
    const [users, collections] = await Promise.all([
      prisma.internalUser.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.storeCollection.findMany()
    ]);
    const byKey = new Map(collections.map((entry) => {
      let payload = [];
      try {
        payload = JSON.parse(entry.payload || "[]");
      } catch (error) {
        payload = [];
      }
      return [entry.key, payload];
    }));

    const store = {
      ...empty,
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash: user.passwordHash,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }))
    };

    for (const key of collectionKeys) {
      store[key] = byKey.get(key) || [];
    }

    const storePath = path.join(__dirname, "..", "data", "store.json");
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));

    console.log("Prisma store exported back to JSON successfully.");
    console.log(JSON.stringify({
      users: store.users.length,
      collections: collectionKeys.length
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Prisma -> JSON export failed.");
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
