const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const {
  createEmptyStore,
  ensureDefaultUsers
} = require("../src/store-shared");
const { ensurePrismaStoreSchema } = require("../src/prisma-bootstrap");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const prisma = new PrismaClient();

async function loadPrismaStore() {
  const store = createEmptyStore();
  const collections = await prisma.storeCollection.findMany();
  const byKey = new Map(collections.map((entry) => {
    let payload = [];
    try {
      payload = JSON.parse(entry.payload || "[]");
    } catch (error) {
      payload = [];
    }
    return [entry.key, payload];
  }));

  Object.keys(store).forEach((key) => {
    if (key === "users") return;
    store[key] = byKey.get(key) || [];
  });

  store.users = (await prisma.internalUser.findMany({ orderBy: { createdAt: "asc" } })).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    passwordHash: user.passwordHash,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }));

  const changed = ensureDefaultUsers(store);
  if (changed) {
    await savePrismaStore(store);
  }
  return store;
}

async function savePrismaStore(storeInput) {
  const store = createEmptyStore();
  Object.assign(store, storeInput || {});
  ensureDefaultUsers(store);
  const keys = Object.keys(store).filter((key) => key !== "users");

  await prisma.$transaction(async (tx) => {
    await tx.internalUser.deleteMany();
    if (store.users.length) {
      await tx.internalUser.createMany({
        data: store.users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          passwordHash: user.passwordHash,
          isActive: user.isActive !== false,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
        }))
      });
    }

    for (const key of keys) {
      await tx.storeCollection.upsert({
        where: { key },
        update: { payload: JSON.stringify(store[key] || []) },
        create: { key, payload: JSON.stringify(store[key] || []) }
      });
    }
  });
}

async function main() {
  const command = process.argv[2];
  if (!command) {
    throw new Error("Bridge command is required.");
  }

  await ensurePrismaStoreSchema(prisma);

  if (command === "load") {
    const store = await loadPrismaStore();
    process.stdout.write(JSON.stringify(store));
    return;
  }

  if (command === "save") {
    const filePath = process.argv[3];
    if (!filePath) {
      throw new Error("Save requires a JSON file path.");
    }
    const payload = JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
    await savePrismaStore(payload);
    process.stdout.write("ok");
    return;
  }

  if (command === "reset") {
    const store = createEmptyStore();
    ensureDefaultUsers(store);
    await savePrismaStore(store);
    process.stdout.write("ok");
    return;
  }

  throw new Error(`Unsupported bridge command: ${command}`);
}

main()
  .catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
