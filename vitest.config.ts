import { defineConfig } from 'vitest/config';
export default defineConfig({test:{include:['tests/**/*.test.ts'],fileParallelism:false,env:{ENCRYPTION_KEY:'test-encryption-key-not-for-production-123456',ADMIN_TOKEN:'test-admin-token-not-for-production-123456',DATABASE_URL:'file:../data/test.db',APP_URL:'http://localhost:3000'}}});
