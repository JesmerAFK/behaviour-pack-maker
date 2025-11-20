
import React, { useMemo } from 'react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface FileTreeProps {
  files: { path: string }[];
  selectedPath: string;
  onSelect: (path: string) => void;
}

const FolderIcon = () => (
  <svg className="w-4 h-4 mr-2 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
  </svg>
);

const FileIcon = ({ fileName }: { fileName: string }) => {
  let color = "text-blue-400";
  if (fileName.endsWith('.json')) color = "text-yellow-200";
  if (fileName.endsWith('.js') || fileName.endsWith('.ts')) color = "text-yellow-400";
  if (fileName.endsWith('.png')) color = "text-purple-400";
  
  return (
    <svg className={`w-4 h-4 mr-2 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
      <polyline points="13 2 13 9 20 9"></polyline>
    </svg>
  );
};

const buildTree = (paths: string[]): FileNode[] => {
  const root: FileNode[] = [];

  paths.forEach(path => {
    const parts = path.split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existingNode = currentLevel.find(node => node.name === part);

      if (existingNode) {
        if (!isFile && existingNode.children) {
          currentLevel = existingNode.children;
        }
      } else {
        const newNode: FileNode = {
          name: part,
          path: isFile ? path : parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : []
        };
        currentLevel.push(newNode);
        if (!isFile && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    });
  });
  
  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: FileNode[]) => {
      nodes.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'folder' ? -1 : 1;
      });
      nodes.forEach(node => {
          if (node.children) sortNodes(node.children);
      });
  };
  
  sortNodes(root);
  return root;
};

const TreeNode: React.FC<{ node: FileNode; selectedPath: string; onSelect: (path: string) => void; depth: number }> = ({ node, selectedPath, onSelect, depth }) => {
  const isOpen = true; // Always expanded for simplicity in this version
  
  const handleDragStart = (e: React.DragEvent, path: string) => {
    // Set the drag data to the file path formatted as a reference
    e.dataTransfer.setData('text/plain', `@${path}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div>
      <div 
        draggable={node.type === 'file'}
        onDragStart={(e) => node.type === 'file' && handleDragStart(e, node.path)}
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-surface transition-colors border-l-2 border-transparent ${
          node.type === 'file' ? 'hover:border-primary/50' : ''
        } ${
          node.type === 'file' && selectedPath === node.path ? 'bg-subtle text-white border-l-primary' : 'text-gray-400'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => node.type === 'file' && onSelect(node.path)}
        title={node.type === 'file' ? "Drag to AI input to reference" : undefined}
      >
        {node.type === 'folder' ? <FolderIcon /> : <FileIcon fileName={node.name} />}
        <span className="text-sm truncate select-none">{node.name}</span>
      </div>
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.path + child.name} node={child} selectedPath={selectedPath} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ files, selectedPath, onSelect }) => {
  const tree = useMemo(() => buildTree(files.map(f => f.path)), [files]);

  return (
    <div className="flex flex-col h-full">
        <div className="px-3 py-2 font-bold text-xs text-muted uppercase tracking-wider flex justify-between items-center">
            <span>Explorer</span>
            <span className="text-[10px] font-normal opacity-50">Drag files to AI</span>
        </div>
        <div className="flex-1 overflow-y-auto">
            {tree.map(node => (
                <TreeNode key={node.path + node.name} node={node} selectedPath={selectedPath} onSelect={onSelect} depth={0} />
            ))}
        </div>
    </div>
  );
};
