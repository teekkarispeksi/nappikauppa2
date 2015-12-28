declare module "qr-image" {
  type ECLevel = string;

  interface IOptions {
    ec_level?: ECLevel;
    type?: string;
    size?: number;
    margin?: number;
    customize?: Function;
    parse_url?: boolean;
  }

  function image(text: string, options: ECLevel | IOptions) : NodeJS.ReadableStream;
  function imageSync(text: string, options: ECLevel | IOptions): string;
  function svgObject(text: string, options: ECLevel | IOptions): any; // really object with SVG path and size
  function matrix(text: string, options: ECLevel): any[][]; // — 2D array.
}
