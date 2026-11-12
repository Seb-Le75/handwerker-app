if (process.env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
  throw new Error("Database seeds are disabled in production.");
}

console.log("Phase 0 has no domain seed data. Phase 1 will add isolated demo tenants.");
