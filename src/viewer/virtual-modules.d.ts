declare module "virtual:slides-data" {
  const slides: Array<{
    id: number;
    content: string;
    frontmatter: Record<string, any>;
    elements: any[];
  }>;
  export default slides;
}

declare module "virtual:slides-markdown" {
  const markdown: string;
  export default markdown;
}

declare module "virtual:slides-config" {
  const config: { presenter: boolean };
  export default config;
}
