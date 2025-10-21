import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import logo from '@/assets/logo-transparent.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'hospital': return t('auth.hospital');
      case 'admin': return t('dashboard.adminSpace');
      case 'technician': return t('auth.technician');
      default: return role;
    }
  };

  const handleLogoClick = () => {
    if (profile) {
      navigate(`/${profile.role}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <div className="flex flex-col gap-4 mt-8">
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={() => {
                        handleLogoClick();
                        setMobileMenuOpen(false);
                      }}
                    >
                      {t('dashboard.title')}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start text-danger"
                      onClick={signOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('common.logout')}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLogoClick}
              >
                <img src={logo} alt="Smart Maintenance Logo" className="h-10 w-auto" />
                <span className="hidden md:block text-sm font-semibold text-primary italic">
                  Your interest, Our priority.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {profile?.full_name}
                </span>
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                  {getRoleLabel(profile?.role || '')}
                </span>
              </div>

              {profile?.role === 'technician' && !profile?.is_validated && (
                <div className="hidden md:block px-3 py-1 bg-warning/10 text-warning text-sm rounded-md">
                  {t('dashboard.pendingValidation')}
                </div>
              )}

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={signOut}
                className="hidden md:flex"
                title={t('common.logout')}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {profile?.role === 'technician' && !profile?.is_validated && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-warning-foreground">
              ⚠️ Votre compte technicien sera activé après validation par l'administrateur. 
              Vous pourrez accéder aux interventions une fois validé.
            </p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
