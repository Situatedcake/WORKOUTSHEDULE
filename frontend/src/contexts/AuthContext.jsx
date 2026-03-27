import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./authContextObject";
import {
  clearSessionUserId,
  getSessionUserId,
  setSessionUserId,
} from "../utils/authSession";
import { getTrainingLevelByScore } from "../utils/trainingLevel";
import { userRepository } from "../services/database/userRepository";

function validateCredentials({ name, password }) {
  const trimmedName = name.trim();
  const trimmedPassword = password.trim();

  if (trimmedName.length < 2) {
    throw new Error("Имя должно содержать минимум 2 символа.");
  }

  if (trimmedPassword.length < 4) {
    throw new Error("Пароль должен содержать минимум 4 символа.");
  }

  return {
    name: trimmedName,
    password: trimmedPassword,
  };
}

export function AuthProvider({ children }) {
  const [currentUserId, setCurrentUserId] = useState(() => getSessionUserId());
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  const refreshCurrentUser = useCallback(async () => {
    if (!currentUserId) {
      setCurrentUser(null);
      setAuthError("");
      return null;
    }

    try {
      const user = await userRepository.getById(currentUserId);

      if (!user) {
        clearSessionUserId();
        setCurrentUserId(null);
        setCurrentUser(null);
        setAuthError("");
        return null;
      }

      setCurrentUser(user);
      setAuthError("");
      return user;
    } catch (error) {
      setCurrentUser(null);
      setAuthError(
        error instanceof Error ? error.message : "Не удалось загрузить профиль.",
      );
      return null;
    }
  }, [currentUserId]);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      if (!currentUserId) {
        if (isMounted) {
          setCurrentUser(null);
          setAuthError("");
          setIsAuthReady(true);
        }
        return;
      }

      try {
        const user = await userRepository.getById(currentUserId);

        if (!isMounted) {
          return;
        }

        if (!user) {
          clearSessionUserId();
          setCurrentUserId(null);
          setCurrentUser(null);
          setAuthError("");
        } else {
          setCurrentUser(user);
          setAuthError("");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCurrentUser(null);
        setAuthError(
          error instanceof Error
            ? error.message
            : "Не удалось подключиться к серверу профиля.",
        );
      } finally {
        if (isMounted) {
          setIsAuthReady(true);
        }
      }
    }

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  const login = useCallback(async ({ name, password }) => {
    const credentials = validateCredentials({ name, password });
    const user = await userRepository.login(credentials);

    if (!user) {
      throw new Error("Неверное имя или пароль.");
    }

    setSessionUserId(user.id);
    setCurrentUserId(user.id);
    setCurrentUser(user);
    setAuthError("");

    return user;
  }, []);

  const register = useCallback(async ({ name, password }) => {
    const credentials = validateCredentials({ name, password });
    const user = await userRepository.register(credentials);

    setSessionUserId(user.id);
    setCurrentUserId(user.id);
    setCurrentUser(user);
    setAuthError("");

    return user;
  }, []);

  const logout = useCallback(() => {
    clearSessionUserId();
    setCurrentUserId(null);
    setCurrentUser(null);
    setAuthError("");
  }, []);

  const updateCurrentUserProfile = useCallback(
    async ({ name, email, password, profilePhoto }) => {
      if (!currentUserId) {
        return null;
      }

      const updatedUser = await userRepository.updateProfile(currentUserId, {
        name,
        email,
        password,
        profilePhoto,
      });

      if (updatedUser) {
        setCurrentUser(updatedUser);
        setAuthError("");
      }

      return updatedUser;
    },
    [currentUserId],
  );

  const updateCurrentUserTrainingResult = useCallback(
    async (score) => {
      if (!currentUserId) {
        return null;
      }

      const updatedUser = await userRepository.updateTrainingResult(currentUserId, {
        score,
        trainingLevel: getTrainingLevelByScore(score),
      });

      if (updatedUser) {
        setCurrentUser(updatedUser);
        setAuthError("");
      }

      return updatedUser;
    },
    [currentUserId],
  );

  const saveCurrentUserTrainingPlan = useCallback(
    async (trainingPlanPayload) => {
      if (!currentUserId) {
        return null;
      }

      const updatedUser = await userRepository.saveTrainingPlan(
        currentUserId,
        trainingPlanPayload,
      );

      if (updatedUser) {
        setCurrentUser(updatedUser);
        setAuthError("");
      }

      return updatedUser;
    },
    [currentUserId],
  );

  const scheduleCurrentUserWorkout = useCallback(
    async (schedulePayload) => {
      if (!currentUserId) {
        return null;
      }

      const updatedUser = await userRepository.scheduleWorkout(
        currentUserId,
        schedulePayload,
      );

      if (updatedUser) {
        setCurrentUser(updatedUser);
        setAuthError("");
      }

      return updatedUser;
    },
    [currentUserId],
  );

  const cancelCurrentUserWorkout = useCallback(
    async (scheduledWorkoutId) => {
      if (!currentUserId) {
        return null;
      }

      const updatedUser = await userRepository.cancelWorkout(
        currentUserId,
        scheduledWorkoutId,
      );

      if (updatedUser) {
        setCurrentUser(updatedUser);
        setAuthError("");
      }

      return updatedUser;
    },
    [currentUserId],
  );

  const completeCurrentUserWorkout = useCallback(
    async (scheduledWorkoutId, completionPayload) => {
      if (!currentUserId) {
        return null;
      }

      const updatedUser = await userRepository.completeWorkout(
        currentUserId,
        scheduledWorkoutId,
        completionPayload,
      );

      if (updatedUser) {
        setCurrentUser(updatedUser);
        setAuthError("");
      }

      return updatedUser;
    },
    [currentUserId],
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isAuthReady,
        authError,
        login,
        register,
        logout,
        refreshCurrentUser,
        updateCurrentUserProfile,
        updateCurrentUserTrainingResult,
        saveCurrentUserTrainingPlan,
        scheduleCurrentUserWorkout,
        cancelCurrentUserWorkout,
        completeCurrentUserWorkout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
