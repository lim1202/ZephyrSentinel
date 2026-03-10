export {
  type IStorage,
  type State,
  type TargetState,
  createEmptyState,
  createTargetState,
} from "./base.js";

export {
  GitStorage,
  LocalStorage,
  createStorage,
} from "./git.storage.js";
