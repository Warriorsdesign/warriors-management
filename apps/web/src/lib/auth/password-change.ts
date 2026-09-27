/**
 * Chemins accessibles tant qu'un mot de passe provisoire n'a pas été changé. Module sans
 * dépendance : importé par le middleware (runtime Edge).
 */
export const PASSWORD_CHANGE_PAGE = '/change-password';
export const PASSWORD_CHANGE_API = '/api/users/me/password';
export const PASSWORD_CHANGE_ALLOWED_PATHS = [PASSWORD_CHANGE_PAGE, PASSWORD_CHANGE_API, '/api/auth/logout', '/api/auth/me'];
