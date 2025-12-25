// ============================================
// Dogendary Wallet - Welcome Page (FIXED)
// Fixed: Removed unused Card import
// ============================================
// 
// This page is shown when:
// - No wallet vault exists (isInitialized === false)
// - User needs to create or import a wallet
// ============================================

import React from 'react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Button } from '../components/ui/Button';
// REMOVED: import { Card, CardContent } from '../components/ui/Card';
import { 
  Plus, 
  Download, 
  Shield, 
  Zap, 
  Lock 
} from 'lucide-react';

export function WelcomePage(): React.ReactElement {
  const { setView } = useWalletStore();

  return (
    <div className="flex flex-col h-full p-6 bg-gradient-to-b from-bg-primary to-bg-deepest">
      {/* Logo and Title Section */}
      <div className="flex flex-col items-center pt-8 pb-6">
        {/* Wallet Icon with Glow */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-cyan/30">
            <Shield className="w-10 h-10 text-neon-cyan" />
          </div>
        </div>
        
        {/* Brand Name */}
        <h1 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple mb-2">
          Dogendary
        </h1>
        <p className="text-sm text-text-secondary text-center max-w-[280px]">
          Your gateway to Dogecoin, Doginals, and DRC-20 tokens
        </p>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <FeatureItem icon={Zap} label="Fast" />
        <FeatureItem icon={Shield} label="Secure" />
        <FeatureItem icon={Lock} label="Private" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 flex-1 justify-end pb-8">
        {/* Create New Wallet */}
        <Button
          onClick={() => setView('create-wallet')}
          className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-neon-cyan to-neon-blue hover:from-neon-cyan/90 hover:to-neon-blue/90 text-bg-primary rounded-xl flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-lg hover:shadow-neon-cyan/25"
        >
          <Plus className="w-5 h-5" />
          Create New Wallet
        </Button>

        {/* Import Existing Wallet */}
        <Button
          variant="outline"
          onClick={() => setView('import-wallet')}
          className="w-full py-4 text-lg font-semibold border-2 border-white/20 hover:border-neon-cyan/50 text-text-primary rounded-xl flex items-center justify-center gap-3 transition-all duration-200 hover:bg-white/5"
        >
          <Download className="w-5 h-5" />
          Import Existing Wallet
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-xs text-text-tertiary">
          Powered by 24HRMVP
        </p>
      </div>
    </div>
  );
}

// Feature item component
interface FeatureItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function FeatureItem({ icon: Icon, label }: FeatureItemProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
      <Icon className="w-5 h-5 text-neon-cyan" />
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}

export default WelcomePage;
