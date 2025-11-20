
import JSZip from 'jszip';
import type { PackConfig, Manifest, GeneratedTexture, ProjectFile } from '../types';

export function generateManifest(config: PackConfig): Manifest {
  const headerUUID = crypto.randomUUID();
  const dataModuleUUID = crypto.randomUUID();
  const scriptModuleUUID = crypto.randomUUID();

  return {
    format_version: 2,
    header: {
      name: `${config.name} [BP]`,
      description: config.description,
      uuid: headerUUID,
      version: config.version,
      min_engine_version: config.minEngineVersion,
    },
    modules: [
      {
        type: 'data',
        uuid: dataModuleUUID,
        version: config.version,
      },
      {
        type: 'script',
        uuid: scriptModuleUUID,
        version: config.version,
        entry: 'scripts/main.js',
      },
    ],
    dependencies: config.dependencies,
    metadata: {
      authors: [config.author],
    },
  };
}

export async function downloadPack(manifest: Manifest, files: ProjectFile[], textures: GeneratedTexture[]): Promise<void> {
    const zip = new JSZip();

    // Check if manifest exists in the file list; if so, use it. Otherwise use the generated one.
    const manifestInFiles = files.find(f => f.path === 'manifest.json');
    if (!manifestInFiles) {
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    }
    
    // Add all project files (this handles manifest.json if it exists in files, and pack_icon.png if saved)
    files.forEach(file => {
        if (file.isBinary) {
            zip.file(file.path, file.content, { base64: true });
        } else {
            zip.file(file.path, file.content);
        }
    });
  
    const packIcon = textures.find(t => t.name === 'pack_icon');
    const itemTextures = textures.filter(t => t.name !== 'pack_icon');
  
    // Add pack icon from texture generator ONLY if it's not already in files
    const iconInFiles = files.find(f => f.path === 'pack_icon.png');
    if (packIcon && !iconInFiles) {
      zip.file('pack_icon.png', packIcon.base64, { base64: true });
    }
  
    const texturesFolder = zip.folder('textures');
    if (texturesFolder) {
      if (itemTextures.length > 0) {
        for (const texture of itemTextures) {
          texturesFolder.file(`${texture.name}.png`, texture.base64, { base64: true });
        }
      }
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    const packName = manifest.header.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${packName}.mcpack`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

export async function importPack(file: File): Promise<{ files: ProjectFile[], config: PackConfig, packIcon: GeneratedTexture | null }> {
    const zip = await JSZip.loadAsync(file);
    const files: ProjectFile[] = [];
    let config: PackConfig | null = null;
    let packIcon: GeneratedTexture | null = null;

    // Helper to determine if binary
    const isBinaryFile = (path: string) => {
        const ext = path.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'tga', 'fsb', 'bin'].includes(ext || '');
    };

    const promises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;

        const promise = (async () => {
            if (relativePath === 'manifest.json') {
                const content = await zipEntry.async('string');
                files.push({ path: relativePath, content });
                try {
                    const manifest: Manifest = JSON.parse(content);
                    // Try to clean up the name if it has the suffix we usually add
                    const cleanName = manifest.header.name.endsWith(' [BP]') 
                        ? manifest.header.name.slice(0, -5) 
                        : manifest.header.name;

                    config = {
                        name: cleanName,
                        description: manifest.header.description,
                        author: manifest.metadata?.authors?.[0] || 'Unknown',
                        version: manifest.header.version,
                        minEngineVersion: manifest.header.min_engine_version,
                        dependencies: manifest.dependencies || []
                    };
                } catch (e) {
                    console.error("Failed to parse manifest", e);
                }
            } else if (relativePath === 'pack_icon.png') {
                const base64 = await zipEntry.async('base64');
                // Add to files list as binary
                files.push({ path: relativePath, content: base64, isBinary: true });
                // Set specific pack icon state for the UI preview
                packIcon = { name: 'pack_icon', base64 };
            } else {
                const isBinary = isBinaryFile(relativePath);
                const content = isBinary ? await zipEntry.async('base64') : await zipEntry.async('string');
                files.push({ path: relativePath, content, isBinary });
            }
        })();
        promises.push(promise);
    });

    await Promise.all(promises);

    if (!config) {
         // Fallback if no manifest found
         config = {
            name: file.name.replace(/\.(mcpack|zip)$/i, ''),
            description: 'Imported project',
            author: 'Unknown',
            version: [1, 0, 0],
            minEngineVersion: [1, 21, 0],
            dependencies: []
         };
    }

    return { files, config, packIcon };
}

export const parseVersionString = (version: string): [number, number, number] => {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return [1, 0, 0];
  }
  return [parts[0], parts[1], parts[2]];
};

export const formatVersionArray = (version: [number, number, number]): string => {
  return version.join('.');
};
