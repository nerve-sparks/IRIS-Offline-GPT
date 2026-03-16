// import ReactNativeBlobUtil from 'react-native-blob-util';

// export interface IrisModel {
//   name: string;
//   source: string;
//   destination: string;
// }

// export type DownloadState = 
//   | { status: 'Ready' }
//   | { status: 'Downloading'; progress: number; totalMB: number }
//   | { status: 'Downloaded'; path: string }
//   | { status: 'Error'; message: string };

// // This is the exact 1-to-1 copy of allModels from MainViewModel.kt
// export const ALL_MODELS: IrisModel[] = [
//   {
//     name: "Llama-3.2-1B-Instruct-Q6_K_L.gguf",
//     source: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q6_K_L.gguf?download=true",
//     destination: "Llama-3.2-1B-Instruct-Q6_K_L.gguf"
//   },
//   {
//     name: "Llama-3.2-3B-Instruct-Q4_K_L.gguf",
//     source: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_L.gguf?download=true",
//     destination: "Llama-3.2-3B-Instruct-Q4_K_L.gguf"
//   },
//   {
//     name: "stablelm-2-1_6b-chat.Q4_K_M.imx.gguf",
//     source: "https://huggingface.co/Crataco/stablelm-2-1_6b-chat-imatrix-GGUF/resolve/main/stablelm-2-1_6b-chat.Q4_K_M.imx.gguf?download=true",
//     destination: "stablelm-2-1_6b-chat.Q4_K_M.imx.gguf"
//   }
// ];

// // Helper to get the local storage path
// export const getModelPath = (filename: string) => {
//   return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${filename}`;
// };

// // Replicates the isAlreadyDownloading and getActiveDownloadId logic
// export const checkFileExists = async (filename: string): Promise<boolean> => {
//   const path = getModelPath(filename);
//   return await ReactNativeBlobUtil.fs.exists(path);
// };

// // Replicates the dm.enqueue(request) logic from Downloadable.kt
// export const downloadModel = (
//   model: IrisModel, 
//   onProgress: (progress: number, totalMB: number) => void
// ): Promise<string> => {
//   const destinationPath = getModelPath(model.destination);

//   return new Promise((resolve, reject) => {
//     ReactNativeBlobUtil.config({
//       path: destinationPath,
//       fileCache: true,
//     })
//       .fetch('GET', model.source)
//       .progress((received, total) => {
//         const percentage = Number(received) / Number(total);
//         const totalMB = Number(total) / (1024 * 1024);
//         onProgress(percentage, totalMB);
//       })
//       .then((res) => {
//         resolve(res.path());
//       })
//       .catch((error) => {
//         reject(error);
//       });
//   });
// };