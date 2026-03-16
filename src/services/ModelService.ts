import RNFS from 'react-native-fs';

export interface IrisModel {
  name: string;
  source: string;
  destination: string;
}

// Ported directly from your Kotlin file!
export const ALL_MODELS: IrisModel[] = [
  {
    name: "Llama-3.2-1B-Instruct-Q6_K_L.gguf",
    source: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q6_K_L.gguf?download=true",
    destination: "Llama-3.2-1B-Instruct-Q6_K_L.gguf"
  },
  {
    name: "Llama-3.2-3B-Instruct-Q4_K_L.gguf",
    source: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_L.gguf?download=true",
    destination: "Llama-3.2-3B-Instruct-Q4_K_L.gguf"
  },
  {
    name: "stablelm-2-1_6b-chat.Q4_K_M.imx.gguf",
    source: "https://huggingface.co/Crataco/stablelm-2-1_6b-chat-imatrix-GGUF/resolve/main/stablelm-2-1_6b-chat.Q4_K_M.imx.gguf?download=true",
    destination: "stablelm-2-1_6b-chat.Q4_K_M.imx.gguf"
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