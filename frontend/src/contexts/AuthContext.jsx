import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./authContextObject";
import {
  clearSessionUserId,
  getSessionUserId,
  setSessionUserId,
} from "../utils/authSession";
import { userRepository } from "../services/database/userRepository";
import { getTrainingLevelByScore } from "../utils/trainingLevel";

function validateCredentials({ login, password }) {
  const trimmedLogin = String(login ?? "").trim();
  const trimmedPassword = String(password ?? "").trim();

  if (trimmedLogin.length < 2) {
    throw new Error("Логин должен содержать минимум 2 символа.");
  }

  if (trimmedPassword.length < 4) {
    throw new Error("Пароль должен содержать минимум 4 символа.");
  }

  return {
    login: trimmedLogin,
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

  const login = useCallback(async ({ login, password }) => {
    const credentials = validateCredentials({ login, password });
    const user = await userRepository.login(credentials);

    if (!user) {
      throw new Error("Неверный логин или пароль.");
    }

    setSessionUserId(user.id);
    setCurrentUserId(user.id);
    setCurrentUser(user);
    setAuthError("");

    return user;
  }, []);

  const register = useCallback(async ({ login, password }) => {
    const credentials = validateCredentials({ login, password });
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
    async ({ name, email, gender, password, profilePhoto }) => {
      if (!currentUserId) {
        return null;
      }

      const updatedUser = await userRepository.updateProfile(currentUserId, {
        name,
        email,
        gender,
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

  const saveCurrentUserTrainingFeedback = useCallback(
    async (feedbackEvents) => {
      if (!currentUserId) {
        return null;
      }

      const updatedUser = await userRepository.saveTrainingFeedback(
        currentUserId,
        feedbackEvents,
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

  const skipCurrentUserWorkout = useCallback(
    async (scheduledWorkoutId) => {
      if (!currentUserId) {
        return null;
      }

      const updatedUser = await userRepository.skipWorkout(
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

      const completionResult = await userRepository.completeWorkout(
        currentUserId,
        scheduledWorkoutId,
        completionPayload,
      );
      const updatedUser =
        completionResult?.user && typeof completionResult === "object"
          ? completionResult.user
          : completionResult;

      if (updatedUser) {
        setCurrentUser(updatedUser);
        setAuthError("");
      }

      return completionResult;
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
        saveCurrentUserTrainingFeedback,
        scheduleCurrentUserWorkout,
        cancelCurrentUserWorkout,
        skipCurrentUserWorkout,
        completeCurrentUserWorkout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
