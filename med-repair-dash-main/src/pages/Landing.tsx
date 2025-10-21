import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, UserCog, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import heroBg from '@/assets/medical-hero-bg.jpg';
import logo from '@/assets/logo-transparent.png';

const Landing = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useTranslation();

  const handleRoleClick = (role: AppRole) => {
    if (profile) {
      // Already logged in, redirect to dashboard
      navigate(`/${role}/dashboard`);
    } else {
      // Not logged in, redirect to login with role context
      navigate('/auth/login', { state: { role } });
    }
  };

  const roles = [
    {
      role: 'hospital' as AppRole,
      icon: Building2,
      title: t('auth.hospital'),
      description: t('dashboard.hospitalDescription'),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      role: 'technician' as AppRole,
      icon: Wrench,
      title: t('auth.technician'),
      description: t('dashboard.technicianDescription'),
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      role: 'admin' as AppRole,
      icon: UserCog,
      title: t('common.admin'),
      description: t('dashboard.adminDescription'),
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-primary/20 to-background/95 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-16 space-y-6">
          <div className="flex justify-center items-center gap-6">
            <img src={logo} alt="Smart Maintenance Logo" className="h-32 w-auto" />
            <div className="text-left">
              <p className="text-3xl font-bold text-primary italic">
                Your interest,
              </p>
              <p className="text-3xl font-bold text-primary italic">
                Our priority.
              </p>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
            {t('dashboard.platformDescription')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {roles.map(({ role, icon: Icon, title, description, color, bgColor }) => (
            <Card 
              key={role}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary bg-card/95 backdrop-blur-sm"
              onClick={() => handleRoleClick(role)}
            >
              <CardHeader className="text-center">
                <div className={`mx-auto w-20 h-20 ${bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-10 h-10 ${color}`} />
                </div>
                <CardTitle className="text-2xl">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-base">
                  {description}
                </CardDescription>
                <Button 
                  className="w-full mt-6"
                  variant="outline"
                >
                  {t('common.access')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            {t('common.alreadyRegistered')}
          </p>
          <Button 
            variant="ghost" 
            size="lg"
            onClick={() => navigate('/auth/login')}
          >
            {t('auth.signIn')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
