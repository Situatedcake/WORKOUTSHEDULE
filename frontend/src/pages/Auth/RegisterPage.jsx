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
      subtitle="Создайте аккаунт. Пока что логин станет вашим именем в профиле, а потом его можно будет изменить в настройках."
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
