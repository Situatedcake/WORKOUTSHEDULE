import { DATABASE_CONFIG } from "./databaseConfig";
import { USER_STORAGE_METHODS } from "./databaseContracts";

const apiStorageLoader = async () => {
  const module = await import("./apiUserStorage");
  return module.apiUserStorage;
};

const mockStorageLoader = import.meta.env.PROD
  ? async () => {
      throw new Error(
        "Mock storage is disabled in production build. Switch provider to api.",
      );
    }
  : async () => {
      const module = await import("./mockUserStorage");
      return module.mockUserStorage;
    };

const storageLoaders = {
  api: apiStorageLoader,
  mock: mockStorageLoader,
};

let activeStoragePromise = null;

function assertStorageContract(storage) {
  USER_STORAGE_METHODS.forEach((methodName) => {
    if (typeof storage[methodName] !== "function") {
      throw new Error(`Storage provider is missing method: ${methodName}`);
    }
  });

  return storage;
}

async function getActiveStorage() {
  if (!activeStoragePromise) {
    const loadStorage =
      storageLoaders[DATABASE_CONFIG.provider] ?? storageLoaders.mock;

    activeStoragePromise = loadStorage().then(assertStorageContract);
  }

  return activeStoragePromise;
}

export const userRepository = Object.fromEntries(
  USER_STORAGE_METHODS.map((methodName) => [
    methodName,
    async (...args) => {
      const storage = await getActiveStorage();
      return storage[methodName](...args);
    },
  ]),
);
