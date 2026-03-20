import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

// Map Expo FileSystem to Node fs.promises
const fsPromises = {
  readFile: async (path: string, options?: any) => {
    const encoding = options === 'utf8' || options?.encoding === 'utf8' ? 'utf8' : 'base64';
    const content = await FileSystem.readAsStringAsync(path, { encoding: encoding as any });
    if (encoding === 'base64') {
      return Buffer.from(content, 'base64');
    }
    return content;
  },
  writeFile: async (path: string, data: any, options?: any) => {
    let content = data;
    let encoding = 'utf8';
    
    if (Buffer.isBuffer(data)) {
      content = data.toString('base64');
      encoding = 'base64';
    } else if (typeof data === 'string') {
        if (options === 'utf8' || options?.encoding === 'utf8') {
            // content is already string
        } else {
            // defaults?
        }
    }
    
    await FileSystem.writeAsStringAsync(path, content, { encoding: encoding as any });
  },
  unlink: async (path: string) => {
    await FileSystem.deleteAsync(path);
  },
  readdir: async (path: string) => {
    return await FileSystem.readDirectoryAsync(path);
  },
  mkdir: async (path: string) => {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  },
  rmdir: async (path: string) => {
    await FileSystem.deleteAsync(path);
  },
  stat: async (path: string) => {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
    }
    return {
      type: info.isDirectory ? 'dir' : 'file',
      mode: info.isDirectory ? 16877 : 33188, // 040755 : 0100644
      size: info.size,
      ctimeMs: info.modificationTime ? info.modificationTime * 1000 : Date.now(),
      mtimeMs: info.modificationTime ? info.modificationTime * 1000 : Date.now(),
      isDirectory: () => info.isDirectory,
      isFile: () => !info.isDirectory,
      isSymbolicLink: () => false,
    };
  },
  lstat: async (path: string) => {
    return await fsPromises.stat(path);
  },
  readlink: async (path: string) => {
    throw new Error('readlink not implemented');
  },
  symlink: async (target: string, path: string) => {
    throw new Error('symlink not implemented');
  },
};

export default {
  promises: fsPromises,
};
