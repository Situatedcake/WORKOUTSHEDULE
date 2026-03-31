import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { Navigate, useNavigate } from "react-router";
import PageBackButton from "../components/PageBackButton";
import PageShell from "../components/PageShell";
import PasswordField from "../components/PasswordField";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import { startTastingSession } from "../utils/tastingSession";

export default function UserEditPage() {
  const { currentUser, isAuthReady, logout, updateCurrentUserProfile } =
    useAuth();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    gender: "not_specified",
    password: "",
    profilePhoto: "",
  });
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setProfileForm({
      name: currentUser.name ?? currentUser.login ?? "",
      email: currentUser.email ?? "",
      gender: currentUser.gender ?? "not_specified",
      password: "",
      profilePhoto: currentUser.profilePhoto ?? "",
    });
  }, [currentUser]);

  async function handleProfileSubmit(event) {
    event.preventDefault();

    setIsSaving(true);
    setSaveError("");
    setSaveMessage("");

    try {
      await updateCurrentUserProfile(profileForm);
      setProfileForm((previousForm) => ({
        ...previousForm,
        password: "",
      }));
      setSaveMessage("Профиль обновлен.");
      setIsLogoutConfirmVisible(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Не удалось обновить профиль.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function updatePhotoResult(photoData) {
    setProfileForm((previousForm) => ({
      ...previousForm,
      profilePhoto: photoData,
    }));
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const readFile = (nextFile) => {
      const reader = new FileReader();

      reader.onload = () => {
        updatePhotoResult(String(reader.result ?? ""));
      };

      reader.readAsDataURL(nextFile);
    };

    if (file.size > 1024 * 1024) {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: "image/jpeg",
      };

      imageCompression(file, options)
        .then(readFile)
        .catch(() => {
          readFile(file);
        });

      return;
    }

    readFile(file);
  }

  function handleRetakeTest() {
    startTastingSession();
    navigate(ROUTES.TASTING);
  }

  function handleRequestLogout() {
    setIsLogoutConfirmVisible(true);
    setSaveError("");
    setSaveMessage("");
  }

  function handleCancelLogout() {
    setIsLogoutConfirmVisible(false);
  }

  function handleConfirmLogout() {
    logout();
    navigate(ROUTES.HOME, { replace: true });
  }

  if (!isAuthReady) {
    return (
      <PageShell className="pt-5">
        <section className="mx-auto w-full max-w-md rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6 text-[#8E97A8]">
          Загрузка профиля...
        </section>
      </PageShell>
    );
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.USER} replace />;
  }

  return (
    <PageShell className="pt-5">
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-[#2A3140] bg-[#12151C] p-6">
        <PageBackButton fallbackTo={ROUTES.USER} />

        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
            Профиль
          </p>
          <h1 className="text-3xl font-medium text-white">Редактирование</h1>
          <p className="text-sm leading-6 text-[#8E97A8]">
            Логин используется для входа. Здесь можно изменить имя, почту,
            пароль и фото профиля.
          </p>
        </div>

        <div className="rounded-2xl bg-[#0B0E15] px-4 py-3 text-sm leading-6 text-[#8E97A8]">
          Логин:{" "}
          <span className="break-words text-white">
            {currentUser.login ?? currentUser.name}
          </span>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl bg-[#0B0E15] px-4 py-4 sm:flex-row sm:items-center">
          <div className="h-20 w-20 overflow-hidden rounded-3xl bg-[#1D222D]">
            {profileForm.profilePhoto ? (
              <img
                src={profileForm.profilePhoto}
                alt="Фото профиля"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-white">
                {(currentUser.name ?? currentUser.login ?? "Г")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}
          </div>

          <label className="w-full cursor-pointer rounded-2xl border border-[#2A3140] px-4 py-3 text-center text-sm text-white sm:flex-1">
            Добавить фото
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>
        </div>

        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#8E97A8]">Имя</span>
              <input
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((previousForm) => ({
                    ...previousForm,
                    name: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-[#8E97A8]">Почта</span>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((previousForm) => ({
                    ...previousForm,
                    email: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-[#8E97A8]">Пол</span>
            <select
              value={profileForm.gender}
              onChange={(event) =>
                setProfileForm((previousForm) => ({
                  ...previousForm,
                  gender: event.target.value,
                }))
              }
              className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-3 text-white outline-none"
            >
              <option value="not_specified">Не указан</option>
              <option value="female">Женский</option>
              <option value="male">Мужской</option>
            </select>
          </label>

          <PasswordField
            label="Новый пароль"
            value={profileForm.password}
            onChange={(event) =>
              setProfileForm((previousForm) => ({
                ...previousForm,
                password: event.target.value,
              }))
            }
            placeholder="Оставь пустым, если менять не нужно"
            autoComplete="new-password"
          />

          {saveError ? (
            <div className="rounded-2xl border border-[#603838] bg-[#2B1717] px-4 py-3 text-sm text-[#FFB3B3]">
              {saveError}
            </div>
          ) : null}

          {saveMessage ? (
            <div className="rounded-2xl border border-[#265346] bg-[#102923] px-4 py-3 text-sm text-[#9FE5D2]">
              {saveMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-3xl bg-[#01BB96] px-5 py-4 text-base font-medium text-[#000214] disabled:opacity-60"
          >
            {isSaving ? "Сохраняем..." : "Сохранить изменения"}
          </button>
        </form>

        {currentUser.lastTestScore != null ? (
          <button
            type="button"
            onClick={handleRetakeTest}
            className="rounded-3xl border border-[#2A3140] px-5 py-4 text-base font-medium text-white"
          >
            Повторно пройти тест
          </button>
        ) : null}

        {isLogoutConfirmVisible ? (
          <div className="rounded-3xl border border-[#603838] bg-[#2B1717] p-4">
            <p className="text-sm leading-6 text-[#FFB3B3]">
              Выйти из профиля на этом устройстве?
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleCancelLogout}
                className="rounded-3xl border border-[#2A3140] px-5 py-4 text-base font-medium text-white"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="rounded-3xl bg-[#FF7A7A] px-5 py-4 text-base font-medium text-[#220909]"
              >
                Выйти
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRequestLogout}
            className="rounded-3xl border border-[#2A3140] px-5 py-4 text-base font-medium text-white"
          >
            Выйти из профиля
          </button>
        )}
      </section>
    </PageShell>
  );
}
