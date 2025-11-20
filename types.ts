
export interface Dependency {
  module_name: string;
  version: string;
}

export interface PackConfig {
  name: string;
  description: string;
  author: string;
  version: [number, number, number];
  minEngineVersion: [number, number, number];
  dependencies: Dependency[];
}

export interface Manifest {
  format_version: 2;
  header: {
    name: string;
    description: string;
    uuid: string;
    version: [number, number, number];
    min_engine_version: [number, number, number];
  };
  modules: {
    type: string;
    uuid: string;
    version: [number, number, number];
    entry?: string;
  }[];
  dependencies: {
    module_name: string;
    version: string;
  }[];
  metadata: {
    authors: string[];
  };
}

export interface GeneratedTexture {
  name: string;
  base64: string;
}

export interface ProjectFile {
  path: string;
  content: string;
  isBinary?: boolean;
}
