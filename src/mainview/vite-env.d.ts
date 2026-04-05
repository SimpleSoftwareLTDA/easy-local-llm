/// <reference types="vite/client" />

declare module "*.ico" {
  const content: string;
  export default content;
}

// Electrobun internally imports 'three' without @types/three
declare module "three";
