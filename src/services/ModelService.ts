import RNFS from 'react-native-fs';

export interface IrisModel {
  name: string;
  source: string;
  destination: string;
  minRamMB?: number;
  expectedSpeed?: string;
}

// Ported directly from your Kotlin file!
export const ALL_MODELS: IrisModel[] = [
  {
    name: "Llama-3.2-1B-Instruct-Q6_K_L.gguf",
    source: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q6_K_L.gguf?download=true",
    destination: "Llama-3.2-1B-Instruct-Q6_K_L.gguf",
    minRamMB: 3072, // ~3GB RAM expected for 1B Q6
    expectedSpeed: "12-18 tok/s"
  },
  {
    name: "Llama-3.2-3B-Instruct-Q4_K_L.gguf",
    source: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_L.gguf?download=true",
    destination: "Llama-3.2-3B-Instruct-Q4_K_L.gguf",
    minRamMB: 5120, // ~5GB RAM expected for 3B Q4
    expectedSpeed: "6-10 tok/s"
  },
  {
    name: "stablelm-2-1_6b-chat.Q4_K_M.imx.gguf",
    source: "https://huggingface.co/Crataco/stablelm-2-1_6b-chat-imatrix-GGUF/resolve/main/stablelm-2-1_6b-chat.Q4_K_M.imx.gguf?download=true",
    destination: "stablelm-2-1_6b-chat.Q4_K_M.imx.gguf",
    minRamMB: 4096, // ~4GB RAM expected for 1.6B Q4
    expectedSpeed: "10-15 tok/s"
  }
];

export const checkFileExists = async (filename: string) => {
  return await RNFS.exists(`${RNFS.DocumentDirectoryPath}/${filename}`);
};

export const downloadModel = async (model: IrisModel, onProgress: (progress: number) => void) => {
  const path = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
  const result = RNFS.downloadFile({
    fromUrl: model.source,
    toFile: path,
    progress: (res) => {
      const percentage = res.bytesWritten / res.contentLength;
      onProgress(percentage);
    },
  });
  await result.promise;
  return path;
};