import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSignInAlt, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, sendPasswordResetEmail } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      await login(formData.email, formData.password);
      onClose();
      setFormData({ email: '', password: '' });
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({ 
        submit: error.code === 'auth/invalid-credential' 
          ? 'Invalid email or password' 
          : 'Login failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: 'Please enter your email address first' });
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      await sendPasswordResetEmail(formData.email);
      setResetEmailSent(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setErrors({ 
        submit: 'Failed to send reset email. Please check your email address.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({ email: '', password: '' });
      setErrors({});
      setShowPassword(false);
      setShowForgotPassword(false);
      setResetEmailSent(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Admin Login"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          error={errors.email}
          icon={faEnvelope}
          fullWidth
          disabled={loading}
          required
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            error={errors.password}
            icon={faLock}
            fullWidth
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 focus:outline-none"
            disabled={loading}
          >
            <FontAwesomeIcon 
              icon={showPassword ? faEyeSlash : faEye} 
              className="h-4 w-4" 
            />
          </button>
        </div>

        {errors.submit && (
          <div className="text-red-600 text-sm">{errors.submit}</div>
        )}

        {resetEmailSent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 text-sm">
              Password reset email sent! Please check your inbox and follow the instructions to reset your password.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={faSignInAlt}
              fullWidth
            >
              Sign In
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none disabled:opacity-50"
              >
                Forgot your password?
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default LoginModal;