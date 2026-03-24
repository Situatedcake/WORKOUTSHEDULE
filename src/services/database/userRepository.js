import { DATABASE_CONFIG } from "./databaseConfig";
import { USER_STORAGE_METHODS } from "./databaseContracts";
import { apiUserStorage } from "./apiUserStorage";
import { mockUserStorage } from "./mockUserStorage";

const storageProviders = {
  api: apiUserStorage,
  mock: mockUserStorage,
};

function getActiveStorage() {
  return storageProviders[DATABASE_CONFIG.provider] ?? mockUserStorage;
}

function assertStorageContract(storage) {
  USER_STORAGE_METHODS.forEach((methodName) => {
    if (typeof storage[methodName] !== "function") {
      throw new Error(`Storage provider is missing method: ${methodName}`);
    }
  });

  return storage;
}

export const userRepository = assertStorageContract(getActiveStorage());
