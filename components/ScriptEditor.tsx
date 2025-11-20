
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateProjectFiles, checkScript } from '../services/geminiService';
import type { ProjectFile } from '../types';
import { FileTree } from './FileTree';
import { Button } from './ui/Button';

interface ScriptEditorProps {
  files: ProjectFile[];
  setFiles: React.Dispatch<React.SetStateAction<ProjectFile[]>>;
  selectedFile: string;
  setSelectedFile: (path: string) => void;
}

const LoadingIcon = ({ className = "h-5 w-5" }: {className?: string}) => (
    <svg className={`animate-spin text-white ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ files, setFiles, selectedFile, setSelectedFile }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const activeFileContent = files.find(f => f.path === selectedFile)?.content || '';

  const handleContentChange = (newContent: string) => {
    setFiles(prev => prev.map(f => f.path === selectedFile ? { ...f, content: newContent } : f));
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt || isLoading) return;
    setIsLoading(true);
    setExplanation(null);
    try {
      const result = await generateProjectFiles(prompt, files);
      
      if (result.files && Array.isArray(result.files)) {
          setFiles(prevFiles => {
              const newFiles = [...prevFiles];
              result.files.forEach(generatedFile => {
                  const existingIndex = newFiles.findIndex(f => f.path === generatedFile.path);
                  if (existingIndex >= 0) {
                      newFiles[existingIndex] = { ...newFiles[existingIndex], content: generatedFile.content };
                  } else {
                      newFiles.push({ path: generatedFile.path, content: generatedFile.content });
                  }
              });
              return newFiles;
          });
          
          // Determine if we should switch context
          const mainScript = result.files.find(f => f.path.includes('main.js'));
          if (mainScript) {
             setSelectedFile(mainScript.path);
          } else if (result.files.length > 0) {
             setSelectedFile(result.files[0].path);
          }
      }
      
      if (result.explanation) {
          setExplanation(result.explanation);
      }

    } catch (error) {
      console.error("Failed to generate files:", error);
      setExplanation(`Error: ${error instanceof Error ? error.message : "Failed to generate files."}`);
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  }, [prompt, isLoading, files, setFiles, setSelectedFile]);

  const handleCheckScript = useCallback(async () => {
    if (!activeFileContent) return;
    setIsChecking(true);
    setCheckResult(null);
    try {
      const result = await checkScript(activeFileContent);
      setCheckResult(result);
    } catch (error) {
      console.error("Failed to check script:", error);
      setCheckResult("An error occurred while communicating with the AI checker.");
    } finally {
      setIsChecking(false);
    }
  }, [activeFileContent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const text = e.dataTransfer.getData('text/plain');
    
    if (text) {
        const textarea = e.currentTarget;
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        
        // Insert text at cursor position or append if no selection
        const newText = prompt.substring(0, selectionStart) + text + " " + prompt.substring(selectionEnd);
        setPrompt(newText);
        
        // Adjust cursor position after state update
        requestAnimationFrame(() => {
            if (textarea) {
                const newCursorPos = selectionStart + text.length;
                textarea.selectionStart = newCursorPos;
                textarea.selectionEnd = newCursorPos;
                textarea.focus();
            }
        });
    }
  };

  // Render the editor or a placeholder
  const renderEditor = () => {
      if (!selectedFile) {
          return <div className="flex items-center justify-center h-full text-muted">Select a file to view content</div>;
      }
      
      if (selectedFile.endsWith('.png')) {
          return <div className="flex items-center justify-center h-full text-muted">Image preview not supported in editor</div>;
      }

      const lineCount = activeFileContent.split('\n').length;
      const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

      return (
        <div className="flex-1 flex flex-col relative rounded-lg border border-subtle bg-surface overflow-hidden h-full">
          <div className="bg-surface border-b border-subtle px-4 py-2 text-xs text-muted font-mono flex justify-between shrink-0">
            <span>{selectedFile}</span>
            <span>{activeFileContent.length} chars</span>
          </div>
          
          <div className="flex-1 flex relative min-h-0 bg-[#1e1e1e]">
             <div 
                ref={lineNumbersRef}
                className="hidden md:block w-12 flex-shrink-0 text-right pr-3 pt-4 pb-4 bg-[#1e1e1e] text-muted select-none font-mono text-sm leading-relaxed border-r border-subtle overflow-hidden"
            >
                {lines.map(line => (
                    <div key={line}>{line}</div>
                ))}
            </div>
            <textarea
              ref={textareaRef}
              value={activeFileContent}
              onChange={(e) => handleContentChange(e.target.value)}
              onScroll={handleScroll}
              className="flex-1 p-4 pl-3 bg-[#1e1e1e] font-mono text-gray-300 resize-none focus:outline-none text-sm leading-relaxed whitespace-pre overflow-auto"
              spellCheck={false}
              wrap="off"
            />
          </div>
        </div>
      );
  };

  return (
    <div className="flex h-full bg-background">
       {/* File Explorer Sidebar */}
       <div className="w-64 border-r border-subtle bg-surface flex-shrink-0">
           <FileTree files={files} selectedPath={selectedFile} onSelect={setSelectedFile} />
       </div>

       {/* Main Editor Area */}
       <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
             {renderEditor()}
          </div>

          {/* AI Input & Output */}
          <div className="flex flex-col gap-2 h-auto">
            <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2 text-sm text-primary">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.405 2.138a.75.75 0 01.638.92l-2.033 6.1a.75.75 0 01-1.33.001l-.85-2.55a.75.75 0 00-.4-1.033L5.28 2.97a.75.75 0 01.597-1.373l8.5 1.7a.75.75 0 011.028.841zM3.75 9.19L6.5 6.94l-2.75-2.25v4.5zM12.5 15.25a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008zM15.25 12.5a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008a.75.75 0 00-.75-.75h-.008zM12.5 11.25a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008zM9.75 15.25a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008a.75.75 0 00-.75-.75h-.008z" clipRule="evenodd" /></svg>
                  <p className="font-semibold">AI Assistant</p>
               </div>
               {selectedFile.endsWith('.js') && (
                   <Button onClick={handleCheckScript} disabled={isChecking} className="!py-1 !px-2 !text-xs !h-8">
                       {isChecking ? 'Checking...' : 'Debug Current File'}
                   </Button>
               )}
            </div>
            
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                placeholder="Ask to create files (e.g. 'Make a new items/sword.json') or modify code... (Drag files here for context)"
                className={`w-full p-3 pr-12 text-gray-300 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${isDragOver ? 'bg-surface/80 border-primary ring-1 ring-primary' : 'bg-surface border-subtle'}`}
                rows={2}
              />
              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-white hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <LoadingIcon/> : <SendIcon/>}
              </button>
            </div>

            {(explanation || checkResult) && (
                <div className="max-h-32 overflow-y-auto bg-surface border border-subtle rounded p-2 text-xs font-mono">
                    {explanation && <div className="text-green-400 mb-1">AI: {explanation}</div>}
                    {checkResult && <div className={checkResult === "No issues found." ? "text-blue-400" : "text-yellow-400"}>Debugger: {checkResult}</div>}
                </div>
            )}
          </div>
       </div>
    </div>
  );
};
