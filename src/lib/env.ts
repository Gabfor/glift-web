const getBaseUrl = () => {
  const directEnvUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.SITE_URL ??
    process.env.APP_URL;

  if (directEnvUrl) {
    return directEnvUrl;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    const hasProtocol = vercelUrl.startsWith("http://") || vercelUrl.startsWith("https://");
    return hasProtocol ? vercelUrl : `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
};

export const getAbsoluteUrl = (path: string) => {
  const baseUrl = getBaseUrl();

  try {
    return new URL(path, baseUrl).toString();
  } catch (error) {
    console.error("Invalid URL constructed", { path, baseUrl, error });
    return path;
  }
};
