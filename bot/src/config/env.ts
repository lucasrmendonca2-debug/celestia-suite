import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DISCORD_TOKEN: z.string().min(10),
  DISCORD_CLIENT_ID: z.string().min(5),
  DISCORD_DEV_GUILD_ID: z.string().optional().or(z.literal("")),
  BOT_OWNER_ID: z.string().optional().or(z.literal("")),
  MONGO_URI: z.string().min(10),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  BRAND_NAME: z.string().default("Zenox"),
  BRAND_COLOR: z.string().default("0x7C3AED"),
  APP_URL: z
    .string()
    .url()
    .default("https://id-preview--e9bcc241-1f95-42ca-967d-43c879373224.lovable.app"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const BRAND = {
  name: env.BRAND_NAME,
  color: Number(env.BRAND_COLOR),
  footer: `${env.BRAND_NAME} • bot multifuncional`,
};
