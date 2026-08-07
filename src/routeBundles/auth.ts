// Route-level bundle. Keep related pages together to avoid over-splitting.
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyEmail from '../pages/auth/VerifyEmail';
import ForgotPassword from '../pages/auth/ForgotPassword';
import WorkspaceSelect from '../pages/auth/WorkspaceSelect';
import WorkspaceCreate from '../pages/auth/WorkspaceCreate';
import Onboarding from '../pages/onboarding/Onboarding';
import ResetPassword from '../pages/auth/ResetPassword';
import AcceptInvitation from '../pages/auth/AcceptInvitation';

export {
  Login,
  Register,
  VerifyEmail,
  ForgotPassword,
  WorkspaceSelect,
  WorkspaceCreate,
  Onboarding,
  ResetPassword,
  AcceptInvitation,
};
