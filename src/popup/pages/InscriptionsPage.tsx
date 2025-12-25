// ============================================
// Dogendary Wallet - Inscriptions Page
// Display and manage Doginals inscriptions
// ============================================

import React, { useState, useEffect } from 'react';
import { Grid, List, Search, ExternalLink, X } from 'lucide-react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import type { Inscription } from '@/types';

// Inscription card component
const InscriptionCard: React.FC<{
  inscription: Inscription;
  onClick: () => void;
}> = ({ inscription, onClick }) => {
  const inscriptionNumber = inscription.inscriptionNumber ?? inscription.number;
  const inscriptionId = inscription.inscriptionId ?? inscription.id;
  
  return (
    <Card 
      variant="chrome" 
      padding="none" 
      hover 
      className="overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square bg-surface-2 relative">
        <img
          src={inscription.contentUrl || `https://wonky-ord.dogeord.io/content/${inscriptionId}`}
          alt={`Inscription #${inscriptionNumber}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="50" text-anchor="middle" fill="%23888">🖼️</text></svg>';
          }}
        />
        <Badge 
          variant="info" 
          size="sm" 
          className="absolute top-2 right-2"
        >
          #{inscriptionNumber}
        </Badge>
      </div>
      <div className="p-2">
        <p className="text-xs text-text-secondary truncate">
          {inscription.contentType}
        </p>
      </div>
    </Card>
  );
};

// Inscription detail modal
const InscriptionDetail: React.FC<{
  inscription: Inscription;
  onClose: () => void;
}> = ({ inscription, onClose }) => {
  const inscriptionNumber = inscription.inscriptionNumber ?? inscription.number;
  const inscriptionId = inscription.inscriptionId ?? inscription.id;
  const satpoint = inscription.satpoint ?? inscription.location;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card variant="chrome" className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">
            Inscription #{inscriptionNumber}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="aspect-square bg-surface-2 rounded-lg overflow-hidden mb-4">
          <img
            src={inscription.contentUrl || `https://wonky-ord.dogeord.io/content/${inscriptionId}`}
            alt={`Inscription #${inscriptionNumber}`}
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-xs text-text-secondary">Inscription ID</p>
            <p className="text-sm text-text-primary font-mono break-all">
              {inscriptionId}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-text-secondary">Content Type</p>
            <p className="text-sm text-text-primary">{inscription.contentType}</p>
          </div>
          
          {satpoint && (
            <div>
              <p className="text-xs text-text-secondary">Satpoint</p>
              <p className="text-sm text-text-primary font-mono break-all">
                {satpoint}
              </p>
            </div>
          )}
          
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              window.open(`https://wonky-ord.dogeord.io/inscription/${inscriptionId}`, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const InscriptionsPage: React.FC = () => {
  const { inscriptions, isLoadingInscriptions, refreshInscriptions, setView } = useWalletStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInscription, setSelectedInscription] = useState<Inscription | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Refresh on mount
  useEffect(() => {
    refreshInscriptions();
  }, [refreshInscriptions]);

  // Filter inscriptions
  const filteredInscriptions = inscriptions.filter(insc => {
    const inscriptionId = insc.inscriptionId ?? insc.id;
    const inscriptionNumber = insc.inscriptionNumber ?? insc.number;
    
    const matchesSearch = searchQuery === '' || 
      inscriptionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inscriptionNumber.toString().includes(searchQuery);
    
    const matchesFilter = filter === 'all' || 
      insc.contentType.startsWith(filter);
    
    return matchesSearch && matchesFilter;
  });

  // Content type filters
  const contentTypes = [
    { value: 'all', label: 'All' },
    { value: 'image', label: 'Images' },
    { value: 'text', label: 'Text' },
    { value: 'application', label: 'Data' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-surface-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-text-primary">
            Inscriptions
            <span className="ml-2 text-sm text-text-secondary">
              ({inscriptions.length})
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <Input
          placeholder="Search inscriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
        
        {/* Filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {contentTypes.map(type => (
            <Button
              key={type.value}
              variant={filter === type.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(type.value)}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingInscriptions ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan" />
          </div>
        ) : filteredInscriptions.length === 0 ? (
          <Card variant="default" className="p-8 text-center">
            <div className="text-4xl mb-4">🖼️</div>
            <p className="text-text-secondary">
              {searchQuery || filter !== 'all' 
                ? 'No inscriptions match your search' 
                : 'No inscriptions yet'}
            </p>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredInscriptions.map((inscription) => (
              <InscriptionCard
                key={inscription.inscriptionId ?? inscription.id}
                inscription={inscription}
                onClick={() => setSelectedInscription(inscription)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredInscriptions.map((inscription) => {
              const inscriptionNumber = inscription.inscriptionNumber ?? inscription.number;
              const inscriptionId = inscription.inscriptionId ?? inscription.id;
              
              return (
                <Card
                  key={inscriptionId}
                  variant="default"
                  padding="sm"
                  hover
                  className="cursor-pointer"
                  onClick={() => setSelectedInscription(inscription)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-surface-2 overflow-hidden">
                      <img
                        src={inscription.contentUrl || `https://wonky-ord.dogeord.io/content/${inscriptionId}`}
                        alt={`Inscription #${inscriptionNumber}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary">
                        #{inscriptionNumber}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {inscription.contentType}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-text-tertiary" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
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

      {/* Detail modal */}
      {selectedInscription && (
        <InscriptionDetail
          inscription={selectedInscription}
          onClose={() => setSelectedInscription(null)}
        />
      )}
    </div>
  );
};

export default InscriptionsPage;
