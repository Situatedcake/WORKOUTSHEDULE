import { Navigate, useNavigate } from "react-router";
import AuthFormCard from "../../components/AuthFormCard";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthReady, login } = useAuth();

  if (isAuthReady && currentUser) {
    return <Navigate to={ROUTES.USER} replace />;
  }

  return (
    <AuthFormCard
      title="Вход"
      subtitle="Войдите в профиль, чтобы сохранять результат теста и видеть свой уровень подготовки."
      submitText="Войти"
      onSubmit={async (credentials) => {
        await login(credentials);
        navigate(ROUTES.USER, { replace: true });
      }}
      footerText="Еще нет аккаунта?"
      footerLinkText="Зарегистрироваться"
      footerTo={ROUTES.REGISTER}
    />
  );
}
