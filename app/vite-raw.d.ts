// Vite ?raw imports return the file contents as a plain string.
declare module "*?raw" {
  const content: string;
  export default content;
}
