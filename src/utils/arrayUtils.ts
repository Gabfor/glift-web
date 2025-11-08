export const haveStringArrayChanged = (
  previous: string[],
  next: string[],
) => {
  if (previous.length !== next.length) {
    return true;
  }

  return previous.some((value, index) => value !== next[index]);
};

export default haveStringArrayChanged;
