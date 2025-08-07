'use client';

import { Settings as SettingsIcon, ArrowLeft, Loader2, Palette, Search, FileText, Brain, Key, User, MapPin } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Switch } from '@headlessui/react';
import ThemeSwitcher from '@/components/theme/Switcher';
import { ImagesIcon, VideoIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { LANGUAGES, getLanguageConfig, isRTL } from '@/lib/translations/config';

interface SettingsType {
  chatModelProviders: {
    [key: string]: [Record<string, any>];
  };
  embeddingModelProviders: {
    [key: string]: [Record<string, any>];
  };
  openaiApiKey: string;
  groqApiKey: string;
  openrouterApiKey: string;
  anthropicApiKey: string;
  geminiApiKey: string;
  ollamaApiUrl: string;
  customOpenaiApiKey: string;
  customOpenaiApiUrl: string;
  customOpenaiModelName: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isSaving?: boolean;
  onSave?: (value: string) => void;
}

const Input = ({ className, isSaving, onSave, ...restProps }: InputProps) => {
  return (
    <div className="relative">
      <input
        {...restProps}
        className={cn(
          'bg-light-secondary dark:bg-dark-secondary w-full px-3 py-2 flex items-center overflow-hidden border border-light-200 dark:border-dark-200 dark:text-white rounded-lg text-sm',
          isSaving && 'pr-10',
          className,
        )}
        onBlur={(e) => onSave?.(e.target.value)}
      />
      {isSaving && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2
            size={16}
            className="animate-spin text-black/70 dark:text-white/70"
          />
        </div>
      )}
    </div>
  );
};

interface TextareaProps extends React.InputHTMLAttributes<HTMLTextAreaElement> {
  isSaving?: boolean;
  onSave?: (value: string) => void;
}

const Textarea = ({
  className,
  isSaving,
  onSave,
  placeholder,
  ...restProps
}: TextareaProps & { placeholder?: string }) => {
  return (
    <div className="relative">
      <textarea
        placeholder={placeholder}
        className="placeholder:text-sm text-sm w-full flex items-center justify-between p-3 bg-light-secondary dark:bg-dark-secondary rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
        rows={4}
        onBlur={(e) => onSave?.(e.target.value)}
        {...restProps}
      />
      {isSaving && (
        <div className="absolute right-3 top-3">
          <Loader2
            size={16}
            className="animate-spin text-black/70 dark:text-white/70"
          />
        </div>
      )}
    </div>
  );
};

const Select = ({
  className,
  options,
  ...restProps
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string; disabled?: boolean }[];
}) => {
  return (
    <select
      {...restProps}
      className={cn(
        'bg-light-secondary dark:bg-dark-secondary px-3 py-2 flex items-center overflow-hidden border border-light-200 dark:border-dark-200 dark:text-white rounded-lg text-sm',
        className,
      )}
    >
      {options.map(({ label, value, disabled }) => (
        <option key={value} value={value} disabled={disabled}>
          {label}
        </option>
      ))}
    </select>
  );
};



const SettingsSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col space-y-4 p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-xl border border-light-200 dark:border-dark-200">
    <h2 className="text-black/90 dark:text-white/90 font-medium">{title}</h2>
    {children}
  </div>
);

type TabType = 'appearance' | 'automaticSearch' | 'systemInstructions' | 'modelSettings' | 'apiKeys' | 'personalization';

const tabs = [
  { id: 'appearance' as TabType, label: 'Appearance', icon: Palette },
  { id: 'automaticSearch' as TabType, label: 'Automatic Search', icon: Search },
  { id: 'systemInstructions' as TabType, label: 'System Instructions', icon: FileText },
  { id: 'modelSettings' as TabType, label: 'Model Settings', icon: Brain },
  { id: 'apiKeys' as TabType, label: 'API Keys', icon: Key },
  { id: 'personalization' as TabType, label: 'Personalization', icon: User },
];

const Page = () => {
  const { t, currentLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [config, setConfig] = useState<SettingsType | null>(null);
  const [chatModels, setChatModels] = useState<Record<string, any>>({});
  const [embeddingModels, setEmbeddingModels] = useState<Record<string, any>>(
    {},
  );
  const [selectedChatModelProvider, setSelectedChatModelProvider] = useState<
    string | null
  >(null);
  const [selectedChatModel, setSelectedChatModel] = useState<string | null>(
    null,
  );
  const [selectedEmbeddingModelProvider, setSelectedEmbeddingModelProvider] =
    useState<string | null>(null);
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [automaticImageSearch, setAutomaticImageSearch] = useState(false);
  const [automaticVideoSearch, setAutomaticVideoSearch] = useState(false);
  const [systemInstructions, setSystemInstructions] = useState<string>('');
  const [introduceYourself, setIntroduceYourself] = useState<string>('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoading(true);
      const res = await fetch(`/api/config`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = (await res.json()) as SettingsType;
      setConfig(data);

      const chatModelProvidersKeys = Object.keys(data.chatModelProviders || {});
      const embeddingModelProvidersKeys = Object.keys(
        data.embeddingModelProviders || {},
      );

      const defaultChatModelProvider =
        chatModelProvidersKeys.length > 0 ? chatModelProvidersKeys[0] : '';
      const defaultEmbeddingModelProvider =
        embeddingModelProvidersKeys.length > 0
          ? embeddingModelProvidersKeys[0]
          : '';

      const chatModelProvider =
        localStorage.getItem('chatModelProvider') ||
        defaultChatModelProvider ||
        '';
      const chatModel =
        localStorage.getItem('chatModel') ||
        (data.chatModelProviders &&
        data.chatModelProviders[chatModelProvider]?.length > 0
          ? data.chatModelProviders[chatModelProvider][0].name
          : undefined) ||
        '';
      const embeddingModelProvider =
        localStorage.getItem('embeddingModelProvider') ||
        defaultEmbeddingModelProvider ||
        '';
      const embeddingModel =
        localStorage.getItem('embeddingModel') ||
        (data.embeddingModelProviders &&
          data.embeddingModelProviders[embeddingModelProvider]?.[0].name) ||
        '';

      setSelectedChatModelProvider(chatModelProvider);
      setSelectedChatModel(chatModel);
      setSelectedEmbeddingModelProvider(embeddingModelProvider);
      setSelectedEmbeddingModel(embeddingModel);
      setChatModels(data.chatModelProviders || {});
      setEmbeddingModels(data.embeddingModelProviders || {});

      setAutomaticImageSearch(
        localStorage.getItem('autoImageSearch') === 'true',
      );
      setAutomaticVideoSearch(
        localStorage.getItem('autoVideoSearch') === 'true',
      );

      setSystemInstructions(localStorage.getItem('systemInstructions') || '');
      setIntroduceYourself(localStorage.getItem('introduceYourself') || '');
      setLocationEnabled(localStorage.getItem('locationEnabled') === 'true');
      setUserLocation(localStorage.getItem('userLocation') || '');

      setIsLoading(false);
    };

    fetchConfig();
  }, []);

  const saveConfig = async (key: string, value: any) => {
    setSavingStates((prev) => ({ ...prev, [key]: true }));

    try {
      const updatedConfig = {
        ...config,
        [key]: value,
      } as SettingsType;

      const response = await fetch(`/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to update config');
      }

      setConfig(updatedConfig);

      if (
        key.toLowerCase().includes('api') ||
        key.toLowerCase().includes('url')
      ) {
        const res = await fetch(`/api/config`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch updated config');
        }

        const data = await res.json();

        setChatModels(data.chatModelProviders || {});
        setEmbeddingModels(data.embeddingModelProviders || {});

        const currentChatProvider = selectedChatModelProvider;
        const newChatProviders = Object.keys(data.chatModelProviders || {});

        if (!currentChatProvider && newChatProviders.length > 0) {
          const firstProvider = newChatProviders[0];
          const firstModel = data.chatModelProviders[firstProvider]?.[0]?.name;

          if (firstModel) {
            setSelectedChatModelProvider(firstProvider);
            setSelectedChatModel(firstModel);
            localStorage.setItem('chatModelProvider', firstProvider);
            localStorage.setItem('chatModel', firstModel);
          }
        } else if (
          currentChatProvider &&
          (!data.chatModelProviders ||
            !data.chatModelProviders[currentChatProvider] ||
            !Array.isArray(data.chatModelProviders[currentChatProvider]) ||
            data.chatModelProviders[currentChatProvider].length === 0)
        ) {
          const firstValidProvider = Object.entries(
            data.chatModelProviders || {},
          ).find(
            ([_, models]) => Array.isArray(models) && models.length > 0,
          )?.[0];

          if (firstValidProvider) {
            setSelectedChatModelProvider(firstValidProvider);
            setSelectedChatModel(
              data.chatModelProviders[firstValidProvider][0].name,
            );
            localStorage.setItem('chatModelProvider', firstValidProvider);
            localStorage.setItem(
              'chatModel',
              data.chatModelProviders[firstValidProvider][0].name,
            );
          } else {
            setSelectedChatModelProvider(null);
            setSelectedChatModel(null);
            localStorage.removeItem('chatModelProvider');
            localStorage.removeItem('chatModel');
          }
        }

        const currentEmbeddingProvider = selectedEmbeddingModelProvider;
        const newEmbeddingProviders = Object.keys(
          data.embeddingModelProviders || {},
        );

        if (!currentEmbeddingProvider && newEmbeddingProviders.length > 0) {
          const firstProvider = newEmbeddingProviders[0];
          const firstModel =
            data.embeddingModelProviders[firstProvider]?.[0]?.name;

          if (firstModel) {
            setSelectedEmbeddingModelProvider(firstProvider);
            setSelectedEmbeddingModel(firstModel);
            localStorage.setItem('embeddingModelProvider', firstProvider);
            localStorage.setItem('embeddingModel', firstModel);
          }
        } else if (
          currentEmbeddingProvider &&
          (!data.embeddingModelProviders ||
            !data.embeddingModelProviders[currentEmbeddingProvider] ||
            !Array.isArray(
              data.embeddingModelProviders[currentEmbeddingProvider],
            ) ||
            data.embeddingModelProviders[currentEmbeddingProvider].length === 0)
        ) {
          const firstValidProvider = Object.entries(
            data.embeddingModelProviders || {},
          ).find(
            ([_, models]) => Array.isArray(models) && models.length > 0,
          )?.[0];

          if (firstValidProvider) {
            setSelectedEmbeddingModelProvider(firstValidProvider);
            setSelectedEmbeddingModel(
              data.embeddingModelProviders[firstValidProvider][0].name,
            );
            localStorage.setItem('embeddingModelProvider', firstValidProvider);
            localStorage.setItem(
              'embeddingModel',
              data.embeddingModelProviders[firstValidProvider][0].name,
            );
          } else {
            setSelectedEmbeddingModelProvider(null);
            setSelectedEmbeddingModel(null);
            localStorage.removeItem('embeddingModelProvider');
            localStorage.removeItem('embeddingModel');
          }
        }

        setConfig(data);
      }

      if (key === 'automaticImageSearch') {
        localStorage.setItem('autoImageSearch', value.toString());
      } else if (key === 'automaticVideoSearch') {
        localStorage.setItem('autoVideoSearch', value.toString());
      } else if (key === 'chatModelProvider') {
        localStorage.setItem('chatModelProvider', value);
      } else if (key === 'chatModel') {
        localStorage.setItem('chatModel', value);
      } else if (key === 'embeddingModelProvider') {
        localStorage.setItem('embeddingModelProvider', value);
      } else if (key === 'embeddingModel') {
        localStorage.setItem('embeddingModel', value);
      } else if (key === 'systemInstructions') {
        localStorage.setItem('systemInstructions', value);
      } else if (key === 'introduceYourself') {
        localStorage.setItem('introduceYourself', value);
      } else if (key === 'locationEnabled') {
        localStorage.setItem('locationEnabled', value.toString());
      } else if (key === 'userLocation') {
        localStorage.setItem('userLocation', value);
      }
    } catch (err) {
      console.error('Failed to save:', err);
      setConfig((prev) => ({ ...prev! }));
    } finally {
      setTimeout(() => {
        setSavingStates((prev) => ({ ...prev, [key]: false }));
      }, 500);
    }
  };

  const changeLanguage = (newLanguage: string) => {
    // Save to localStorage
    localStorage.setItem('selectedLanguage', newLanguage);
    
    // Apply RTL/LTR direction
    document.documentElement.lang = newLanguage;
    if (isRTL(newLanguage)) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: newLanguage }
    }));
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get location name
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(response => response.json())
            .then(data => {
              const locationName = `${data.city || data.locality}, ${data.principalSubdivision || data.countryName}`;
              setUserLocation(locationName);
              saveConfig('userLocation', locationName);
            })
            .catch(() => {
              // Fallback to coordinates if reverse geocoding fails
              const locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              setUserLocation(locationName);
              saveConfig('userLocation', locationName);
            });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Set a default location or show error
          setUserLocation('Location not available');
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      setUserLocation('Location not supported');
    }
  };

  const renderTabContent = () => {
    if (!config) return null;

    switch (activeTab) {
      case 'appearance':
        return (
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-black/80 dark:text-white/80">
                {t('settings.theme')}
              </label>
              <ThemeSwitcher />
              <p className="text-xs text-black/50 dark:text-white/50">
                Choose between light and dark theme
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-black/80 dark:text-white/80">
                {t('settings.language')}
              </label>
              <Select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                options={Object.entries(LANGUAGES).map(([code, config]) => ({
                  value: code,
                  label: `${config.nativeName} (${config.name})`,
                }))}
              />
              <p className="text-xs text-black/50 dark:text-white/50">
                Select your preferred language for the interface
              </p>
            </div>
          </div>
        );

      case 'automaticSearch':
        return (
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between p-3 bg-light-secondary dark:bg-dark-secondary rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-light-200 dark:bg-dark-200 rounded-lg">
                  <ImagesIcon
                    size={18}
                    className="text-black/70 dark:text-white/70"
                  />
                </div>
                <div>
                  <p className="text-sm text-black/90 dark:text-white/70 font-medium">
                    {t('settings.autoImageSearch')}
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                    {t('settings.autoImageSearchDescription')}
                  </p>
                </div>
              </div>
              <Switch
                checked={automaticImageSearch}
                onChange={(checked) => {
                  setAutomaticImageSearch(checked);
                  saveConfig('automaticImageSearch', checked);
                }}
                className={cn(
                  automaticImageSearch
                    ? 'bg-[#24A0ED]'
                    : 'bg-light-200 dark:bg-dark-200',
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                )}
              >
                <span
                  className={cn(
                    automaticImageSearch
                      ? 'translate-x-6'
                      : 'translate-x-1',
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  )}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between p-3 bg-light-secondary dark:bg-dark-secondary rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-light-200 dark:bg-dark-200 rounded-lg">
                  <VideoIcon
                    size={18}
                    className="text-black/70 dark:text-white/70"
                  />
                </div>
                <div>
                  <p className="text-sm text-black/90 dark:text-white/70 font-medium">
                    {t('settings.autoVideoSearch')}
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                    {t('settings.autoVideoSearchDescription')}
                  </p>
                </div>
              </div>
              <Switch
                checked={automaticVideoSearch}
                onChange={(checked) => {
                  setAutomaticVideoSearch(checked);
                  saveConfig('automaticVideoSearch', checked);
                }}
                className={cn(
                  automaticVideoSearch
                    ? 'bg-[#24A0ED]'
                    : 'bg-light-200 dark:bg-dark-200',
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                )}
              >
                <span
                  className={cn(
                    automaticVideoSearch
                      ? 'translate-x-6'
                      : 'translate-x-1',
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  )}
                />
              </Switch>
            </div>
          </div>
        );

      case 'systemInstructions':
        return (
          <div className="flex flex-col space-y-4">
            <Textarea
              value={systemInstructions}
              isSaving={savingStates['systemInstructions']}
              placeholder={t('settings.systemInstructionsPlaceholder')}
              onChange={(e) => {
                setSystemInstructions(e.target.value);
              }}
              onSave={(value) => saveConfig('systemInstructions', value)}
            />
          </div>
        );

      case 'modelSettings':
        return (
          <div className="flex flex-col space-y-6">
            {config.chatModelProviders && (
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-black/70 dark:text-white/70 text-sm">
                    {t('settings.chatModel')}
                  </p>
                  <Select
                    value={selectedChatModelProvider ?? undefined}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedChatModelProvider(value);
                      saveConfig('chatModelProvider', value);
                      const firstModel =
                        config.chatModelProviders[value]?.[0]?.name;
                      if (firstModel) {
                        setSelectedChatModel(firstModel);
                        saveConfig('chatModel', firstModel);
                      }
                    }}
                    options={Object.keys(config.chatModelProviders).map(
                      (provider) => ({
                        value: provider,
                        label:
                          provider.charAt(0).toUpperCase() +
                          provider.slice(1),
                      }),
                    )}
                  />
                </div>

                {selectedChatModelProvider &&
                  selectedChatModelProvider != 'custom_openai' && (
                    <div className="flex flex-col space-y-1">
                      <p className="text-black/70 dark:text-white/70 text-sm">
                        {t('settings.model')}
                      </p>
                      <Select
                        value={selectedChatModel ?? undefined}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedChatModel(value);
                          saveConfig('chatModel', value);
                        }}
                        options={(() => {
                          const chatModelProvider =
                            config.chatModelProviders[
                              selectedChatModelProvider
                            ];
                          return chatModelProvider
                            ? chatModelProvider.length > 0
                              ? chatModelProvider.map((model) => ({
                                  value: model.name,
                                  label: model.displayName,
                                }))
                              : [
                                  {
                                    value: '',
                                    label: t('settings.noModelsAvailable'),
                                    disabled: true,
                                  },
                                ]
                            : [
                                {
                                  value: '',
                                  label:
                                    t('settings.invalidProvider'),
                                  disabled: true,
                                },
                              ];
                        })()}
                      />
                    </div>
                  )}

                {selectedChatModelProvider &&
                  selectedChatModelProvider === 'custom_openai' && (
                    <div className="flex flex-col space-y-4">
                      <div className="flex flex-col space-y-1">
                        <p className="text-black/70 dark:text-white/70 text-sm">
                          {t('settings.modelName')}
                        </p>
                        <Input
                          type="text"
                          placeholder={t('settings.modelName')}
                          value={config.customOpenaiModelName}
                          isSaving={savingStates['customOpenaiModelName']}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setConfig((prev) => ({
                              ...prev!,
                              customOpenaiModelName: e.target.value,
                            }));
                          }}
                          onSave={(value) =>
                            saveConfig('customOpenaiModelName', value)
                          }
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <p className="text-black/70 dark:text-white/70 text-sm">
                          {t('settings.customOpenaiApiKey')}
                        </p>
                        <Input
                          type="text"
                          placeholder={t('settings.customOpenaiApiKey')}
                          value={config.customOpenaiApiKey}
                          isSaving={savingStates['customOpenaiApiKey']}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setConfig((prev) => ({
                              ...prev!,
                              customOpenaiApiKey: e.target.value,
                            }));
                          }}
                          onSave={(value) =>
                            saveConfig('customOpenaiApiKey', value)
                          }
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <p className="text-black/70 dark:text-white/70 text-sm">
                          {t('settings.customOpenaiBaseUrl')}
                        </p>
                        <Input
                          type="text"
                          placeholder={t('settings.customOpenaiBaseUrl')}
                          value={config.customOpenaiApiUrl}
                          isSaving={savingStates['customOpenaiApiUrl']}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setConfig((prev) => ({
                              ...prev!,
                              customOpenaiApiUrl: e.target.value,
                            }));
                          }}
                          onSave={(value) =>
                            saveConfig('customOpenaiApiUrl', value)
                          }
                        />
                      </div>
                    </div>
                  )}
              </div>
            )}

            {config.embeddingModelProviders && (
              <div className="flex flex-col space-y-4 pt-4 border-t border-light-200 dark:border-dark-200">
                <div className="flex flex-col space-y-1">
                  <p className="text-black/70 dark:text-white/70 text-sm">
                    {t('settings.embeddingModel')}
                  </p>
                  <Select
                    value={selectedEmbeddingModelProvider ?? undefined}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedEmbeddingModelProvider(value);
                      saveConfig('embeddingModelProvider', value);
                      const firstModel =
                        config.embeddingModelProviders[value]?.[0]?.name;
                      if (firstModel) {
                        setSelectedEmbeddingModel(firstModel);
                        saveConfig('embeddingModel', firstModel);
                      }
                    }}
                    options={Object.keys(config.embeddingModelProviders).map(
                      (provider) => ({
                        value: provider,
                        label:
                          provider.charAt(0).toUpperCase() +
                          provider.slice(1),
                      }),
                    )}
                  />
                </div>

                {selectedEmbeddingModelProvider && (
                  <div className="flex flex-col space-y-1">
                    <p className="text-black/70 dark:text-white/70 text-sm">
                      {t('settings.model')}
                    </p>
                    <Select
                      value={selectedEmbeddingModel ?? undefined}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedEmbeddingModel(value);
                        saveConfig('embeddingModel', value);
                      }}
                      options={(() => {
                        const embeddingModelProvider =
                          config.embeddingModelProviders[
                            selectedEmbeddingModelProvider
                          ];
                        return embeddingModelProvider
                          ? embeddingModelProvider.length > 0
                            ? embeddingModelProvider.map((model) => ({
                                value: model.name,
                                label: model.displayName,
                              }))
                            : [
                                {
                                  value: '',
                                  label: t('settings.noModelsAvailable'),
                                  disabled: true,
                                },
                              ]
                          : [
                              {
                                value: '',
                                label:
                                  t('settings.invalidProvider'),
                                disabled: true,
                              },
                            ];
                      })()}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'apiKeys':
        return (
          <div className="flex flex-col space-y-8">
            {/* AI Model Providers */}
            <div className="space-y-6">
              <div className="border-b border-light-200 dark:border-dark-200 pb-2">
                <h3 className="text-lg font-semibold text-black/90 dark:text-white/90">
                  AI Model Providers
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                  Configure API keys for AI language models
                </p>
              </div>
              
              <div className="grid gap-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-black/80 dark:text-white/80">
                    OpenAI API Key
                  </label>
                  <Input
                    type="text"
                    placeholder="sk-..."
                    value={config.openaiApiKey}
                    isSaving={savingStates['openaiApiKey']}
                    onChange={(e) => {
                      setConfig((prev) => ({
                        ...prev!,
                        openaiApiKey: e.target.value,
                      }));
                    }}
                    onSave={(value) => saveConfig('openaiApiKey', value)}
                  />
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Required for GPT models from OpenAI
                  </p>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-black/80 dark:text-white/80">
                    Groq API Key
                  </label>
                  <Input
                    type="text"
                    placeholder="gsk_..."
                    value={config.groqApiKey}
                    isSaving={savingStates['groqApiKey']}
                    onChange={(e) => {
                      setConfig((prev) => ({
                        ...prev!,
                        groqApiKey: e.target.value,
                      }));
                    }}
                    onSave={(value) => saveConfig('groqApiKey', value)}
                  />
                  <p className="text-xs text-black/50 dark:text-white/50">
                    High-speed inference for Llama, Mixtral, and Gemma models
                  </p>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-black/80 dark:text-white/80">
                    OpenRouter API Key
                  </label>
                  <Input
                    type="text"
                    placeholder="sk-or-..."
                    value={config.openrouterApiKey}
                    isSaving={savingStates['openrouterApiKey']}
                    onChange={(e) => {
                      setConfig((prev) => ({
                        ...prev!,
                        openrouterApiKey: e.target.value,
                      }));
                    }}
                    onSave={(value) => saveConfig('openrouterApiKey', value)}
                  />
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Access to multiple AI models through a unified API
                  </p>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-black/80 dark:text-white/80">
                    Anthropic API Key
                  </label>
                  <Input
                    type="text"
                    placeholder="sk-ant-..."
                    value={config.anthropicApiKey}
                    isSaving={savingStates['anthropicApiKey']}
                    onChange={(e) => {
                      setConfig((prev) => ({
                        ...prev!,
                        anthropicApiKey: e.target.value,
                      }));
                    }}
                    onSave={(value) => saveConfig('anthropicApiKey', value)}
                  />
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Required for Claude models from Anthropic
                  </p>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-black/80 dark:text-white/80">
                    Google Gemini API Key
                  </label>
                  <Input
                    type="text"
                    placeholder="AI..."
                    value={config.geminiApiKey}
                    isSaving={savingStates['geminiApiKey']}
                    onChange={(e) => {
                      setConfig((prev) => ({
                        ...prev!,
                        geminiApiKey: e.target.value,
                      }));
                    }}
                    onSave={(value) => saveConfig('geminiApiKey', value)}
                  />
                  <p className="text-xs text-black/50 dark:text-white/50">
                    Required for Gemini models from Google
                  </p>
                </div>
              </div>
            </div>

            {/* Local Deployment */}
            <div className="space-y-6">
              <div className="border-b border-light-200 dark:border-dark-200 pb-2">
                <h3 className="text-lg font-semibold text-black/90 dark:text-white/90">
                  Local Deployment
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                  Configure local AI model deployment settings
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-black/80 dark:text-white/80">
                  Ollama API URL
                </label>
                <Input
                  type="text"
                  placeholder="http://localhost:11434"
                  value={config.ollamaApiUrl}
                  isSaving={savingStates['ollamaApiUrl']}
                  onChange={(e) => {
                    setConfig((prev) => ({
                      ...prev!,
                      ollamaApiUrl: e.target.value,
                    }));
                  }}
                  onSave={(value) => saveConfig('ollamaApiUrl', value)}
                />
                <p className="text-xs text-black/50 dark:text-white/50">
                  URL for your local Ollama instance (default: http://localhost:11434)
                </p>
              </div>
            </div>
          </div>
        );

      case 'personalization':
        return (
          <div className="flex flex-col space-y-8">
            {/* Introduce Yourself */}
            <div className="space-y-6">
              <div className="border-b border-light-200 dark:border-dark-200 pb-2">
                <h3 className="text-lg font-semibold text-black/90 dark:text-white/90">
                  Introduce Yourself
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                  Help AI understand your preferences and provide personalized responses
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-black/80 dark:text-white/80">
                  Tell us about yourself
                </label>
                <Textarea
                  value={introduceYourself}
                  isSaving={savingStates['introduceYourself']}
                  placeholder="e.g., I'm a software developer who loves learning new technologies. I prefer detailed explanations with code examples..."
                  onChange={(e) => {
                    setIntroduceYourself(e.target.value);
                  }}
                  onSave={(value) => saveConfig('introduceYourself', value)}
                />
                <p className="text-xs text-black/50 dark:text-white/50">
                  This information helps AI provide more relevant and personalized responses
                </p>
              </div>
            </div>

            {/* Location Settings */}
            <div className="space-y-6">
              <div className="border-b border-light-200 dark:border-dark-200 pb-2">
                <h3 className="text-lg font-semibold text-black/90 dark:text-white/90">
                  Location
                </h3>
                <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                  Enable location access for weather, local information, and personalized content
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-light-secondary dark:bg-dark-secondary rounded-lg border border-light-200 dark:border-dark-200">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-light-200 dark:bg-dark-200 rounded-lg">
                      <MapPin
                        size={18}
                        className="text-black/70 dark:text-white/70"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-black/90 dark:text-white/90 font-medium">
                        Location Access
                      </p>
                      <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                        Enter a location or enable precise location to get more accurate weather and sports
                      </p>
                    </div>
                  </div>
                  
                  {locationEnabled && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-black/60 dark:text-white/60">
                        You are sharing your location via your device
                      </p>
                      <p className="text-xs text-black/60 dark:text-white/60">
                        Device location: {userLocation || 'Detecting...'}
                      </p>
                    </div>
                  )}
                </div>
                
                <Switch
                  checked={locationEnabled}
                  onChange={(checked) => {
                    setLocationEnabled(checked);
                    saveConfig('locationEnabled', checked);
                    if (checked && !userLocation) {
                      detectLocation();
                    }
                  }}
                  className={cn(
                    locationEnabled
                      ? 'bg-[#24A0ED]'
                      : 'bg-light-200 dark:bg-dark-200',
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                  )}
                >
                  <span
                    className={cn(
                      locationEnabled
                        ? 'translate-x-6'
                        : 'translate-x-1',
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    )}
                  />
                </Switch>
              </div>
              
              {!locationEnabled && (
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-black/80 dark:text-white/80">
                    Manual Location
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your city or location"
                    value={userLocation}
                    isSaving={savingStates['userLocation']}
                    onChange={(e) => {
                      setUserLocation(e.target.value);
                    }}
                    onSave={(value) => saveConfig('userLocation', value)}
                  />
                  <p className="text-xs text-black/50 dark:text-white/50">
                    You can manually enter your location for weather and local information
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col pt-4 pb-4">
        <div className="flex items-center space-x-2">
          <Link href="/" className="lg:hidden">
            <ArrowLeft className="text-black/70 dark:text-white/70" />
          </Link>
          <div className="flex flex-row space-x-0.5 items-center">
            <SettingsIcon size={23} />
            <h1 className="text-3xl font-medium p-2">{t('settings.title')}</h1>
          </div>
        </div>
        <hr className="border-t border-[#2B2C2C] my-4 w-full" />
      </div>

      {isLoading ? (
        <div className="flex flex-row items-center justify-center min-h-[50vh]">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        </div>
      ) : (
        config && (
          <div className="flex gap-6">
            {/* Left Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-light-secondary/30 dark:bg-dark-secondary/30 rounded-xl border border-light-200 dark:border-dark-200 p-2">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
                          isActive
                            ? 'bg-[#24A0ED] text-white shadow-sm'
                            : 'text-black/70 dark:text-white/70 hover:bg-light-200 dark:hover:bg-dark-200 hover:text-black/90 dark:hover:text-white/90'
                        )}
                      >
                        <Icon size={18} className={cn(
                          'flex-shrink-0',
                          isActive ? 'text-white' : 'text-black/60 dark:text-white/60'
                        )} />
                        <span className="text-left">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-xl border border-light-200 dark:border-dark-200 p-6">
                <h2 className="text-xl font-semibold text-black/90 dark:text-white/90 mb-6">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </h2>
                {renderTabContent()}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Page;