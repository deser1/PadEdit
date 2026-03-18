import * as FileSystem from 'expo-file-system';

export const rootDirectory = FileSystem.documentDirectory + 'projects/';

export const ensureRootDirectory = async () => {
  const dirInfo = await FileSystem.getInfoAsync(rootDirectory);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(rootDirectory, { intermediates: true });
  }
};

export const listFiles = async (path: string = rootDirectory) => {
  await ensureRootDirectory();
  try {
    const files = await FileSystem.readDirectoryAsync(path);
    const result = await Promise.all(files.map(async (file) => {
      const fullPath = path + file;
      const info = await FileSystem.getInfoAsync(fullPath);
      return {
        name: file,
        path: fullPath,
        isDirectory: info.isDirectory,
        size: info.exists ? info.size : 0,
      };
    }));
    return result;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};

export const readFile = async (path: string) => {
  try {
    return await FileSystem.readAsStringAsync(path);
  } catch (error) {
    console.error('Error reading file:', error);
    return '';
  }
};

export const writeFile = async (path: string, content: string) => {
  try {
    await FileSystem.writeAsStringAsync(path, content);
  } catch (error) {
    console.error('Error writing file:', error);
  }
};

export const createDirectory = async (path: string) => {
  try {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  } catch (error) {
    console.error('Error creating directory:', error);
  }
};

export const deleteFile = async (path: string) => {
  try {
    await FileSystem.deleteAsync(path);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
