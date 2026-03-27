import { Navigate, useNavigate } from "react-router";
import AuthFormCard from "../../components/AuthFormCard";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthReady, register } = useAuth();

  if (isAuthReady && currentUser) {
    return <Navigate to={ROUTES.USER} replace />;
  }

  return (
    <AuthFormCard
      title="Регистрация"
      subtitle="Создайте аккаунт, чтобы привязать к профилю ваш уровень подготовки по результатам теста."
      submitText="Создать аккаунт"
      requirePasswordConfirmation
      onSubmit={async (credentials) => {
        await register(credentials);
        navigate(ROUTES.USER, { replace: true });
      }}
      footerText="Уже есть аккаунт?"
      footerLinkText="Войти"
      footerTo={ROUTES.LOGIN}
    />
  );
}
