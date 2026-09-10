export function extractImageFromClipboard(event: ClipboardEvent): File | null {
  const items = event.clipboardData?.items;
  if (!items) {
    return null;
  }

  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }

  return null;
}
