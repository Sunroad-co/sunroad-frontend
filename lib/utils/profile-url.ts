export const getProfileUrl = (handle: string): string => {
  return `/@${handle}`;
};

export const getInternalProfilePath = (handle: string): string => {
  return `/u/${handle}`;
};

export const getProfileUrlAbsolute = (handle: string, origin?: string): string => {
  const base =
    origin ??
    (typeof window !== "undefined" ? window.location.origin : "");

  return `${base}${getProfileUrl(handle)}`;
};

