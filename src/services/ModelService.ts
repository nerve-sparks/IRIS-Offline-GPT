// import RNFS from 'react-native-fs';

// export interface IrisModel {
//   name: string;
//   source: string;
//   destination: string;
// }

// // 🔥 The Latest & Smartest SLMs for Mobile (2026)
// export const ALL_MODELS: IrisModel[] = [
  
//   {
//     name: "Llama-3.2 (3B) - Meta's Mobile Beast",
//     source: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf?download=true",
//     destination: "llama-3.2-3b-q4.gguf"
//   },
//   {
//     name: "Qwen 2.5 (3B) - Best All-Rounder",
//     source: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf?download=true",
//     destination: "qwen-2.5-3b-q4.gguf"
//   },
//   {
//     name: "Gemma-2 (2B) - Super Smart by Google",
//     source: "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf?download=true",
//     destination: "gemma-2-2b-q4.gguf"
//   }
// ];

// export const checkFileExists = async (filename: string) => {
//   return await RNFS.exists(`${RNFS.DocumentDirectoryPath}/${filename}`);
// };

// export const downloadModel = async (model: IrisModel, onProgress: (progress: number) => void) => {
//   const path = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
//   const result = RNFS.downloadFile({
//     fromUrl: model.source,
//     toFile: path,
//     progress: (res) => {
//       const percentage = res.bytesWritten / res.contentLength;
//       onProgress(percentage);
//     },
//   });
//   await result.promise;
//   return path;
// };




import RNFS from 'react-native-fs';

export interface IrisModel {
  name: string;
  source: string;
  destination: string;
}

// 🔥 The Latest & Smartest SLMs for Mobile (2026)
export const ALL_MODELS: IrisModel[] = [
  {
    name: "Llama-3.2 (3B) - Meta's Mobile Beast",
    source: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf?download=true",
    destination: "llama-3.2-3b-q4.gguf"
  },
  {
    name: "Qwen 2.5 (3B) - Best All-Rounder",
    source: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf?download=true",
    destination: "qwen-2.5-3b-q4.gguf"
  },
  {
    name: "Gemma-2 (2B) - Super Smart by Google",
    source: "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf?download=true",
    destination: "gemma-2-2b-q4.gguf"
  }
];

export const checkFileExists = async (filename: string) => {
  return await RNFS.exists(`${RNFS.DocumentDirectoryPath}/${filename}`);
};

export const downloadModel = async (model: IrisModel, onProgress: (progress: number) => void) => {
  const path = `${RNFS.DocumentDirectoryPath}/${model.destination}`;
  
  // 🔥 iOS REDIRECT & PROGRESS FIX 🔥
  let totalSize = 0; 

  const result = RNFS.downloadFile({
    fromUrl: model.source,
    toFile: path,
    progressInterval: 250,
    progressDivider: 1,

    // 1. Pehle check karo ki server ne size bheja ya nahi
    begin: (res) => {
      totalSize = res.contentLength;
      console.log("Download Starting... Total Size:", totalSize);
    },

    // 2. Progress calculate karte waqt safety check lagao
    progress: (res) => {
      if (totalSize > 0) {
        const percentage = res.bytesWritten / totalSize;
        onProgress(percentage);
      } else if (res.contentLength > 0) {
        // Agar begin me nahi mila toh yahan try karo
        const percentage = res.bytesWritten / res.contentLength;
        onProgress(percentage);
      }
    },
  });

  await result.promise;
  return path;
};