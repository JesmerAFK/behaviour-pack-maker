
import React, { useState, useCallback, useRef } from 'react';
import { PackConfigurator } from './components/PackConfigurator';
import { ScriptEditor } from './components/ScriptEditor';
import { TextureGenerator } from './components/TextureGenerator';
import { generateManifest, downloadPack, importPack } from './utils/packManager';
import type { PackConfig, GeneratedTexture, ProjectFile } from './types';

const TABS = {
  FILES: 'Files',
  TEXTURE_GENERATOR: 'Pack Icon',
};

const DEFAULT_SCRIPT = `// Generated with Bedrock Pack Studio
import { world } from '@minecraft/server';

world.beforeEvents.chatSend.subscribe((eventData) => {
  const player = eventData.sender;
  if (eventData.message.toLowerCase() === 'hello') {
    player.sendMessage('Hello from your new pack!');
    eventData.cancel = true;
  }
});
`;

const DEFAULT_CONFIG: PackConfig = {
    name: 'My Awesome Pack',
    description: 'A new pack created with Bedrock Pack Studio.',
    author: 'Player',
    version: [1, 0, 0],
    minEngineVersion: [1, 21, 0],
    dependencies: [
      { module_name: '@minecraft/server', version: '2.4.0-beta' },
      { module_name: '@minecraft/server-ui', version: '2.1.0-beta' },
    ],
};

export default function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>(TABS.FILES);
  const [packConfig, setPackConfig] = useState<PackConfig>(DEFAULT_CONFIG);

  // Initialize state with a default manifest so it appears in the editor immediately
  const [files, setFiles] = useState<ProjectFile[]>(() => {
      const manifest = generateManifest(DEFAULT_CONFIG);
      return [
          { path: 'manifest.json', content: JSON.stringify(manifest, null, 2) },
          { path: 'scripts/main.js', content: DEFAULT_SCRIPT }
      ];
  });
  
  const [selectedFile, setSelectedFile] = useState<string>('scripts/main.js');

  const [packIcon, setPackIcon] = useState<GeneratedTexture | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveConfiguration = useCallback(() => {
      // 1. Generate the Manifest JSON string
      const manifest = generateManifest(packConfig);
      const manifestString = JSON.stringify(manifest, null, 2);

      setFiles(prevFiles => {
          const newFiles = [...prevFiles];

          // 2. Update or Add manifest.json
          const manifestIndex = newFiles.findIndex(f => f.path === 'manifest.json');
          if (manifestIndex !== -1) {
              newFiles[manifestIndex] = { ...newFiles[manifestIndex], content: manifestString };
          } else {
              newFiles.push({ path: 'manifest.json', content: manifestString });
          }

          // 3. Update or Add pack_icon.png (if exists)
          if (packIcon) {
              const iconIndex = newFiles.findIndex(f => f.path === 'pack_icon.png');
              const iconFile = { 
                  path: 'pack_icon.png', 
                  content: packIcon.base64, 
                  isBinary: true 
              };
              
              if (iconIndex !== -1) {
                  newFiles[iconIndex] = iconFile;
              } else {
                  newFiles.push(iconFile);
              }
          }

          return newFiles;
      });
      
      alert("Configuration and Icon saved to File List.");
  }, [packConfig, packIcon]);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const manifest = generateManifest(packConfig);
      const textures = packIcon ? [packIcon] : [];
      await downloadPack(manifest, files, textures);
    } catch (error) {
      console.error("Failed to download pack:", error);
      alert("An error occurred while creating the pack. Check the console for details.");
    } finally {
      setIsDownloading(false);
    }
  }, [packConfig, files, packIcon]);

  const triggerImport = () => {
      fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      setIsDownloading(true); // Reuse spinner state
      try {
          const { files: importedFiles, config: importedConfig, packIcon: importedIcon } = await importPack(file);
          
          setFiles(importedFiles);
          setPackConfig(importedConfig);
          setPackIcon(importedIcon);
          
          // Select the first meaningful file or manifest
          const mainScript = importedFiles.find(f => f.path.endsWith('.js') || f.path.endsWith('.json'));
          if (mainScript) {
            setSelectedFile(mainScript.path);
          } else if (importedFiles.length > 0) {
            setSelectedFile(importedFiles[0].path);
          }
          
          setActiveTab(TABS.FILES);
      } catch (error) {
          console.error("Import failed", error);
          alert("Failed to import project: " + (error instanceof Error ? error.message : "Unknown error"));
      } finally {
          setIsDownloading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };
  
  const renderActiveTab = () => {
    switch (activeTab) {
      case TABS.FILES:
        return (
            <ScriptEditor 
                files={files} 
                setFiles={setFiles} 
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
            />
        );
      case TABS.TEXTURE_GENERATOR:
        return <TextureGenerator packIcon={packIcon} setPackIcon={setPackIcon} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface p-4 shadow-lg flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 16.5C21 16.5 20 17.5 16 17.5C13 17.5 12 16.5 12 16.5C12 16.5 12 15.5 15 15.5C18 15.5 21 16.5 21 16.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 12.5C12 12.5 11 13.5 7 13.5C4 13.5 3 12.5 3 12.5C3 12.5 3 11.5 6 11.5C9 11.5 12 12.5 12 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.5 21C16.5 21 17.5 20 17.5 16C17.5 13 16.5 12 16.5 12C16.5 12 15.5 12 15.5 15C15.5 18 16.5 21 16.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12.5 12C12.5 12 13.5 11 13.5 7C13.5 4 12.5 3 12.5 3C12.5 3 11.5 3 11.5 6C11.5 9 12.5 12 12.5 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.5 21C7.5 21 8.5 20 8.5 16C8.5 13 7.5 12 7.5 12C7.5 12 6.5 12 6.5 15C6.5 18 7.5 21 7.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 16.5C3 16.5 4 17.5 8 17.5C11 17.5 12 16.5 12 16.5C12 16.5 12 15.5 9 15.5C6 15.5 3 16.5 3 16.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <h1 className="text-2xl font-bold text-white">Bedrock Pack Studio</h1>
        </div>
        <div className="flex items-center space-x-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileImport} 
                className="hidden" 
                accept=".zip,.mcpack" 
            />
            <button
                onClick={triggerImport}
                disabled={isDownloading}
                className="bg-surface border border-muted text-gray-300 hover:bg-subtle hover:text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>Import</span>
            </button>
            <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-muted disabled:cursor-not-allowed flex items-center space-x-2"
            >
            {isDownloading ? (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            )}
            <span>{isDownloading ? 'Processing...' : 'Download'}</span>
            </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row h-full overflow-hidden">
        <aside className="w-full md:w-72 lg:w-80 bg-surface p-4 border-r border-subtle overflow-y-auto">
          <PackConfigurator config={packConfig} setConfig={setPackConfig} onSave={saveConfiguration} />
        </aside>
        
        <div className="flex-1 flex flex-col bg-background">
          <nav className="flex space-x-1 border-b border-subtle bg-surface px-4">
            {Object.values(TABS).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 font-semibold transition-colors ${
                  activeTab === tab 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="flex-1 overflow-hidden">
            {renderActiveTab()}
          </div>
        </div>
      </main>
    </div>
  );
}
