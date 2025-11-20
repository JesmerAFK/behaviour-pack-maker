
import React from 'react';
import type { PackConfig } from '../types';
import { parseVersionString, formatVersionArray } from '../utils/packManager';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface PackConfiguratorProps {
  config: PackConfig;
  setConfig: React.Dispatch<React.SetStateAction<PackConfig>>;
  onSave: () => void;
}

export const PackConfigurator: React.FC<PackConfiguratorProps> = ({ config, setConfig, onSave }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      [name]: value,
    }));
  };

  const handleVersionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      [name]: parseVersionString(value),
    }));
  };

  const handleDependencyChange = (index: number, field: 'module_name' | 'version', value: string) => {
    setConfig(prevConfig => {
      const newDependencies = [...prevConfig.dependencies];
      newDependencies[index] = { ...newDependencies[index], [field]: value };
      return { ...prevConfig, dependencies: newDependencies };
    });
  };

  const addDependency = () => {
    setConfig(prevConfig => ({
      ...prevConfig,
      dependencies: [...prevConfig.dependencies, { module_name: '', version: '' }],
    }));
  };

  const removeDependency = (index: number) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      dependencies: prevConfig.dependencies.filter((_, i) => i !== index),
    }));
  };

  return (
    <Card>
      <div className="p-4">
        <h2 className="text-xl font-bold text-white mb-4">Pack Configuration</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Pack Name</Label>
            <Input id="name" name="name" value={config.name} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={config.description} onChange={handleInputChange} rows={3} />
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Input id="author" name="author" value={config.author} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="version">Version</Label>
            <Input id="version" name="version" type="text" value={formatVersionArray(config.version)} onChange={handleVersionChange} placeholder="e.g., 1.0.0" />
          </div>
          <div>
            <Label htmlFor="minEngineVersion">Min Engine Version</Label>
            <Input id="minEngineVersion" name="minEngineVersion" type="text" value={formatVersionArray(config.minEngineVersion)} onChange={handleVersionChange} placeholder="e.g., 1.21.0" />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-subtle">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white">Dependencies</h3>
              <a href="https://jaylydev.github.io/scriptapi-docs/latest/" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1">
                  API Docs
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
              </a>
            </div>
            <div className="space-y-3">
                {config.dependencies && config.dependencies.map((dep, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                            <Label htmlFor={`dep-name-${index}`} className="sr-only">Module Name</Label>
                            <Input
                                id={`dep-name-${index}`}
                                placeholder="Module Name"
                                value={dep.module_name}
                                onChange={(e) => handleDependencyChange(index, 'module_name', e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                           <Label htmlFor={`dep-version-${index}`} className="sr-only">Version</Label>
                           <Input
                                id={`dep-version-${index}`}
                                placeholder="Version"
                                value={dep.version}
                                onChange={(e) => handleDependencyChange(index, 'version', e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => removeDependency(index)}
                            className="p-2 text-muted hover:text-red-400 transition-colors rounded-full"
                            aria-label="Remove dependency"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
             <Button onClick={addDependency} className="w-full mt-3 !bg-subtle hover:!bg-muted !text-gray-300">
                + Add Dependency
            </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-subtle">
             <Button onClick={onSave} className="w-full bg-primary text-white">
                Save Configuration
            </Button>
            <p className="text-xs text-muted mt-2 text-center">
                Saves the current configuration and icon to the file list.
            </p>
        </div>

      </div>
    </Card>
  );
};
