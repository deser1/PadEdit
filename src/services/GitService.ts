import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import * as FileSystem from 'expo-file-system/legacy';
import fs from '../utils/expoFsAdapter';

const DIR = (FileSystem.documentDirectory || '') + 'projects/repo';

export const initRepo = async () => {
  await git.init({ fs, dir: DIR });
};

export const cloneRepo = async (url: string) => {
  await git.clone({
    fs,
    http,
    dir: DIR,
    url,
    singleBranch: true,
    depth: 1,
  });
};

export const pullRepo = async () => {
  await git.pull({
    fs,
    http,
    dir: DIR,
    singleBranch: true,
    author: {
      name: 'PadEdit User',
      email: 'user@padedit.com',
    },
  });
};

export const addFile = async (filepath: string) => {
  await git.add({ fs, dir: DIR, filepath });
};

export const commit = async (message: string) => {
  await git.commit({
    fs,
    dir: DIR,
    message,
    author: {
      name: 'PadEdit User',
      email: 'user@padedit.com',
    },
  });
};

export const pushRepo = async (token: string) => {
  await git.push({
    fs,
    http,
    dir: DIR,
    onAuth: () => ({ username: token }),
  });
};

export const status = async (filepath: string) => {
  return await git.status({ fs, dir: DIR, filepath });
};

export const listFiles = async () => {
  return await git.listFiles({ fs, dir: DIR });
};
