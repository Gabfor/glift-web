declare module "set-cookie-parser" {
  export function splitCookiesString(
    cookiesString: string | readonly string[],
  ): string[];
}
