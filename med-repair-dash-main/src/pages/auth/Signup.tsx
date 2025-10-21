import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { AppRole } from '@/types';
import { useTranslation } from 'react-i18next';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AppRole>(location.state?.role || 'hospital');
  const [hospitalName, setHospitalName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password.length < 6) {
      toast.error(t('auth.passwordMinError'));
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(
        email, 
        password, 
        fullName, 
        role,
        role === 'hospital' ? hospitalName : undefined
      );
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error(t('auth.emailAlreadyUsed'));
        } else {
          toast.error(error.message || t('auth.errorCreatingAccount'));
        }
        return;
      }

      navigate('/auth/login');
    } catch (error) {
      toast.error(t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.backToHome')}
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">{t('auth.signup')}</CardTitle>
            <CardDescription>
              {t('auth.joinPlatform')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('auth.passwordMin')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t('auth.accountType')}</Label>
                <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">{t('auth.hospital')}</SelectItem>
                    <SelectItem value="technician">{t('auth.technician')}</SelectItem>
                    <SelectItem value="admin">{t('common.admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'hospital' && (
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">{t('auth.hospitalName')}</Label>
                  <Input
                    id="hospitalName"
                    type="text"
                    placeholder="CHU de Paris"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    required
                  />
                </div>
              )}

              {role === 'technician' && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                  <p className="text-sm text-warning-foreground">
                    ⚠️ {t('auth.technicianValidation')}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? t('auth.creating') : t('auth.createMyAccount')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('common.alreadyRegistered')}{' '}
                <Link 
                  to="/auth/login" 
                  state={location.state}
                  className="text-primary hover:underline font-medium"
                >
                  {t('auth.signIn')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
