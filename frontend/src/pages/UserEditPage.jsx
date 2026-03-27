import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import PageShell from "../components/PageShell";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import { startTastingSession } from "../utils/tastingSession";
import imageCompression from "browser-image-compression";

export default function UserEditPage() {
  const { currentUser, isAuthReady, updateCurrentUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    password: "",
    profilePhoto: "",
  });
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setProfileForm({
      name: currentUser.name ?? "",
      email: currentUser.email ?? "",
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
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Не удалось обновить профиль.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Если файл больше 1MB, сжимаем
    if (file.size > 1024 * 1024) {
      const options = {
        maxSizeMB: 0.5, // сжимаем до 0.5MB
        maxWidthOrHeight: 1024, // максимальная ширина или высота
        useWebWorker: true, // для производительности
        fileType: "image/jpeg", // конвертируем в JPEG
      };

      imageCompression(file, options)
        .then((compressedFile) => {
          const reader = new FileReader();

          reader.onload = () => {
            setProfileForm((previousForm) => ({
              ...previousForm,
              profilePhoto: String(reader.result ?? ""),
            }));
          };

          reader.readAsDataURL(compressedFile);
        })
        .catch((error) => {
          console.error("Ошибка сжатия:", error);
          // В случае ошибки загружаем оригинал
          const reader = new FileReader();
          reader.onload = () => {
            setProfileForm((previousForm) => ({
              ...previousForm,
              profilePhoto: String(reader.result ?? ""),
            }));
          };
          reader.readAsDataURL(file);
        });
    } else {
      // Если файл и так маленький, загружаем как есть
      const reader = new FileReader();
      reader.onload = () => {
        setProfileForm((previousForm) => ({
          ...previousForm,
          profilePhoto: String(reader.result ?? ""),
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRetakeTest() {
    startTastingSession();
    navigate(ROUTES.TASTING);
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
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8E97A8]">
            Профиль
          </p>
          <h1 className="text-3xl font-medium text-white">Редактирование</h1>
          <p className="text-sm leading-6 text-[#8E97A8]">
            Здесь можно обновить имя, почту, пароль и фото профиля.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-[#0B0E15] px-4 py-4">
          <div className="h-20 w-20 overflow-hidden rounded-3xl bg-[#1D222D]">
            {profileForm.profilePhoto ? (
              <img
                src={profileForm.profilePhoto}
                alt="Фото профиля"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-white">
                {currentUser.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <label className="flex-1 cursor-pointer rounded-2xl border border-[#2A3140] px-4 py-3 text-center text-sm text-white">
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

          <label className="flex flex-col gap-2">
            <span className="text-sm text-[#8E97A8]">Новый пароль</span>
            <input
              type="password"
              value={profileForm.password}
              onChange={(event) =>
                setProfileForm((previousForm) => ({
                  ...previousForm,
                  password: event.target.value,
                }))
              }
              placeholder="Оставь пустым, если менять не нужно"
              className="rounded-2xl border border-[#2A3140] bg-[#0B0E15] px-4 py-3 text-white outline-none placeholder:text-[#5D6677]"
            />
          </label>

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

        <Link
          to={ROUTES.USER}
          className="rounded-3xl border border-[#2A3140] px-5 py-4 text-center text-base font-medium text-white"
        >
          Назад в профиль
        </Link>
      </section>
    </PageShell>
  );
}
