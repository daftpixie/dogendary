// ============================================
// Dogendary Wallet - Settings Page (FIXED)
// Fixed: settings.network default value
// ============================================

import React from 'react';
import { 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Lock,
  Trash2,
  ExternalLink,
  ChevronRight 
} from 'lucide-react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

// Setting item component
const SettingItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}> = ({ icon, title, description, action, onClick, danger }) => {
  const content = (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        danger ? 'bg-red-500/20' : 'bg-surface-2'
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${danger ? 'text-red-400' : 'text-text-primary'}`}>
          {title}
        </p>
        {description && (
          <p className="text-xs text-text-secondary">{description}</p>
        )}
      </div>
      {action || (onClick && <ChevronRight className="w-4 h-4 text-text-tertiary" />)}
    </div>
  );

  if (onClick) {
    return (
      <button
        className="w-full text-left p-3 rounded-lg hover:bg-surface-2 transition-colors"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className="p-3">{content}</div>;
};

// Toggle switch component
const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => (
  <button
    className={`relative w-11 h-6 rounded-full transition-colors ${
      checked ? 'bg-neon-cyan' : 'bg-surface-3'
    }`}
    onClick={() => onChange(!checked)}
  >
    <span
      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

// Select component
const Select: React.FC<{
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}> = ({ value, options, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-surface-2 border border-surface-3 rounded-lg px-3 py-1.5 text-sm text-text-primary"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, lockWallet, setView, addToast } = useWalletStore();

  const handleLock = () => {
    lockWallet();
    setView('unlock');
  };

  const handleExport = () => {
    addToast({ type: 'info', message: 'This feature is coming soon' });
  };

  const handleReset = () => {
    addToast({ 
      type: 'warning', 
      message: 'To reset your wallet, please use your recovery phrase' 
    });
  };

  // Get autoLock value (support both property names)
  const autoLockValue = settings.autoLock ?? settings.autoLockMinutes ?? 5;
  
  // Get notifications value (support both property names)
  const notificationsEnabled = settings.notifications ?? settings.enableNotifications ?? true;

  // FIX: Get network value with default fallback to satisfy string type requirement
  const networkValue = settings.network ?? 'mainnet';

  // FIX: Get theme value with default fallback
  const themeValue = settings.theme ?? 'dark';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-surface-3">
        <h1 className="text-lg font-bold text-text-primary">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Network */}
        <Card variant="default" padding="none">
          <div className="px-3 py-2 border-b border-surface-3">
            <p className="text-xs font-medium text-text-secondary uppercase">Network</p>
          </div>
          <SettingItem
            icon={<Globe className="w-5 h-5 text-neon-cyan" />}
            title="Network"
            description="Select Dogecoin network"
            action={
              <Select
                value={networkValue}
                options={[
                  { value: 'mainnet', label: 'Mainnet' },
                  { value: 'testnet', label: 'Testnet' },
                ]}
                onChange={(value) => updateSettings({ network: value as 'mainnet' | 'testnet' })}
              />
            }
          />
        </Card>

        {/* Security */}
        <Card variant="default" padding="none">
          <div className="px-3 py-2 border-b border-surface-3">
            <p className="text-xs font-medium text-text-secondary uppercase">Security</p>
          </div>
          <SettingItem
            icon={<Lock className="w-5 h-5 text-neon-purple" />}
            title="Auto-Lock"
            description="Lock wallet after inactivity"
            action={
              <Select
                value={String(autoLockValue)}
                options={[
                  { value: '1', label: '1 min' },
                  { value: '5', label: '5 min' },
                  { value: '15', label: '15 min' },
                  { value: '30', label: '30 min' },
                  { value: '60', label: '1 hour' },
                ]}
                onChange={(value) => updateSettings({ autoLock: parseInt(value) })}
              />
            }
          />
          <SettingItem
            icon={<Shield className="w-5 h-5 text-neon-green" />}
            title="Lock Wallet Now"
            description="Manually lock your wallet"
            onClick={handleLock}
          />
        </Card>

        {/* Notifications */}
        <Card variant="default" padding="none">
          <div className="px-3 py-2 border-b border-surface-3">
            <p className="text-xs font-medium text-text-secondary uppercase">Notifications</p>
          </div>
          <SettingItem
            icon={<Bell className="w-5 h-5 text-neon-orange" />}
            title="Push Notifications"
            description="Receive transaction alerts"
            action={
              <Toggle
                checked={notificationsEnabled}
                onChange={(checked) => updateSettings({ notifications: checked })}
              />
            }
          />
        </Card>

        {/* Display */}
        <Card variant="default" padding="none">
          <div className="px-3 py-2 border-b border-surface-3">
            <p className="text-xs font-medium text-text-secondary uppercase">Display</p>
          </div>
          <SettingItem
            icon={<Palette className="w-5 h-5 text-neon-cyan" />}
            title="Theme"
            description="Choose app appearance"
            action={
              <Select
                value={themeValue}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'system', label: 'System' },
                ]}
                onChange={(value) => updateSettings({ theme: value as 'dark' | 'light' | 'system' })}
              />
            }
          />
        </Card>

        {/* Danger Zone */}
        <Card variant="default" padding="none" className="border-red-500/30">
          <div className="px-3 py-2 border-b border-red-500/30">
            <p className="text-xs font-medium text-red-400 uppercase">Danger Zone</p>
          </div>
          <SettingItem
            icon={<ExternalLink className="w-5 h-5 text-red-400" />}
            title="Export Recovery Phrase"
            description="View your secret recovery phrase"
            onClick={handleExport}
            danger
          />
          <SettingItem
            icon={<Trash2 className="w-5 h-5 text-red-400" />}
            title="Reset Wallet"
            description="Remove all data and start fresh"
            onClick={handleReset}
            danger
          />
        </Card>

        {/* App info */}
        <div className="text-center pt-4">
          <p className="text-xs text-text-tertiary">Dogendary Wallet v1.0.0</p>
          <p className="text-xs text-text-tertiary mt-1">
            Built with ❤️ for the Dogecoin community
          </p>
        </div>
      </div>

      {/* Back button */}
      <div className="p-4 border-t border-surface-3">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setView('dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
