import "./lib/env";
import { ensureCommunitySeed } from "./lib/seedCommunity";
import { ensureContentSeed } from "./lib/seedContent";

async function main(): Promise<void> {
  await Promise.all([ensureCommunitySeed(), ensureContentSeed()]);
}

main().then(
  () => {
    console.log("Seed complete");
    process.exit(0);
  },
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
