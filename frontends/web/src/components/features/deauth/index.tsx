import { useState, useCallback } from 'react';
import { Crosshair, Edit, Building, AlertTriangle, X } from 'lucide-react';
import Card from '../../ui/Card.tsx';
import Badge from '../../ui/Badge.tsx';
import useAppStore from '../../../store/useAppStore.ts';
import useGroupedManufacturers from '@airscan/engine/selectors/useGroupedManufacturers.ts';
import DeauthFeatureList from './DeauthFeatureList.tsx';
import type { EnabledFeature } from "@airscan/types/EnabledFeature";
import id from '@airscan/engine/utils/id.ts';

type FeatureConfig = 
  | { type: 'manufacturer-both'; apPrefixes: string[]; clientPrefixes: string[]; channelNum: number }
  | { type: 'manufacturer-ap'; apPrefixes: string[]; clientValue: string; channelNum: number }
  | { type: 'manufacturer-client'; clientPrefixes: string[]; apValue: string; channelNum: number }
  | { type: 'single'; apValue: string; clientValue: string; channelNum: number; isBroadcast: boolean };

export default function DeauthFeature() {
  const [channel, setChannel] = useState<string>('');
  const [accessPoint, setAccessPoint] = useState<string>('');
  const [client, setClient] = useState<string>('');
  const [apMode, setApMode] = useState<'manual' | 'manufacturer'>('manual');
  const [clientMode, setClientMode] = useState<'manual' | 'manufacturer'>('manual');
  const [selectedApManufacturer, setSelectedApManufacturer] = useState<string>('');
  const [selectedClientManufacturer, setSelectedClientManufacturer] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [pendingFeature, setPendingFeature] = useState<EnabledFeature | null>(null);

  const addEnabledFeature = useAppStore(state => state.addEnabledFeature);
  const manufacturers = useGroupedManufacturers();

  const prepareFeature = useCallback((): FeatureConfig => {
    const channelNum = channel ? parseInt(channel, 10) : 0;
    const apValue = apMode === 'manual' ? accessPoint : '';
    const clientValue = clientMode === 'manual' ? client : '';
    
    // Check if this is a broadcast deauth (no specific targets)
    const isBroadcast = !apValue && !clientValue && 
      !(apMode === 'manufacturer' && selectedApManufacturer) && 
      !(clientMode === 'manufacturer' && selectedClientManufacturer);
    
    if (apMode === 'manufacturer' && selectedApManufacturer && manufacturers[selectedApManufacturer]) {
      // Manufacturer-based Access Point features
      const apPrefixes = manufacturers[selectedApManufacturer]!;
      
      if (clientMode === 'manufacturer' && selectedClientManufacturer && manufacturers[selectedClientManufacturer]) {
        // Both AP and Client are manufacturer mode
        return { type: 'manufacturer-both', apPrefixes, clientPrefixes: manufacturers[selectedClientManufacturer]!, channelNum };
      } else {
        // Only AP is manufacturer mode
        return { type: 'manufacturer-ap', apPrefixes, clientValue, channelNum };
      }
    } else if (clientMode === 'manufacturer' && selectedClientManufacturer && manufacturers[selectedClientManufacturer]) {
      // Only Client is manufacturer mode
      return { type: 'manufacturer-client', clientPrefixes: manufacturers[selectedClientManufacturer]!, apValue, channelNum };
    } else {
      // Single or broadcast feature
      return { type: 'single', apValue, clientValue, channelNum, isBroadcast };
    }
  }, [channel, accessPoint, client, apMode, clientMode, selectedApManufacturer, selectedClientManufacturer, manufacturers]);

  const handleSubmit = useCallback(() => {
    const featureConfig = prepareFeature();
    
    // Check if this is a broadcast deauth that needs confirmation
    if (featureConfig.type === 'single' && featureConfig.isBroadcast) {
      // Show confirmation for broadcast deauth
      setPendingFeature({
        id: id(),
        type: "deauth",
        isActive: true,
        options: {
          accessPoint: '',
          station: '',
          channel: featureConfig.channelNum,
        }
      });
      setShowConfirmation(true);
      return;
    }
    
    // Execute the feature creation
    executeFeatureCreation(featureConfig);
    
    // Reset form
    setChannel('');
    setAccessPoint('');
    setClient('');
    setSelectedApManufacturer('');
    setSelectedClientManufacturer('');
  }, [prepareFeature]);

  const executeFeatureCreation = useCallback((featureConfig: FeatureConfig) => {
    switch (featureConfig.type) {
      case 'manufacturer-both':
        featureConfig.apPrefixes.forEach((apPrefix) => {
          featureConfig.clientPrefixes.forEach((clientPrefix) => {
            addEnabledFeature({
              id: id(),
              type: "deauth",
              isActive: true,
              options: {
                accessPoint: apPrefix,
                station: clientPrefix,
                channel: featureConfig.channelNum,
              }
            });
          });
        });
        break;
        
      case 'manufacturer-ap':
        featureConfig.apPrefixes.forEach((prefix) => {
          addEnabledFeature({
            id: id(),
            type: "deauth",
            isActive: true,
            options: {
              accessPoint: prefix,
              station: featureConfig.clientValue,
              channel: featureConfig.channelNum,
            }
          });
        });
        break;
        
      case 'manufacturer-client':
        featureConfig.clientPrefixes.forEach((prefix) => {
          addEnabledFeature({
            id: id(),
            type: "deauth",
            isActive: true,
            options: {
              accessPoint: featureConfig.apValue,
              station: prefix,
              channel: featureConfig.channelNum,
            }
          });
        });
        break;
        
      case 'single':
        addEnabledFeature({
          id: id(),
          type: "deauth",
          isActive: true,
          options: {
            accessPoint: featureConfig.apValue,
            station: featureConfig.clientValue,
            channel: featureConfig.channelNum,
          }
        });
        break;
    }
  }, [addEnabledFeature]);

  const handleConfirm = useCallback(() => {
    if (pendingFeature) {
      addEnabledFeature(pendingFeature);
    }
    setShowConfirmation(false);
    setPendingFeature(null);
    
    // Reset form
    setChannel('');
    setAccessPoint('');
    setClient('');
    setSelectedApManufacturer('');
    setSelectedClientManufacturer('');
  }, [pendingFeature, addEnabledFeature]);

  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
    setPendingFeature(null);
  }, []);



  const canSubmit = true; // Always allow submission, even for broadcast deauth

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Crosshair className="w-4 h-4" /> Deauth
        </h2>
        <Badge color="purple">{Object.keys(manufacturers).length} Manufacturers</Badge>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          {/* Channel Input */}
          <div>
            <label className="text-xs uppercase text-slate-500 font-bold mb-2 block">
              Channel (optional)
            </label>
            <input
              type="number"
              min="1"
              max="14"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="All channels"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="text-xs text-slate-500 mt-1">Leave empty for all channels</div>
          </div>

          {/* Access Point Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase text-slate-500 font-bold">
                Access Point
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setApMode('manual')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${apMode === 'manual' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  title="Enter MAC manually"
                >
                  <Edit className="w-3 h-3" />
                  Manual
                </button>
                <button
                  onClick={() => setApMode('manufacturer')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${apMode === 'manufacturer' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  title="Select by manufacturer"
                >
                  <Building className="w-3 h-3" />
                  Manufacturer
                </button>
              </div>
            </div>

            {apMode === 'manual' ? (
              <input
                type="text"
                value={accessPoint}
                onChange={(e) => setAccessPoint(e.target.value)}
                placeholder="ab:cd:ef:12:34:56"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedApManufacturer}
                  onChange={(e) => setSelectedApManufacturer(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Choose AP manufacturer...</option>
                  {Object.keys(manufacturers).map(manufacturer => (
                    <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                  ))}
                </select>
                {selectedApManufacturer && (
                  <div className="bg-slate-800/50 rounded p-2">
                    <div className="text-xs text-slate-400 mb-1">OUI Prefixes:</div>
                    <div className="flex flex-wrap gap-1">
                      {manufacturers[selectedApManufacturer]!.map(prefix => (
                        <Badge key={prefix} color="cyan" className="font-mono text-[10px]">{prefix}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="text-xs text-slate-500">
              {apMode === 'manual' ? 'Specific AP MAC address' : 'Target all APs from selected manufacturer'}
            </div>
          </div>

          {/* Client Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase text-slate-500 font-bold">
                Client
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setClientMode('manual')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${clientMode === 'manual' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  title="Enter MAC manually"
                >
                  <Edit className="w-3 h-3" />
                  Manual
                </button>
                <button
                  onClick={() => setClientMode('manufacturer')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${clientMode === 'manufacturer' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  title="Select by manufacturer"
                >
                  <Building className="w-3 h-3" />
                  Manufacturer
                </button>
              </div>
            </div>

            {clientMode === 'manual' ? (
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="ab:cd:ef:12:34:56"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedClientManufacturer}
                  onChange={(e) => setSelectedClientManufacturer(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Choose client manufacturer...</option>
                  {Object.keys(manufacturers).map(manufacturer => (
                    <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                  ))}
                </select>
                {selectedClientManufacturer && (
                  <div className="bg-slate-800/50 rounded p-2">
                    <div className="text-xs text-slate-400 mb-1">OUI Prefixes:</div>
                    <div className="flex flex-wrap gap-1">
                      {manufacturers[selectedClientManufacturer]!.map(prefix => (
                        <Badge key={prefix} color="cyan" className="font-mono text-[10px]">{prefix}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="text-xs text-slate-500">
              {clientMode === 'manual' ? 'Specific client MAC address' : 'Target all clients from selected manufacturer'}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded font-bold uppercase text-sm tracking-wider transition-all ${!canSubmit
              ? "bg-slate-800 text-slate-600 cursor-not-allowed"
              : "bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white"
              }`}
          >
            <Crosshair className="w-4 h-4" />
            {(() => {
              if (apMode === 'manufacturer' && selectedApManufacturer && clientMode === 'manufacturer' && selectedClientManufacturer) {
                return `Deauth ${selectedApManufacturer} APs → ${selectedClientManufacturer} Clients`;
              } else if (apMode === 'manufacturer' && selectedApManufacturer) {
                return `Deauth ${selectedApManufacturer} APs`;
              } else if (clientMode === 'manufacturer' && selectedClientManufacturer) {
                return `Deauth ${selectedClientManufacturer} Clients`;
              } else if ((apMode === 'manual' && !accessPoint) && (clientMode === 'manual' && !client)) {
                return '⚠️ Broadcast Deauth (Dangerous)';
              } else {
                return 'Enable Deauth Feature';
              }
            })()}
          </button>
        </div>
      </Card>

      {/* Deauth Feature List */}
      <DeauthFeatureList />

      {/* Confirmation Modal for Broadcast Deauth */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-md border-2 border-red-500/50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Dangerous Operation</h3>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-500/5 border border-red-500/20 rounded p-4">
                  <div className="text-red-400 font-bold mb-2">⚠️ WARNING: Broadcast Deauth</div>
                  <p className="text-slate-300 text-sm">
                    You are about to enable a <span className="font-bold text-red-400">broadcast deauthentication attack</span>.
                  </p>
                  <ul className="text-slate-400 text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>This will target <span className="font-bold">ALL devices</span> on the network</li>
                    <li>Can cause widespread network disruption</li>
                    <li>May be detected as malicious activity</li>
                    <li>Use only for authorized testing</li>
                  </ul>
                </div>

                <div className="bg-slate-800/50 rounded p-3">
                  <div className="text-xs uppercase text-slate-500 font-bold mb-1">Configuration</div>
                  <div className="text-sm text-slate-300 font-mono space-y-1">
                    <div>Channel: {channel || 'All'}</div>
                    <div>Access Point: <span className="text-red-400">ANY</span></div>
                    <div>Client: <span className="text-red-400">ANY</span></div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    I Understand - Proceed
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}