declare module "pdf-parse/lib/pdf-parse.js" {
  function parse(buffer: Buffer): Promise<{ text: string }>;
  export default parse;
}