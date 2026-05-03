import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma", // Caminho do schema
  migrations: {
    path: "prisma/migrations",    // Onde ficam as migrações
  },
  datasource: {
    url: env("DATABASE_URL"),     // Carrega a URL do banco
  },
});