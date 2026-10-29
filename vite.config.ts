export default defineConfig({
  base: '/jsrevision/',
  // Pre-bundle Radix dialog so a late dev re-optimization can't load a second React copy.
  vite: { optimizeDeps: { include: ["@radix-ui/react-dialog"] } },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our Sentry wrapper).
    server: { entry: "server" },
  },
});
