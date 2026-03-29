declare module "virtual:slides-markdown" {
  const markdown: string;
  export default markdown;
}

declare module "virtual:slides-config" {
  const config: { presenter: boolean };
  export default config;
}
