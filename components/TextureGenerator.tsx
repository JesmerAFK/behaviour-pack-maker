import React, { useState, useCallback } from 'react';
import { generateImage } from '../services/geminiService';
import type { GeneratedTexture } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Card } from './ui/Card';

interface TextureGeneratorProps {
  packIcon: GeneratedTexture | null;
  setPackIcon: (texture: GeneratedTexture) => void;
}

export const TextureGenerator: React.FC<TextureGeneratorProps> = ({ packIcon, setPackIcon }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt) {
      setError("Prompt cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const base64Image = await generateImage(prompt);
      setPackIcon({ name: 'pack_icon', base64: base64Image });
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, setPackIcon]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Pack Icon Generator</h2>
            <p className="text-sm text-muted mb-4">
              Generate a unique 512x512px icon for your pack. It will be saved as `pack_icon.png`.
            </p>
            <div className="space-y-2">
              <Label htmlFor="texture-prompt">Icon Prompt</Label>
              <Input
                id="texture-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A glowing emerald sword on a shield"
              />
            </div>
            <Button onClick={handleGenerate} disabled={isLoading} className="mt-4 w-full">
              {isLoading ? 'Generating...' : 'Generate Icon'}
            </Button>
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          </div>
        </Card>
        
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Pack Icon</h3>
            <Card className="aspect-square">
              {packIcon ? (
                <div className="group relative w-full h-full bg-surface border border-subtle rounded-lg overflow-hidden">
                    <img src={`data:image/png;base64,${packIcon.base64}`} alt={packIcon.name} className="w-full h-full object-cover"/>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2 text-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        {packIcon.name}.png
                    </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface border border-subtle rounded-lg">
                    <p className="text-muted text-center p-4">No icon generated yet. Use the generator to create one!</p>
                </div>
              )}
            </Card>
        </div>
      </div>
    </div>
  );
};