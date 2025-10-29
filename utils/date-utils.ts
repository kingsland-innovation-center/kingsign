export const getDateNow = (): string => {
  return new Date().toISOString();
};

export const getDefaultFormatDate = (): string => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  const year = today.getFullYear();
  return `${month}/${day}/${year}`;
};
